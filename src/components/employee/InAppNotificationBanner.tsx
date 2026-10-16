import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../lib/loans/calculator';
import {
  BellRing,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Receipt,
  Sparkles,
  ExternalLink,
  X,
  CreditCard,
  Send,
  AlertCircle,
} from 'lucide-react';

interface InAppNotificationBannerProps {
  setActiveTab: (tab: string) => void;
  onOpenNotificationCenter: () => void;
}

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  setActiveTab,
  onOpenNotificationCenter,
}) => {
  const {
    currentUser,
    currentUserNotifications,
    markNotificationRead,
    sendTestNotification,
    applications,
  } = useApp();

  const [dismissedBannerIds, setDismissedBannerIds] = useState<string[]>([]);

  // Find priority unread alerts for this employee
  const pendingCoMakerAlert = currentUserNotifications.find(
    n => !n.read && n.category === 'COMAKER_REQUEST' && !dismissedBannerIds.includes(n.id)
  );

  const recentLoanStatusAlert = currentUserNotifications.find(
    n => !n.read && n.category === 'LOAN_STATUS' && !dismissedBannerIds.includes(n.id)
  );

  const upcomingPaymentAlert = currentUserNotifications.find(
    n => !n.read && n.category === 'UPCOMING_PAYMENT' && !dismissedBannerIds.includes(n.id)
  );

  // Check if there is an active application for this applicant in review
  const latestPendingApplication = applications.find(
    a => a.employeeId === currentUser.employeeId && a.status !== 'DRAFT' && a.status !== 'FULLY_PAID' && a.status !== 'CLOSED' && a.status !== 'REJECTED'
  );

  const unreadCount = currentUserNotifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      {/* 1. URGENT ACTION REQUIRED: Co-Maker Request or Pending Signature */}
      {pendingCoMakerAlert && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border-2 border-amber-500 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0 shadow-sm mt-0.5">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 shadow-2xs">
                  Action Required
                </span>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  Co-Maker Guarantee Request
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  · {pendingCoMakerAlert.timestamp.split(' ')[1] || 'Today'}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                {pendingCoMakerAlert.title}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
                {pendingCoMakerAlert.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => {
                markNotificationRead(pendingCoMakerAlert.id);
                setActiveTab('emp-applications');
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>Review & Sign</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDismissedBannerIds(prev => [...prev, pendingCoMakerAlert.id])}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. LOAN STATUS ALERT BANNER */}
      {(recentLoanStatusAlert || (latestPendingApplication && !pendingCoMakerAlert)) && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border-2 border-emerald-500 dark:border-emerald-500/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-600 text-white font-bold shrink-0 shadow-sm mt-0.5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-600 text-white shadow-2xs">
                  Loan Status Alert
                </span>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  {recentLoanStatusAlert ? 'Status Progression' : 'Active Pipeline Review'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  · {latestPendingApplication?.applicationNo || 'Application'}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                {recentLoanStatusAlert ? recentLoanStatusAlert.title : `Application ${latestPendingApplication?.applicationNo}: ${latestPendingApplication?.status?.replace(/_/g, ' ')}`}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
                {recentLoanStatusAlert
                  ? recentLoanStatusAlert.message
                  : `Your loan request for ${formatPHP(latestPendingApplication?.requestedAmount || 0)} is actively advancing through OPEC approval hierarchy (Area Manager → President → Regional Manager → Treasurer).`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => {
                if (recentLoanStatusAlert) markNotificationRead(recentLoanStatusAlert.id);
                setActiveTab('emp-applications');
              }}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>View Timeline</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            {recentLoanStatusAlert && (
              <button
                onClick={() => setDismissedBannerIds(prev => [...prev, recentLoanStatusAlert.id])}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. UPCOMING PAYDAY NOTIFICATION BANNER */}
      {upcomingPaymentAlert && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border-2 border-rose-500 dark:border-rose-500/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-rose-600 text-white font-bold shrink-0 shadow-sm mt-0.5">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-rose-600 text-white shadow-2xs">
                  Upcoming Payday Alert
                </span>
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                  Semi-Monthly Salary Deduction
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  · Auto-Payroll
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                {upcomingPaymentAlert.title}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
                {upcomingPaymentAlert.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => {
                markNotificationRead(upcomingPaymentAlert.id);
                setActiveTab('emp-loans');
              }}
              className="px-4 py-2.5 bg-rose-700 hover:bg-rose-600 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>View Amortization</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDismissedBannerIds(prev => [...prev, upcomingPaymentAlert.id])}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Notification Hub Strip with Clear Dark/Light Contrast */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-400/40 flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                Member Notification Alerts Hub
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                {unreadCount} Unread
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Live updates for loan status transitions, co-maker endorsement requests & salary deductions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Simulation triggers */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Test Alerts:</span>
            <button
              onClick={() => sendTestNotification('LOAN_STATUS', currentUser.employeeId)}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/80 hover:text-emerald-700 dark:hover:text-emerald-300 rounded text-slate-700 dark:text-slate-200 font-bold transition-colors border border-slate-200 dark:border-slate-600 cursor-pointer"
              title="Test Loan Status alert"
            >
              Status
            </button>
            <button
              onClick={() => sendTestNotification('COMAKER_REQUEST', currentUser.employeeId)}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/80 hover:text-amber-800 dark:hover:text-amber-300 rounded text-slate-700 dark:text-slate-200 font-bold transition-colors border border-slate-200 dark:border-slate-600 cursor-pointer"
              title="Test Co-Maker request alert"
            >
              Co-Maker
            </button>
            <button
              onClick={() => sendTestNotification('UPCOMING_PAYMENT', currentUser.employeeId)}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/80 hover:text-rose-700 dark:hover:text-rose-300 rounded text-slate-700 dark:text-slate-200 font-bold transition-colors border border-slate-200 dark:border-slate-600 cursor-pointer"
              title="Test Upcoming Payment alert"
            >
              Payment
            </button>
          </div>

          <button
            onClick={onOpenNotificationCenter}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
          >
            <span>Open Notification Center</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400 dark:text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
