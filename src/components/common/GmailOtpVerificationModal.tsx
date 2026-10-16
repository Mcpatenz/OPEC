import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  RotateCw,
  Sparkles,
  Lock,
  ArrowRight,
  LogOut,
  Bell,
  Trash2,
  KeyRound,
  FileCheck,
  Check,
  Info,
} from 'lucide-react';
import {
  sendGmailOtp,
  verifyEnteredOtp,
  sendGmailNotification,
  getGmailOutbox,
  clearGmailOutbox,
  isEmailVerified,
  GmailOutboxEntry,
} from '../../lib/services/gmailService';
import {
  googleSignIn,
  googleLogout,
  getCurrentGoogleUser,
  isGoogleAuthenticated,
} from '../../lib/services/googleAuth';

interface GmailOtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'OTP' | 'NOTIF' | 'LOGS';
  defaultPurpose?: string;
  onVerifiedSuccess?: (email: string) => void;
}

export const GmailOtpVerificationModal: React.FC<GmailOtpVerificationModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'OTP',
  defaultPurpose = 'Email & Identity Verification',
  onVerifiedSuccess,
}) => {
  const {
    currentUser,
    registeredGmail,
    setRegisteredGmail,
    isGoogleConnected,
    googleUser,
    isGmailVerified,
    refreshGmailState,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'OTP' | 'NOTIF' | 'LOGS'>(defaultTab);
  const [targetEmail, setTargetEmail] = useState(registeredGmail);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [purpose, setPurpose] = useState(defaultPurpose);

  // OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('10:00');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Destructive Confirmation Dialog for sending email
  const [confirmPendingAction, setConfirmPendingAction] = useState<{
    type: 'SEND_OTP' | 'SEND_NOTIF';
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Notification tab state
  const [notifTemplate, setNotifTemplate] = useState<'LOAN_APPROVED' | 'PAYMENT_REMINDER' | 'COMAKER_REQ' | 'DISBURSED' | 'CUSTOM'>('LOAN_APPROVED');
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [notifSendResult, setNotifSendResult] = useState<{ success: boolean; messageId?: string; error?: string } | null>(null);

  // Outbox Logs
  const [outboxLogs, setOutboxLogs] = useState<GmailOutboxEntry[]>([]);

  // Input refs for OTP auto-advance
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync target email with registeredGmail when changed
  useEffect(() => {
    setTargetEmail(registeredGmail);
  }, [registeredGmail]);

  // Load outbox logs
  const loadLogs = () => {
    setOutboxLogs(getGmailOutbox());
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      setActiveTab(defaultTab);
      setPurpose(defaultPurpose);
      setOtpError(null);
    }
  }, [isOpen, defaultTab, defaultPurpose]);

  // Countdown timer for OTP
  useEffect(() => {
    if (!otpExpiresAt || !otpSent) return;

    const interval = setInterval(() => {
      const remainingMs = otpExpiresAt - Date.now();
      if (remainingMs <= 0) {
        setTimeRemaining('00:00');
        setOtpError('The verification code has expired. Please request a new code.');
        clearInterval(interval);
      } else {
        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        setTimeRemaining(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpExpiresAt, otpSent]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Handle Google Sign-in
  const handleGoogleConnect = async () => {
    try {
      await googleSignIn();
      refreshGmailState();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setOtpError(err?.message || 'Failed to authenticate with Google');
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await googleLogout();
      refreshGmailState();
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const handleSaveEmail = () => {
    if (!targetEmail.trim() || !targetEmail.includes('@')) {
      setOtpError('Please enter a valid email address');
      return;
    }
    setRegisteredGmail(targetEmail.trim());
    setIsEditingEmail(false);
    setOtpError(null);
    refreshGmailState();
  };

  // Trigger Send OTP with User Confirmation
  const promptSendOtp = () => {
    if (!isGoogleConnected) {
      setOtpError('Please connect your Google account first using the Sign in button above.');
      return;
    }
    if (!targetEmail || !targetEmail.includes('@')) {
      setOtpError('Please specify a valid registered Gmail address.');
      return;
    }

    setOtpError(null);
    setConfirmPendingAction({
      type: 'SEND_OTP',
      title: 'Send Verification Passcode via Gmail',
      description: `Are you sure you want to send a 6-digit one-time verification passcode to ${targetEmail} from your connected Gmail account?`,
      onConfirm: executeSendOtp,
    });
  };

  const executeSendOtp = async () => {
    setConfirmPendingAction(null);
    setIsSendingOtp(true);
    setOtpError(null);
    setOtpSuccess(false);

    try {
      const res = await sendGmailOtp({
        toEmail: targetEmail,
        recipientName: currentUser.name || 'Member',
        purpose,
      });

      if (!res.success) {
        setOtpError(res.error || 'Failed to send OTP email');
      } else {
        setOtpSent(true);
        setOtpExpiresAt(res.expiresAt || Date.now() + 600000);
        setResendCooldown(30);
        setOtpDigits(['', '', '', '', '', '']);
        loadLogs();
        refreshGmailState();
        setTimeout(() => inputRefs.current[0]?.focus(), 150);
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Error executing Gmail send request');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // OTP input handler
  const handleDigitChange = (index: number, val: string) => {
    // Only allow numbers
    const clean = val.replace(/\D/g, '');
    if (!clean && val !== '') return;

    const newDigits = [...otpDigits];

    if (clean.length > 1) {
      // Pasted string (e.g. 6 digits)
      const pasted = clean.slice(0, 6).split('');
      pasted.forEach((ch, i) => {
        if (index + i < 6) newDigits[index + i] = ch;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(5, index + pasted.length);
      inputRefs.current[nextIdx]?.focus();
    } else {
      newDigits[index] = clean;
      setOtpDigits(newDigits);
      if (clean && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify entered OTP
  const handleVerifyOtp = () => {
    const code = otpDigits.join('');
    if (code.length < 6) {
      setOtpError('Please enter all 6 digits of your verification passcode.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    const result = verifyEnteredOtp({
      email: targetEmail,
      code,
    });

    setIsVerifyingOtp(false);

    if (result.success) {
      setOtpSuccess(true);
      refreshGmailState();
      loadLogs();
      if (onVerifiedSuccess) {
        onVerifiedSuccess(targetEmail);
      }
    } else {
      setOtpError(result.error || 'Invalid verification passcode');
    }
  };

  // Trigger Send Notification with User Confirmation
  const promptSendNotification = () => {
    if (!isGoogleConnected) {
      setOtpError('Please connect your Google account first to enable Gmail delivery.');
      return;
    }

    const { title, message } = getSelectedNotificationContent();

    setConfirmPendingAction({
      type: 'SEND_NOTIF',
      title: 'Send Gmail Notification',
      description: `Confirm dispatching "${title}" to registered address ${targetEmail} from your connected Gmail account?`,
      onConfirm: executeSendNotification,
    });
  };

  const getSelectedNotificationContent = () => {
    switch (notifTemplate) {
      case 'LOAN_APPROVED':
        return {
          title: 'Loan Application Approved by Area Manager',
          message: 'Your Commodity Loan application #OPEC-2026-00031 has been officially verified and approved for ₱20,000.00. Next step: OPEC President clearance.',
          category: 'LOAN_STATUS',
          referenceId: 'OPEC-2026-00031',
          actorName: 'Engr. Manuel Roxas (Area Manager)',
        };
      case 'PAYMENT_REMINDER':
        return {
          title: 'Upcoming Payday Semi-Monthly Loan Deduction Alert',
          message: 'Friendly reminder: Semi-monthly payroll deduction of ₱983.33 for Loan Account #OPEC-LN-2026-0012 is scheduled for payroll cutoff on October 15, 2026.',
          category: 'UPCOMING_PAYMENT',
          referenceId: 'OPEC-LN-2026-0012',
          actorName: 'Branch Payroll Master',
        };
      case 'COMAKER_REQ':
        return {
          title: 'Co-Maker Guarantee Undertaking Request',
          message: 'Ana Reyes has nominated you as an official Co-Maker for an OPEC Emergency Loan of ₱15,000.00. Please review the deed of undertaking and submit endorsement.',
          category: 'COMAKER_REQUEST',
          referenceId: 'OPEC-REQ-2026-094',
          actorName: 'Ana Marie Reyes',
        };
      case 'DISBURSED':
        return {
          title: 'Loan Disbursement Released Ready for Pickup',
          message: 'Disbursement Check #BC-2026-90412 for Loan #OPEC-2026-00031 has been prepared and released. Net proceeds: ₱19,950.00 ready at ML Ozamiz 1 Cashier.',
          category: 'PAYMENT_CREDITED',
          referenceId: 'CHECK-BC-2026-90412',
          actorName: 'Elena Mendoza (Treasurer)',
        };
      case 'CUSTOM':
      default:
        return {
          title: customTitle.trim() || 'OA-GIMS Official Member Notification',
          message: customMessage.trim() || 'This is an official communication from OPEC Aurum Gems Management System regarding your member account.',
          category: 'SYSTEM',
          referenceId: `REF-${Date.now().toString().slice(-6)}`,
          actorName: currentUser.name,
        };
    }
  };

  const executeSendNotification = async () => {
    setConfirmPendingAction(null);
    setIsSendingNotif(true);
    setNotifSendResult(null);

    const { title, message, category, referenceId, actorName } = getSelectedNotificationContent();

    try {
      const res = await sendGmailNotification({
        toEmail: targetEmail,
        recipientName: currentUser.name || 'Member',
        title,
        message,
        category,
        referenceId,
        actorName,
      });

      setNotifSendResult(res);
      loadLogs();
      refreshGmailState();
    } catch (err: any) {
      setNotifSendResult({ success: false, error: err?.message || 'Failed to dispatch Gmail notification' });
    } finally {
      setIsSendingNotif(false);
    }
  };

  const verified = isEmailVerified(targetEmail);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Gmail & OTP Verification Center</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Send real Gmail notifications and 6-digit OTP verification codes via Gmail API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Authentication & Registered Email Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 space-y-3">
          
          {/* Connection Status */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Google Status:</span>
              {isGoogleConnected ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Connected ({googleUser?.email || 'Authorized'})</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Not connected (Required to send Gmail)</span>
                </div>
              )}
            </div>

            <div>
              {isGoogleConnected ? (
                <button
                  onClick={handleGoogleDisconnect}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  onClick={handleGoogleConnect}
                  className="gsi-material-button shadow-xs"
                >
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">Sign in with Google</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Registered Email Binding */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200/80">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Registered Gmail:</span>
              {isEditingEmail ? (
                <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={e => setTargetEmail(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 w-full"
                    placeholder="e.g. mcpatenz45@gmail.com"
                  />
                  <button
                    onClick={handleSaveEmail}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-md"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setTargetEmail(registeredGmail);
                      setIsEditingEmail(false);
                    }}
                    className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                    {targetEmail}
                  </span>
                  <button
                    onClick={() => setIsEditingEmail(true)}
                    className="text-[11px] text-amber-600 hover:text-amber-700 underline font-medium"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {verified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>VERIFIED</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>UNVERIFIED</span>
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('OTP')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'OTP'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>1. Send Gmail OTP to Verify</span>
          </button>
          <button
            onClick={() => setActiveTab('NOTIF')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'NOTIF'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>2. Send Gmail Notifications</span>
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'LOGS'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>3. Gmail Outbox ({outboxLogs.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* Error Banner */}
          {otpError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Notice:</span> {otpError}
              </div>
              <button onClick={() => setOtpError(null)} className="text-rose-500 hover:text-rose-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: OTP VERIFICATION */}
          {activeTab === 'OTP' && (
            <div className="space-y-6">
              
              {otpSuccess ? (
                <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border-2 border-emerald-300">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-emerald-900">Email Successfully Verified!</h3>
                    <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                      The OTP code matches our cryptographic record. <strong>{targetEmail}</strong> is now marked as an official verified recipient for OPEC Aurum Gems ZASURMIS.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => {
                        setOtpSuccess(false);
                        setOtpSent(false);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      Verify Another Code
                    </button>
                    <button
                      onClick={onClose}
                      className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors"
                    >
                      Done & Close
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Action Banner */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                        Two-Factor Identity & Email Verification
                      </h4>
                      <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                        Click below to deliver a 6-digit one-time passcode to <strong>{targetEmail}</strong> via Google Gmail. Enter the code to confirm identity.
                      </p>
                    </div>
                  </div>

                  {/* Purpose Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Verification Purpose
                    </label>
                    <select
                      value={purpose}
                      onChange={e => setPurpose(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Email Address Verification">Email Address Verification</option>
                      <option value="Loan Application Submission Authorization">Loan Application Submission Authorization</option>
                      <option value="Loan Release & Disbursement Clearance">Loan Release & Disbursement Clearance</option>
                      <option value="Member Persona Security Verification">Member Persona Security Verification</option>
                    </select>
                  </div>

                  {/* Send Button or OTP Digits Input */}
                  {!otpSent ? (
                    <div className="pt-2">
                      <button
                        onClick={promptSendOtp}
                        disabled={isSendingOtp}
                        className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isSendingOtp ? (
                          <>
                            <RotateCw className="w-4 h-4 animate-spin" />
                            <span>Connecting to Gmail API & Dispatching Code...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Send 6-Digit OTP to {targetEmail}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <div className="text-center">
                        <span className="text-xs text-slate-600">Enter the 6-digit passcode sent to </span>
                        <span className="text-xs font-bold text-slate-900">{targetEmail}</span>
                        <div className="flex items-center justify-center gap-1.5 mt-1.5 text-xs font-semibold text-rose-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Code expires in {timeRemaining}</span>
                        </div>
                      </div>

                      {/* 6 Digit Input Boxes */}
                      <div className="flex justify-center items-center gap-2 sm:gap-3 py-2">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={el => { inputRefs.current[idx] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleDigitChange(idx, e.target.value)}
                            onKeyDown={e => handleKeyDown(idx, e)}
                            className="w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-mono font-bold border-2 border-slate-300 rounded-xl focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-slate-50 transition-all text-slate-900"
                          />
                        ))}
                      </div>

                      {/* Verify Button */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || otpDigits.join('').length < 6}
                          className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          {isVerifyingOtp ? (
                            <>
                              <RotateCw className="w-4 h-4 animate-spin" />
                              <span>Verifying Passcode...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Verify Passcode & Confirm</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={promptSendOtp}
                          disabled={resendCooldown > 0 || isSendingOtp}
                          className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold disabled:opacity-50 transition-colors"
                        >
                          {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          )}

          {/* TAB 2: SEND NOTIFICATIONS */}
          {activeTab === 'NOTIF' && (
            <div className="space-y-5">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Notification Template to Send to Registered Gmail
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'LOAN_APPROVED', title: 'Loan Approved Notice', sub: 'Area Manager approval update' },
                    { id: 'PAYMENT_REMINDER', title: 'Upcoming Payday Deduction', sub: 'Semi-monthly payroll alert' },
                    { id: 'COMAKER_REQ', title: 'Co-Maker Guarantee Request', sub: 'Undertaking endorsement required' },
                    { id: 'DISBURSED', title: 'Disbursement Released', sub: 'Check proceeds ready at Cashier' },
                    { id: 'CUSTOM', title: 'Custom Alert', sub: 'Compose specific custom message' },
                  ].map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => setNotifTemplate(tmpl.id as any)}
                      className={`p-3 text-left rounded-xl border transition-all text-xs cursor-pointer ${
                        notifTemplate === tmpl.id
                          ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-slate-900">{tmpl.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{tmpl.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom message composer if custom selected */}
              {notifTemplate === 'CUSTOM' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Title</label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={e => setCustomTitle(e.target.value)}
                      placeholder="e.g. Urgent OPEC Member General Assembly Notice"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Message Body</label>
                    <textarea
                      rows={3}
                      value={customMessage}
                      onChange={e => setCustomMessage(e.target.value)}
                      placeholder="Enter the official notification message to be emailed..."
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Email Preview Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Email Dispatch Preview</span>
                  <span>Recipient: {targetEmail}</span>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="text-xs font-bold text-slate-900">
                    [OPEC OA-GIMS Alert] {getSelectedNotificationContent().title}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {getSelectedNotificationContent().message}
                  </p>
                  <div className="pt-2 flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                    <span>Ref: {getSelectedNotificationContent().referenceId}</span>
                    <span>•</span>
                    <span>Sender: OA-GIMS Region 20</span>
                  </div>
                </div>
              </div>

              {/* Send Notification Button */}
              <div className="pt-2">
                <button
                  onClick={promptSendNotification}
                  disabled={isSendingNotif}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSendingNotif ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Sending Official Gmail Notification...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-amber-400" />
                      <span>Dispatch Gmail Notification to {targetEmail}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Notification Result Notice */}
              {notifSendResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                    notifSendResult.success
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {notifSendResult.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Email Dispatched!</span> Gmail Message ID:
                        <code className="ml-1.5 font-mono text-[11px] bg-emerald-100 px-1 py-0.5 rounded">
                          {notifSendResult.messageId}
                        </code>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Dispatch Failed:</span> {notifSendResult.error}
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: OUTBOX LOGS */}
          {activeTab === 'LOGS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Gmail Delivery Audit Log</h4>
                  <p className="text-[11px] text-slate-500">History of all OTP passcodes and notification emails sent</p>
                </div>
                {outboxLogs.length > 0 && (
                  <button
                    onClick={() => {
                      clearGmailOutbox();
                      loadLogs();
                    }}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Log</span>
                  </button>
                )}
              </div>

              {outboxLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No emails have been dispatched yet. Use Tabs 1 or 2 to send an OTP or notification.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  {outboxLogs.map(log => (
                    <div key={log.id} className="p-3 text-xs bg-white hover:bg-slate-50 transition-colors space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              log.status === 'SENT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="font-semibold text-slate-900">{log.subject}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>To: <strong className="text-slate-700">{log.to}</strong></span>
                        {log.messageId && (
                          <span className="font-mono text-[10px] text-slate-400">ID: {log.messageId.slice(0, 12)}...</span>
                        )}
                        {log.error && (
                          <span className="text-rose-600 text-[10px]">{log.error}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* User Confirmation Dialog for Destructive / Mutating Operation */}
        {confirmPendingAction && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{confirmPendingAction.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {confirmPendingAction.description}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setConfirmPendingAction(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPendingAction.onConfirm}
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm & Send via Gmail</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted OAuth2 Bearer via Google Workspace APIs</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
