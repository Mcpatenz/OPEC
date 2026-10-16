import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ReleaseMethod, LoanDocument, Employee } from '../../types';
import { calculateYearsOfService, evaluateLoanEligibility, validateCoMaker, evaluateReLoanEligibility } from '../../lib/loans/eligibility';
import { calculateLoanFinancials, formatPHP } from '../../lib/loans/calculator';
import { getEmployeeCoMakerCount } from '../../lib/loans/comakerLimit';
import { SignaturePadModal } from '../common/SignaturePadModal';
import {
  FileText,
  User,
  Calculator,
  Users2,
  Send,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowRight,
  ArrowLeft,
  Info,
  DollarSign,
  ShieldCheck,
  Building,
  Trash2,
  Eye,
  X,
  File,
  Image as ImageIcon,
  Plus,
  FileCheck,
  PenTool,
  Sparkles,
  Clock,
  RotateCcw,
  Mail,
  KeyRound,
} from 'lucide-react';

interface WizardProps {
  onSuccess: (appNo: string) => void;
  onCancel?: () => void;
  initialValues?: {
    productId?: string;
    amount?: number;
    termMonths?: number;
  };
}

export const LoanApplicationWizard: React.FC<WizardProps> = ({ onSuccess, onCancel, initialValues }) => {
  const {
    currentUser,
    employees,
    loanProducts,
    activeLoans,
    applications,
    applyForLoan,
    sendCoMakerRequest,
    registeredGmail,
    isGmailVerified,
    openGmailOtpModal,
  } = useApp();

  // Find applicant record
  const applicant = useMemo(() => {
    return employees.find(e => e.id === currentUser.employeeId) || employees[0];
  }, [employees, currentUser]);

  const applicantService = useMemo(() => {
    return calculateYearsOfService(applicant.dateHired);
  }, [applicant]);

  // Existing debt for applicant
  const existingBalance = useMemo(() => {
    return activeLoans
      .filter(l => l.employeeId === applicant.id && l.status === 'ACTIVE')
      .reduce((sum, l) => sum + l.balance, 0);
  }, [activeLoans, applicant]);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState(
    initialValues?.productId || loanProducts[0]?.id || ''
  );
  const selectedProduct = useMemo(() => {
    return loanProducts.find(p => p.id === selectedProductId) || loanProducts[0];
  }, [loanProducts, selectedProductId]);

  // Eligibility evaluation
  const eligibility = useMemo(() => {
    return evaluateLoanEligibility(applicant, selectedProduct, existingBalance);
  }, [applicant, selectedProduct, existingBalance]);

  // Re-Loan & Halfway Eligibility evaluation
  const reLoanEval = useMemo(() => {
    return evaluateReLoanEligibility(applicant, activeLoans, applications, selectedProduct);
  }, [applicant, activeLoans, applications, selectedProduct]);

  // Loan parameters (pre-seeded with initialValues if available)
  const [requestedAmount, setRequestedAmount] = useState<number>(
    initialValues?.amount || 20000
  );
  const [termMonths, setTermMonths] = useState<number>(
    initialValues?.termMonths || 18
  );
  const [purpose, setPurpose] = useState<string>('Commodity purchase for household & education');
  const [releaseMethod, setReleaseMethod] = useState<ReleaseMethod>('BANK_CHECK');
  const [releaseDetails, setReleaseDetails] = useState<string>('ML Ozamiz 1 Branch Manager Check');

  // Co-makers and signatures
  const [selectedCoMakers, setSelectedCoMakers] = useState<string[]>([]);
  const [coMakerSignatures, setCoMakerSignatures] = useState<
    Record<string, { signatureUrl: string; signatureDate: string }>
  >({});
  const [activeSigningCoMaker, setActiveSigningCoMaker] = useState<Employee | null>(null);
  const [coMakerRequests, setCoMakerRequests] = useState<
    Record<string, { sentAt: string }>
  >({});
  const [signingAsCoMakerId, setSigningAsCoMakerId] = useState<string | null>(null);
  const [requestNotificationToast, setRequestNotificationToast] = useState<string | null>(null);

  // Agreements
  const [agreeDeduction, setAgreeDeduction] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeCorrect, setAgreeCorrect] = useState(false);

  // Applicant Digital Signature Overlay State (allows drawing directly on device screen)
  const [applicantSignature, setApplicantSignature] = useState<{
    signatureUrl: string;
    signatureDate: string;
  } | null>({
    signatureUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="60" viewBox="0 0 220 60"><path d="M15,40 C35,15 65,10 85,38 C105,55 125,18 155,30 C175,38 190,20 205,35" fill="none" stroke="%231e3a8a" stroke-width="3" stroke-linecap="round"/><path d="M25,50 Q110,54 195,46" fill="none" stroke="%231e3a8a" stroke-width="2"/></svg>',
    signatureDate: new Date().toISOString().split('T')[0],
  });
  const [showApplicantSignatureModal, setShowApplicantSignatureModal] = useState<boolean>(false);

  // Document attachments state with preview and deletion support
  const [documents, setDocuments] = useState<LoanDocument[]>([
    {
      id: 'doc-init-1',
      name: `Latest_Payslip_${applicant.lastName}_Oct2026.pdf`,
      fileType: 'application/pdf',
      uploadedAt: new Date().toISOString().split('T')[0],
      fileSize: '1.2 MB',
      category: 'Latest Verified Payslip',
    },
    {
      id: 'doc-init-2',
      name: 'Government_Company_ID.png',
      fileType: 'image/png',
      uploadedAt: new Date().toISOString().split('T')[0],
      fileSize: '850 KB',
      category: 'Valid Government / Company ID',
      dataUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    },
  ]);

  const [uploadCategory, setUploadCategory] = useState<string>('Latest Verified Payslip');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<LoanDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Financial preview calculation
  const financials = useMemo(() => {
    return calculateLoanFinancials(requestedAmount, termMonths, selectedProduct);
  }, [requestedAmount, termMonths, selectedProduct]);

  // Available co-maker candidates (excluding applicant)
  const candidateCoMakers = useMemo(() => {
    return employees.filter(e => e.id !== applicant.id);
  }, [employees, applicant]);

  const handleSelectCoMaker = (index: number, empId: string) => {
    const updated = [...selectedCoMakers];
    updated[index] = empId;
    setSelectedCoMakers(updated.filter(Boolean));

    if (empId) {
      const coMaker = employees.find(e => e.id === empId);
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setCoMakerRequests(prev => ({
        ...prev,
        [empId]: { sentAt: nowTime },
      }));

      if (sendCoMakerRequest) {
        sendCoMakerRequest(
          `${applicant.firstName} ${applicant.lastName}`,
          empId,
          requestedAmount
        );
      }

      setRequestNotificationToast(
        `✓ Endorsement & signature request dispatched to ${coMaker?.firstName} ${coMaker?.lastName} (${coMaker?.employeeNumber})!`
      );
      setTimeout(() => setRequestNotificationToast(null), 4500);
    }
  };

  const handleRemoveCoMaker = (empId: string) => {
    setSelectedCoMakers(prev => prev.filter(id => id !== empId));
    setCoMakerRequests(prev => {
      const copy = { ...prev };
      delete copy[empId];
      return copy;
    });
    if (signingAsCoMakerId === empId) {
      setSigningAsCoMakerId(null);
    }
  };

  const isCoMakerValid = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return { valid: false, reason: 'Not found' };
    return validateCoMaker(
      emp,
      applicant,
      selectedCoMakers.filter(id => id !== empId),
      selectedProduct.minServiceYearsCoMaker
    );
  };

  // Document upload handlers
  const handleProcessFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      const newDoc: LoanDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        fileType: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString().split('T')[0],
        fileSize: sizeStr,
        category: uploadCategory,
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
          newDoc.dataUrl = e.target?.result as string;
          setDocuments(prev => [newDoc, ...prev]);
        };
        reader.readAsDataURL(file);
      } else {
        setDocuments(prev => [newDoc, ...prev]);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleProcessFiles(e.dataTransfer.files);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (previewDoc?.id === id) {
      setPreviewDoc(null);
    }
  };

  const handleAttachSample = (type: 'payslip' | 'id' | 'quotation') => {
    const now = new Date().toISOString().split('T')[0];
    if (type === 'payslip') {
      setDocuments(prev => [
        {
          id: `doc-${Date.now()}`,
          name: `Verified_M_Lhuillier_Payslip_${applicant.lastName}_Oct2026.pdf`,
          fileType: 'application/pdf',
          uploadedAt: now,
          fileSize: '1.4 MB',
          category: 'Latest Verified Payslip',
        },
        ...prev,
      ]);
    } else if (type === 'id') {
      setDocuments(prev => [
        {
          id: `doc-${Date.now()}`,
          name: `Company_Badge_ID_${applicant.employeeNumber}.png`,
          fileType: 'image/png',
          uploadedAt: now,
          fileSize: '720 KB',
          category: 'Valid Government / Company ID',
          dataUrl: applicant.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        },
        ...prev,
      ]);
    } else {
      setDocuments(prev => [
        {
          id: `doc-${Date.now()}`,
          name: 'Official_Store_Price_Quotation.pdf',
          fileType: 'application/pdf',
          uploadedAt: now,
          fileSize: '950 KB',
          category: 'Commodity Price Quotation / Bill',
        },
        ...prev,
      ]);
    }
  };

  const isSelectedProductLockedMpl =
    (selectedProduct.code === 'REGULAR_MPL' || selectedProduct.id === 'prod-mpl') &&
    reLoanEval.hasActiveRegularMpl &&
    !reLoanEval.canReLoanRegularMpl;

  const canProceedStep2 = eligibility.eligible && reLoanEval.canApply && !isSelectedProductLockedMpl;
  const canProceedStep3 =
    !isSelectedProductLockedMpl &&
    requestedAmount > 0 &&
    requestedAmount <= selectedProduct.maxAmount &&
    purpose.trim().length > 3;
  const canProceedStep4 =
    selectedProduct.requiredCoMakers === 0 ||
    (selectedCoMakers.length >= selectedProduct.requiredCoMakers &&
      selectedCoMakers.every(id => isCoMakerValid(id).valid && Boolean(coMakerSignatures[id]?.signatureUrl)));
  const canProceedStep5 = releaseDetails.trim().length > 2;
  const canProceedStep6 = documents.length > 0;
  const canSubmit = agreeDeduction && agreeTerms && agreeCorrect && Boolean(applicantSignature?.signatureUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const coMakersPayload = selectedCoMakers.map(id => ({
      employeeId: id,
      signatureUrl: coMakerSignatures[id]?.signatureUrl,
      signatureDate: coMakerSignatures[id]?.signatureDate || new Date().toISOString().split('T')[0],
    }));

    const res = applyForLoan({
      employeeId: applicant.id,
      loanProductId: selectedProduct.id,
      requestedAmount,
      termMonths,
      purpose,
      coMakers: coMakersPayload,
      releaseMethod,
      releaseDetails,
      documents,
      applicantSignatureUrl: applicantSignature?.signatureUrl,
      applicantSignatureDate: applicantSignature?.signatureDate || new Date().toISOString().split('T')[0],
    });

    if (res.success && res.applicationNo) {
      onSuccess(res.applicationNo);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-amber-400 text-xs font-bold tracking-wider uppercase">
              OPEC Aurum Gems · May 2025 Form
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1">
              Employee Loan Application
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Strict compliance with OPEC credit rules, co-maker service checks, and semi-monthly payroll deductions.
            </p>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-xs text-slate-400">Applicant:</span>
            <div className="text-sm font-bold text-amber-400">{applicant.firstName} {applicant.lastName}</div>
            <div className="text-xs text-slate-400 font-mono">{applicant.employeeNumber}</div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-6 gap-2 mt-6 pt-4 border-t border-slate-700/60">
          {[
            { step: 1, label: 'Applicant' },
            { step: 2, label: 'Loan Details' },
            { step: 3, label: 'Co-Makers' },
            { step: 4, label: 'Release' },
            { step: 5, label: 'Documents' },
            { step: 6, label: 'Agreement' },
          ].map(s => (
            <div
              key={s.step}
              className={`text-center py-1.5 px-1 rounded transition-colors ${
                currentStep === s.step
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : currentStep > s.step
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-500'
              }`}
            >
              <div className="text-[10px] font-mono leading-none">Step {s.step}</div>
              <div className="text-xs truncate font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Step 1: Applicant Profile (Auto-populated & Computed) */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <User className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Step 1 — Applicant Verification</h3>
                <p className="text-xs text-slate-500">Automatically pulled from employee records & years of service calculator.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500">Employee Name</span>
                <p className="text-sm font-bold text-slate-900">{applicant.firstName} {applicant.middleName || ''} {applicant.lastName}</p>
                <p className="text-xs text-slate-600 font-mono">{applicant.employeeNumber}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Position</span>
                <p className="text-sm font-semibold text-slate-800">{applicant.position}</p>
                <p className="text-xs text-amber-700 font-medium">OPEC Member ({applicant.opecPosition || 'Member'})</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Branch & Area</span>
                <p className="text-sm font-semibold text-slate-800">ML Ozamiz 1</p>
                <p className="text-xs text-slate-600">Ozamiz Area · Region 10</p>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <span className="text-xs text-slate-500">Date Hired</span>
                <p className="text-sm font-semibold text-slate-800">{applicant.dateHired}</p>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <span className="text-xs text-slate-500">Years of Service (Computed)</span>
                <p className="text-sm font-bold text-emerald-700">{applicantService.formatted}</p>
                <p className="text-[11px] text-slate-500">({applicantService.totalDecimalYears} years)</p>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <span className="text-xs text-slate-500">Employment Status</span>
                <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${
                  applicant.employmentStatus === 'PERMANENT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {applicant.employmentStatus}
                </span>
              </div>
            </div>

            {/* Eligibility Banner */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              eligibility.eligible
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {eligibility.eligible ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold text-sm">
                  {eligibility.eligible ? 'Applicant Is Fully Eligible' : 'Eligibility Restriction Detected'}
                </span>
                <p className="text-xs mt-0.5 leading-relaxed">
                  {eligibility.eligible
                    ? `Permanent employee with over 5 years of service. Maximum loan capacity up to ${formatPHP(eligibility.maximumLoanAmount)} with up to ${eligibility.maximumTermMonths} months term.`
                    : eligibility.disqualificationReasons.join(' ')}
                </p>
                {existingBalance > 0 && (
                  <p className="text-xs mt-1 text-slate-700">
                    Existing active debt: <span className="font-mono font-bold">{formatPHP(existingBalance)}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Re-Loan Halfway Rule or Concurrent Loan Allowed Banner */}
            {selectedProduct.code === 'REGULAR_MPL' && reLoanEval.hasActiveRegularMpl && !reLoanEval.canReLoanRegularMpl && (
              <div className="p-4 rounded-xl border bg-amber-50 border-amber-300 text-amber-900 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">
                        Regular MPL Re-Loan Restricted · Active Loan #{reLoanEval.activeRegularMpl?.loanNumber}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-mono">
                        Need ≥50% Paid & ≥35% Take-Home
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">
                      {reLoanEval.reason}
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200 text-xs">
                      <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200">
                        <span className="text-[10px] text-slate-500 block">Payments Made on Regular MPL:</span>
                        <span className={`font-mono font-bold ${reLoanEval.isMoreThanHalfPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {reLoanEval.paymentPercentage.toFixed(1)}% <span className="text-[10px] text-slate-400">(≥50% required)</span>
                        </span>
                      </div>
                      <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200">
                        <span className="text-[10px] text-slate-500 block">Projected Net Take-Home Pay:</span>
                        <span className={`font-mono font-bold ${reLoanEval.has35PercentTakeHome ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {reLoanEval.takeHomePayPercentage.toFixed(1)}% <span className="text-[10px] text-slate-400">(≥35% required)</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick switch to allowed products */}
                <div className="p-3 bg-white/90 rounded-lg border border-amber-200 text-xs">
                  <span className="font-bold text-slate-800 block mb-1">
                    Permitted Alternative Facilities (Allowed with Active Regular MPL):
                  </span>
                  <p className="text-[11px] text-slate-600 mb-2">
                    Under OPEC policy, you can loan for Emergency, Commodity, Calamity Assistance, or Petty Cash while your Regular MPL is active:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {loanProducts.filter(p => p.code !== 'REGULAR_MPL').map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProductId(p.id);
                          if (requestedAmount > p.maxAmount) {
                            setRequestedAmount(p.maxAmount);
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer shadow-2xs"
                      >
                        Apply for {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Allowed concurrent loan banner for Emergency, Commodity, Calamity, Petty Cash */}
            {selectedProduct.code !== 'REGULAR_MPL' && reLoanEval.hasActiveRegularMpl && (
              <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-300 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">
                      Allowed Concurrent with Active Regular Multi-Purpose Loan
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-mono">
                      Policy Permitted
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    You have an active Regular Multi-Purpose Loan (#{reLoanEval.activeRegularMpl?.loanNumber}). Employees with active Regular MPL are permitted to loan for <strong>Emergency, Commodity, Calamity Assistance, and Petty Cash</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Re-Loan Halfway Rule Banner when qualified */}
            {selectedProduct.code === 'REGULAR_MPL' && reLoanEval.isReLoan && (
              <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-300 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      Qualified for Halfway Re-Loan (Loan #{reLoanEval.activeRegularMpl?.loanNumber})
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                      Halfway Qualified
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed">
                    Payments made are {reLoanEval.paymentPercentage.toFixed(1)}% (≥50%) and your projected take-home pay is {reLoanEval.takeHomePayPercentage.toFixed(1)}% (≥35%). The Regular Multi-Purpose re-loan button is enabled.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                disabled={!canProceedStep2}
                title={!reLoanEval.canApply ? reLoanEval.reason : undefined}
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Proceed to Loan Selection
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Loan Selection, Amount & Calculator */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <Calculator className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Step 2 — Loan Product & Financial Terms</h3>
                <p className="text-xs text-slate-500">Live calculation with 1.5% interest and semi-monthly payday deductions.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product selector & fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Loan Facility
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={e => {
                      setSelectedProductId(e.target.value);
                      const prod = loanProducts.find(p => p.id === e.target.value);
                      if (prod && requestedAmount > prod.maxAmount) {
                        setRequestedAmount(prod.maxAmount);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {loanProducts.map(p => {
                      const isMpl = p.code === 'REGULAR_MPL';
                      let statusNote = '';
                      if (isMpl && reLoanEval.hasActiveRegularMpl) {
                        statusNote = reLoanEval.canReLoanRegularMpl ? ' · (Halfway Re-Loan Qualified)' : ' · (Re-Loan Locked: <50% Paid)';
                      } else if (!isMpl && reLoanEval.hasActiveRegularMpl) {
                        statusNote = ' · (Allowed with active MPL)';
                      }
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} (Max {formatPHP(p.maxAmount)} · {p.interestRate}% int){statusNote}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">{selectedProduct.description}</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Requested Loan Amount
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-700">
                      {formatPHP(requestedAmount)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={selectedProduct.minAmount}
                    max={selectedProduct.maxAmount}
                    step={1000}
                    value={requestedAmount}
                    onChange={e => setRequestedAmount(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>Min: {formatPHP(selectedProduct.minAmount)}</span>
                    <span>Max: {formatPHP(selectedProduct.maxAmount)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Repayment Term (Months)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[6, 12, 18, 24].map(months => {
                      if (months < selectedProduct.minTermMonths || months > selectedProduct.maxTermMonths) return null;
                      return (
                        <button
                          key={months}
                          type="button"
                          onClick={() => setTermMonths(months)}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                            termMonths === months
                              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {months} mos
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Semi-monthly payroll deductions: {termMonths * 2} paydays total
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Loan Purpose / Description
                  </label>
                  <textarea
                    rows={2}
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    placeholder="Specify commodity purchase, schooling, home repairs..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Financial Computation Box */}
              <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Amortization Estimate
                    </span>
                    <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                      May 2025 Standard
                    </span>
                  </div>

                  <div className="space-y-2.5 mt-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Principal Amount:</span>
                      <span className="font-mono font-semibold">{formatPHP(financials.principal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Interest ({financials.interestRate}%):</span>
                      <span className="font-mono text-amber-400">+{formatPHP(financials.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Processing Fee:</span>
                      <span className="font-mono text-slate-400">{formatPHP(financials.processingFee)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-800">
                      <span className="text-slate-300 font-semibold">Total Repayable:</span>
                      <span className="font-mono font-bold text-white text-sm">{formatPHP(financials.totalPayable)}</span>
                    </div>
                  </div>

                  {/* Payday Deduction Highlight */}
                  <div className="mt-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">
                        Payday Salary Deduction (15th & 30th):
                      </span>
                      <span className="text-base font-bold font-mono text-amber-400">
                        {formatPHP(financials.semiMonthlyDeduction)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Deducted automatically from semi-monthly payroll over {financials.totalInstallments} paydays.
                    </p>
                  </div>

                  {/* Net Releasing */}
                  <div className="mt-3 p-3 bg-slate-800/80 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-slate-400">Net Loan Release:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {formatPHP(financials.netDisbursement)}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 mt-4 border-t border-slate-800 pt-2">
                  * Net release equals Gross Principal minus ₱{financials.processingFee} processing fee.
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                disabled={!canProceedStep3}
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm disabled:opacity-50 transition-all"
              >
                Proceed to Co-Makers
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Co-Makers Selection & Validation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
              <div className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Step 3 — Co-Maker Selection, Endorsement & Signature</h3>
                  <p className="text-xs text-slate-500">
                    OPEC Rule: Requires {selectedProduct.requiredCoMakers} co-makers with {selectedProduct.minServiceYearsCoMaker}+ years service. Max limit: 5 loans per co-maker.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                  Selected: {selectedCoMakers.length} / {selectedProduct.requiredCoMakers}
                </span>
              </div>
            </div>

            {/* Toast Notification when co-maker request is sent */}
            {requestNotificationToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{requestNotificationToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRequestNotificationToast(null)}
                  className="text-emerald-700 hover:text-emerald-950 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {selectedProduct.requiredCoMakers === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 text-xs">
                Petty Cash loans are exempt from co-maker requirements. You can proceed directly to the next step.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: selectedProduct.requiredCoMakers }).map((_, idx) => {
                    const selectedId = selectedCoMakers[idx];
                    const selectedEmp = employees.find(e => e.id === selectedId);
                    const validation = selectedId ? isCoMakerValid(selectedId) : null;
                    const signatureData = selectedId ? coMakerSignatures[selectedId] : null;

                    // Security check: Is the current user acting as the co-maker?
                    const isCurrentCoMakerUser = currentUser.employeeId === selectedEmp?.id;
                    const isActingAsCoMaker = Boolean(selectedEmp && (isCurrentCoMakerUser || signingAsCoMakerId === selectedEmp.id));
                    const reqInfo = selectedEmp ? coMakerRequests[selectedEmp.id] : null;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          selectedEmp
                            ? validation?.valid
                              ? signatureData?.signatureUrl
                                ? 'bg-emerald-50/40 border-emerald-300'
                                : 'bg-amber-50/40 border-amber-300'
                              : 'bg-rose-50/40 border-rose-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-800">
                            Co-Maker #{idx + 1}
                          </span>
                          {selectedEmp && (
                            <button
                              type="button"
                              onClick={() => {
                                handleRemoveCoMaker(selectedEmp.id);
                                setCoMakerSignatures(prev => {
                                  const copy = { ...prev };
                                  delete copy[selectedEmp.id];
                                  return copy;
                                });
                              }}
                              className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <select
                          value={selectedId || ''}
                          onChange={e => handleSelectCoMaker(idx, e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">-- Choose Eligible Co-Maker --</option>
                          {candidateCoMakers.map(cand => {
                            const svc = calculateYearsOfService(cand.dateHired);
                            const coMakerInfo = getEmployeeCoMakerCount(cand.id, applications, activeLoans);
                            const isLimitReached = coMakerInfo.isLimitReached;

                            return (
                              <option
                                key={cand.id}
                                value={cand.id}
                                disabled={isLimitReached}
                                className={isLimitReached ? 'text-slate-400 bg-slate-100 italic' : ''}
                              >
                                {cand.firstName} {cand.lastName} ({cand.employeeNumber} · {svc.formatted} · {cand.employmentStatus}
                                {isLimitReached
                                  ? ' — 🚫 LIMIT REACHED (5/5 Loans Disabled)'
                                  : ` · ${coMakerInfo.count}/5 commitments`})
                              </option>
                            );
                          })}
                        </select>

                        {selectedEmp && (
                          <div className="mt-3 space-y-2.5">
                            {/* Tenure verification badge */}
                            {validation?.valid ? (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verified: {calculateYearsOfService(selectedEmp.dateHired).formatted} service · Permanent</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-rose-700 font-medium">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{validation?.reason}</span>
                              </div>
                            )}

                            {/* Co-Maker Endorsement & Signature Container */}
                            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2.5 shadow-2xs">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <PenTool className="w-3.5 h-3.5 text-amber-600" />
                                  Co-Maker Endorsement Signature
                                </span>
                                {signatureData?.signatureUrl ? (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Signed & Approved
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-200">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    Request Dispatched
                                  </span>
                                )}
                              </div>

                              {/* Case 1: Applicant View (Strictly Display Signature Only - Cannot Click Attach or Draw) */}
                              {!isActingAsCoMaker ? (
                                signatureData?.signatureUrl ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                      <div className="flex items-center gap-2.5">
                                        <div className="h-11 w-28 bg-white border border-slate-200 rounded flex items-center justify-center p-1 shadow-2xs overflow-hidden">
                                          <img
                                            src={signatureData.signatureUrl}
                                            alt="Co-maker signature"
                                            className="max-h-full max-w-full object-contain"
                                          />
                                        </div>
                                        <div>
                                          <span className="text-xs font-bold text-slate-900 block">
                                            {selectedEmp.firstName} {selectedEmp.lastName}
                                          </span>
                                          <span className="text-[10px] text-slate-500 font-mono block">
                                            Date Signed: {signatureData.signatureDate}
                                          </span>
                                          <span className="text-[10px] text-emerald-700 font-medium">
                                            ✓ Verified Co-Maker Signature (Display Only)
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-[10px] text-slate-400 bg-slate-50/70 p-1.5 rounded text-center">
                                      Applicant View: Signature displayed for official review. Only the co-maker can affix or modify.
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 space-y-2 text-xs">
                                    <div className="flex items-start gap-2">
                                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                                      <div>
                                        <span className="font-bold text-amber-950 block text-[11px]">
                                          Signature Request Sent to {selectedEmp.firstName} {selectedEmp.lastName}
                                        </span>
                                        <p className="text-[10px] text-amber-800 mt-0.5">
                                          Request dispatched automatically to co-maker via OPEC Employee Portal {reqInfo?.sentAt ? `at ${reqInfo.sentAt}` : 'upon selection'}.
                                          At the applicant portal, only the signature will display once signed by the co-maker.
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-amber-200/80 text-[11px]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (sendCoMakerRequest) {
                                            sendCoMakerRequest(
                                              `${applicant.firstName} ${applicant.lastName}`,
                                              selectedEmp.id,
                                              requestedAmount
                                            );
                                          }
                                          setRequestNotificationToast(`✓ Notification re-dispatched to ${selectedEmp.firstName}!`);
                                          setTimeout(() => setRequestNotificationToast(null), 3500);
                                        }}
                                        className="text-amber-900 hover:text-amber-950 font-bold flex items-center gap-1"
                                      >
                                        <Send className="w-3 h-3 text-amber-700" />
                                        Resend Request
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setSigningAsCoMakerId(selectedEmp.id)}
                                        className="font-bold text-slate-900 bg-white hover:bg-slate-50 border border-amber-400 px-2 py-0.5 rounded shadow-2xs transition-colors flex items-center gap-1 text-[10px]"
                                        title="Switch perspective to simulate the co-maker signing"
                                      >
                                        <Sparkles className="w-3 h-3 text-amber-600" />
                                        Simulate Co-Maker Sign: {selectedEmp.firstName}
                                      </button>
                                    </div>
                                  </div>
                                )
                              ) : (
                                /* Case 2: Co-Maker View (Only Co-Maker Can Click Attach or Draw Signature) */
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs">
                                    <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px]">
                                      <User className="w-3.5 h-3.5 text-amber-700" />
                                      Acting as Co-Maker: {selectedEmp.firstName} {selectedEmp.lastName}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setSigningAsCoMakerId(null)}
                                      className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                                    >
                                      Back to Applicant View
                                    </button>
                                  </div>

                                  {signatureData?.signatureUrl ? (
                                    <div className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                                      <div className="flex items-center gap-2.5">
                                        <div className="h-10 w-24 bg-white border border-slate-200 rounded flex items-center justify-center p-1 shadow-2xs overflow-hidden">
                                          <img
                                            src={signatureData.signatureUrl}
                                            alt="Co-maker signature"
                                            className="max-h-full max-w-full object-contain"
                                          />
                                        </div>
                                        <div>
                                          <span className="text-[11px] font-bold text-slate-900 block">
                                            {selectedEmp.firstName} {selectedEmp.lastName}
                                          </span>
                                          <span className="text-[10px] text-slate-500 font-mono">
                                            Date Signed: {signatureData.signatureDate}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setActiveSigningCoMaker(selectedEmp)}
                                        className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 px-2.5 py-1 hover:bg-amber-100/60 rounded transition-colors"
                                      >
                                        Re-sign
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap items-center justify-between gap-2 p-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const today = new Date().toISOString().split('T')[0];
                                          setCoMakerSignatures(prev => ({
                                            ...prev,
                                            [selectedEmp.id]: {
                                              signatureUrl:
                                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M10,40 Q40,5 70,35 T130,25 T190,45" fill="none" stroke="%231e3a8a" stroke-width="3" stroke-linecap="round"/><path d="M30,48 Q90,52 170,46" fill="none" stroke="%231e3a8a" stroke-width="2"/></svg>',
                                              signatureDate: today,
                                            },
                                          }));
                                          setSigningAsCoMakerId(null);
                                        }}
                                        className="text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded transition-colors flex items-center gap-1"
                                      >
                                        <Sparkles className="w-3 h-3 text-amber-700" />
                                        Quick-Sign
                                      </button>

                                      {/* Only Co-Maker can click Attach or Draw Signature */}
                                      <button
                                        type="button"
                                        onClick={() => setActiveSigningCoMaker(selectedEmp)}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-2xs transition-all shrink-0"
                                      >
                                        <PenTool className="w-3.5 h-3.5" />
                                        Attach or Draw Signature
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                  <span>
                    <strong>OPEC Guarantee Policy:</strong> Every employee is limited to a maximum of <strong>5</strong> active co-maker roles. Once an employee reaches 5 loans, their name is automatically disabled in selection. All co-makers must approve and attach or draw their signature with date.
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                disabled={!canProceedStep4}
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm disabled:opacity-50 transition-all"
              >
                Proceed to Release Method
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Release Method */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <Building className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Step 4 — Loan Disbursement Method</h3>
                <p className="text-xs text-slate-500">Choose how the net loan proceeds will be released upon approval.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'BANK_CHECK' as ReleaseMethod, title: 'ML Ozamiz 1 Bank Check', desc: 'Manager Check issued at branch accounting' },
                { id: 'ML_KWARTA_PADALA' as ReleaseMethod, title: 'ML Kwarta Padala', desc: 'Direct payout pin claimable at any ML branch' },
                { id: 'BPI_ATM_DEPOSIT' as ReleaseMethod, title: 'BPI Payroll ATM Deposit', desc: 'Direct credit to employee bank account' },
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setReleaseMethod(opt.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    releaseMethod === opt.id
                      ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{opt.title}</span>
                    <input
                      type="radio"
                      checked={releaseMethod === opt.id}
                      onChange={() => setReleaseMethod(opt.id)}
                      className="accent-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">{opt.desc}</p>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Release Specifics / Account Information
              </label>
              <input
                type="text"
                value={releaseDetails}
                onChange={e => setReleaseDetails(e.target.value)}
                placeholder="e.g. Account No., Branch release location, contact verification..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                disabled={!canProceedStep5}
                onClick={() => setCurrentStep(5)}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm disabled:opacity-50 transition-all"
              >
                Proceed to Documents
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Interactive Document Upload Zone with Preview & Deletion */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Step 5 — Document Upload Zone</h3>
                  <p className="text-xs text-slate-500">
                    Attach required payslips, government/company IDs, and quotations with live preview and removal.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                {documents.length} File{documents.length !== 1 ? 's' : ''} Attached
              </span>
            </div>

            {/* Document Category & Quick Sample Attachments */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  Document Type:
                </label>
                <select
                  value={uploadCategory}
                  onChange={e => setUploadCategory(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
                >
                  <option value="Latest Verified Payslip">Latest Verified Payslip (Mandatory)</option>
                  <option value="Valid Government / Company ID">Valid Government / Company ID</option>
                  <option value="Commodity Price Quotation / Bill">Commodity Price Quotation / Bill</option>
                  <option value="Co-Maker Signed Undertaking">Co-Maker Signed Undertaking</option>
                  <option value="Proof of Billing / Residence">Proof of Billing / Residence</option>
                  <option value="Other Supporting Document">Other Supporting Document</option>
                </select>
              </div>

              {/* One-click Sample attachment triggers */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400">Quick Attach:</span>
                <button
                  type="button"
                  onClick={() => handleAttachSample('payslip')}
                  className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 shadow-2xs"
                >
                  + Sample Payslip
                </button>
                <button
                  type="button"
                  onClick={() => handleAttachSample('id')}
                  className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 shadow-2xs"
                >
                  + Sample ID
                </button>
                <button
                  type="button"
                  onClick={() => handleAttachSample('quotation')}
                  className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 shadow-2xs"
                >
                  + Sample Quotation
                </button>
              </div>
            </div>

            {/* Interactive Drag & Drop Upload Zone */}
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-amber-500 hover:bg-slate-50/80 bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={e => handleProcessFiles(e.target.files)}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Click to upload or drag & drop documents here
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Category: <strong className="text-amber-800">{uploadCategory}</strong> · Supports PDF, PNG, JPG (up to 10MB)
                  </p>
                </div>
                <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-400">
                  <span>✓ Encrypted Storage</span>
                  <span>·</span>
                  <span>✓ Visible to Credit Committee</span>
                </div>
              </div>
            </div>

            {/* Attached Documents List with Preview and Deletion */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span>Attached Supporting Files ({documents.length})</span>
                {documents.length === 0 && (
                  <span className="text-rose-600 font-semibold">At least 1 document required to proceed</span>
                )}
              </div>

              {documents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400">
                  No documents attached yet. Please upload your latest payslip or valid company/government ID.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documents.map(doc => {
                    const isImage = doc.fileType.startsWith('image/') || !!doc.dataUrl;

                    return (
                      <div
                        key={doc.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs flex items-center justify-between gap-3 group transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Thumbnail / Icon */}
                          <div
                            onClick={() => setPreviewDoc(doc)}
                            className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                          >
                            {isImage && doc.dataUrl ? (
                              <img src={doc.dataUrl} alt={doc.name} className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-6 h-6 text-amber-600" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 truncate inline-block max-w-[200px]">
                              {doc.category || 'Supporting Document'}
                            </span>
                            <p
                              onClick={() => setPreviewDoc(doc)}
                              className="text-xs font-bold text-slate-900 truncate hover:text-amber-700 cursor-pointer mt-0.5"
                            >
                              {doc.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {doc.fileSize} · {doc.uploadedAt}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons: Preview & Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            title="Preview Document"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            title="Delete Document"
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                disabled={!canProceedStep6}
                onClick={() => setCurrentStep(6)}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm disabled:opacity-50 transition-all"
              >
                Proceed to Promissory Agreement
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Agreements & Final Submit */}
        {currentStep === 6 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Step 6 — Promissory Agreement & Sign-Off</h3>
                <p className="text-xs text-slate-500">Legal undertaking authorizing semi-monthly payroll deduction.</p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-slate-500">Borrower:</span>
                <p className="font-bold text-slate-900">{applicant.firstName} {applicant.lastName}</p>
              </div>
              <div>
                <span className="text-slate-500">Requested Principal:</span>
                <p className="font-bold font-mono text-slate-900">{formatPHP(financials.principal)}</p>
              </div>
              <div>
                <span className="text-slate-500">Total Repayable:</span>
                <p className="font-bold font-mono text-amber-700">{formatPHP(financials.totalPayable)}</p>
              </div>
              <div>
                <span className="text-slate-500">Payday Deduction:</span>
                <p className="font-bold font-mono text-emerald-700">{formatPHP(financials.semiMonthlyDeduction)}</p>
              </div>
            </div>

            {/* Legal Declarations */}
            <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-200/80">
              <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={agreeDeduction}
                  onChange={e => setAgreeDeduction(e.target.checked)}
                  className="mt-0.5 accent-amber-600 w-4 h-4"
                />
                <span>
                  <strong>I hereby authorize salary deduction</strong> every payday (15th and 30th of each month) until the full principal, interest, and applicable fees are fully liquidated.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 accent-amber-600 w-4 h-4"
                />
                <span>
                  <strong>I agree to the OPEC Aurum Gems Loan Policy</strong> (May 2025 Standard) and agree that in the event of resignation, retirement, or termination, any outstanding balance shall be deducted from my final pay or co-maker guarantees.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={agreeCorrect}
                  onChange={e => setAgreeCorrect(e.target.checked)}
                  className="mt-0.5 accent-amber-600 w-4 h-4"
                />
                <span>
                  <strong>I confirm that the information provided is true and correct</strong> and all named co-makers have voluntarily consented to act as guarantors.
                </span>
              </label>
            </div>

            {/* Borrower Digital Signature Overlay Section (Allows users to draw directly on screen) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      Borrower Promissory Digital Signature & Direct Screen Sign-Off
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Draw your binding signature directly on your device screen using finger, stylus, or cursor.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {applicantSignature?.signatureUrl ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Digital Signature Affixed
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Signature Required on Screen
                    </span>
                  )}
                </div>
              </div>

              {applicantSignature?.signatureUrl ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3.5">
                    <div className="h-16 w-36 bg-white border border-slate-300 rounded-lg flex items-center justify-center p-1.5 shadow-2xs overflow-hidden">
                      <img
                        src={applicantSignature.signatureUrl}
                        alt="Applicant Digital Signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {applicant.firstName} {applicant.lastName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono block">
                        Employee ID: {applicant.employeeNumber} · Position: {applicant.position}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Affixed on {applicantSignature.signatureDate} (Direct Screen Signature)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowApplicantSignatureModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg shadow-2xs transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      Redraw Signature on Screen
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/70 border border-dashed border-amber-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-950 block">Direct Screen Signature Pending</span>
                    <p className="text-[11px] text-amber-800">
                      Click the button to open the digital signature overlay and draw directly on your screen.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        setApplicantSignature({
                          signatureUrl:
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="60" viewBox="0 0 220 60"><path d="M15,40 C35,15 65,10 85,38 C105,55 125,18 155,30 C175,38 190,20 205,35" fill="none" stroke="%231e3a8a" stroke-width="3" stroke-linecap="round"/><path d="M25,50 Q110,54 195,46" fill="none" stroke="%231e3a8a" stroke-width="2"/></svg>',
                          signatureDate: today,
                        });
                      }}
                      className="px-3 py-2 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      Quick Sign
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApplicantSignatureModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      Draw Signature on Screen
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sequential Approval Workflow Roadmap Notice */}
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Mandatory Multi-Tier Approval Flow After Step 6 Submission
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Region 20: ZASURMIS · {applicant.areaName || 'Area A'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-slate-800/90 rounded-lg border border-amber-500/40">
                  <div className="text-[10px] font-bold text-amber-400 font-mono">STAGE 1</div>
                  <div className="font-bold text-white mt-0.5">Area Manager ({applicant.areaName || 'Area A'})</div>
                  <p className="text-[10px] text-slate-400 mt-1">Area jurisdiction clearance with digital signature & date stamp</p>
                </div>

                <div className="p-2.5 bg-slate-800/90 rounded-lg border border-slate-700">
                  <div className="text-[10px] font-bold text-amber-400 font-mono">STAGE 2</div>
                  <div className="font-bold text-white mt-0.5">OPEC President</div>
                  <p className="text-[10px] text-slate-400 mt-1">Check and review by Engr. Roberto Tan with digital signature & date stamp</p>
                </div>

                <div className="p-2.5 bg-slate-800/90 rounded-lg border border-slate-700">
                  <div className="text-[10px] font-bold text-amber-400 font-mono">STAGE 3</div>
                  <div className="font-bold text-white mt-0.5">Regional Manager</div>
                  <p className="text-[10px] text-slate-400 mt-1">ZASURMIS regional endorsement with digital signature & date stamp</p>
                </div>

                <div className="p-2.5 bg-slate-800/90 rounded-lg border border-slate-700">
                  <div className="text-[10px] font-bold text-emerald-400 font-mono">STAGE 4</div>
                  <div className="font-bold text-white mt-0.5">Treasurer Release</div>
                  <p className="text-[10px] text-slate-400 mt-1">Disbursement voucher release by Elena Mendoza with digital signature</p>
                </div>
              </div>
            </div>

            {/* Identity & Registered Gmail OTP Verification Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Borrower Identity & Registered Gmail:</span>
                    <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                      {registeredGmail}
                    </span>
                    {isGmailVerified ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        OTP Verified
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                        Verification Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Loan status updates, multi-stage approvals, and promissory alerts will be dispatched directly to this email address via Gmail.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openGmailOtpModal({ defaultPurpose: 'Loan Application Submission Authorization' })}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold border border-slate-300 rounded-lg text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-2xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>{isGmailVerified ? 'Re-verify Gmail OTP' : 'Verify with Gmail OTP'}</span>
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg shadow-md disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Submit Application to Area Manager ({applicant.areaName || 'Area A'})
              </button>
            </div>
          </form>
        )}
      </div>

      {/* High-Fidelity Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {previewDoc.category || 'Supporting File'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{previewDoc.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {previewDoc.fileSize} · Uploaded {previewDoc.uploadedAt} · {previewDoc.fileType}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Preview Area */}
            <div className="bg-slate-100 rounded-xl p-4 flex items-center justify-center min-h-[300px] border border-slate-200">
              {previewDoc.dataUrl ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.name}
                  className="max-h-[420px] max-w-full rounded-lg object-contain shadow-xs"
                />
              ) : (
                <div className="text-center space-y-3 p-6 bg-white rounded-xl border border-slate-300 max-w-md w-full shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{previewDoc.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      PDF Document Verified for OPEC Credit Committee
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-left text-[11px] text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-bold text-emerald-700">Digital Copy Attached</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verification:</span>
                      <span className="font-semibold text-slate-800">Payroll & Branch Master</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  handleDeleteDocument(previewDoc.id);
                  setPreviewDoc(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove this document
              </button>

              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad Modal for Co-Maker Endorsement */}
      {activeSigningCoMaker && (
        <SignaturePadModal
          isOpen={Boolean(activeSigningCoMaker)}
          onClose={() => setActiveSigningCoMaker(null)}
          onSave={data => {
            setCoMakerSignatures(prev => ({
              ...prev,
              [activeSigningCoMaker.id]: data,
            }));
            setActiveSigningCoMaker(null);
          }}
          title={`Co-Maker Endorsement Guarantee: ${activeSigningCoMaker.firstName} ${activeSigningCoMaker.lastName}`}
          signerName={`${activeSigningCoMaker.firstName} ${activeSigningCoMaker.lastName}`}
          signerRole={`Co-Maker Guarantor (${activeSigningCoMaker.employeeNumber})`}
          initialDate={coMakerSignatures[activeSigningCoMaker.id]?.signatureDate}
          initialSignature={coMakerSignatures[activeSigningCoMaker.id]?.signatureUrl}
        />
      )}

      {/* Signature Pad Modal for Borrower / Applicant Promissory Agreement */}
      {showApplicantSignatureModal && (
        <SignaturePadModal
          isOpen={showApplicantSignatureModal}
          onClose={() => setShowApplicantSignatureModal(false)}
          onSave={data => {
            setApplicantSignature(data);
            setShowApplicantSignatureModal(false);
          }}
          title={`Borrower Promissory Signature: ${applicant.firstName} ${applicant.lastName}`}
          signerName={`${applicant.firstName} ${applicant.lastName}`}
          signerRole={`Borrower / Applicant (${applicant.employeeNumber})`}
          initialDate={applicantSignature?.signatureDate}
          initialSignature={applicantSignature?.signatureUrl}
        />
      )}
    </div>
  );
};
