import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../lib/loans/calculator';
import { LoanAccount, LoanAmortizationSchedule } from '../../types';
import {
  BellRing,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Clock,
  X,
  CreditCard,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface UpcomingRepaymentAlertProps {
  setActiveTab: (tab: string) => void;
  onSelectLoanForSchedule?: (loan: LoanAccount) => void;
}

export const UpcomingRepaymentAlert: React.FC<UpcomingRepaymentAlertProps> = ({
  setActiveTab,
  onSelectLoanForSchedule,
}) => {
  const { currentUser, employees, activeLoans, loanProducts } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const myLoans = activeLoans.filter(l => l.employeeId === applicant.id && l.status === 'ACTIVE');

  // Search for the closest upcoming scheduled installment across all active loans
  const upcomingInfo = useMemo(() => {
    // Current simulated reference date (Oct 5, 2026 or today)
    const now = new Date('2026-10-05T00:00:00');
    
    let closestLoan: LoanAccount | null = null;
    let closestSchedule: LoanAmortizationSchedule | null = null;
    let minDays = Infinity;

    for (const loan of myLoans) {
      for (const sched of loan.schedules) {
        if (sched.status === 'SCHEDULED') {
          const dueDate = new Date(sched.dueDate + 'T00:00:00');
          const diffTime = dueDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Find earliest positive difference
          if (diffDays >= 0 && diffDays < minDays) {
            minDays = diffDays;
            closestLoan = loan;
            closestSchedule = sched;
          }
        }
      }
    }

    return {
      loan: closestLoan,
      schedule: closestSchedule,
      daysRemaining: minDays,
      // Target alert threshold: 5 days before due date
      isWithin5Days: minDays <= 5 && minDays >= 0,
    };
  }, [myLoans]);

  // If no loan or no scheduled installment found, or dismissed, return null (with option for demo switch)
  if (!upcomingInfo.loan || !upcomingInfo.schedule) {
    return null;
  }

  const { loan, schedule, daysRemaining, isWithin5Days } = upcomingInfo;
  const prod = loanProducts.find(p => p.id === loan.loanProductId);

  // If dismissed, don't show the large banner, show a small reminder badge
  if (isDismissed) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 transition-all">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Payment reminder snoozed: <strong className="font-mono">{formatPHP(schedule.amount)}</strong> due in {daysRemaining} days ({schedule.dueDate}).
          </span>
        </div>
        <button
          onClick={() => setIsDismissed(false)}
          className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline ml-2"
        >
          Restore Alert
        </button>
      </div>
    );
  }

  // Format due date in human friendly format
  const dueFormatted = new Date(schedule.dueDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleOpenSchedule = () => {
    if (onSelectLoanForSchedule) {
      onSelectLoanForSchedule(loan);
    } else {
      setShowScheduleModal(true);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 dark:border-amber-500/70 bg-white dark:bg-slate-850 p-5 shadow-sm transition-all">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/10 dark:bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left info column */}
          <div className="flex items-start gap-3.5">
            <div className="relative mt-0.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shrink-0">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white dark:border-slate-850 rounded-full animate-ping" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 text-xs font-black font-mono uppercase tracking-wider rounded-md bg-amber-500 text-slate-950 shadow-2xs">
                  {daysRemaining === 0
                    ? 'Payment Due Today'
                    : daysRemaining === 1
                    ? 'Due Tomorrow'
                    : `Due in ${daysRemaining} Days`}
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Upcoming Loan Repayment Notice
                </span>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  · {loan.loanNumber}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                Your semi-monthly salary deduction of{' '}
                <strong className="font-mono text-slate-950 dark:text-white font-extrabold text-sm sm:text-base bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                  {formatPHP(schedule.amount)}
                </strong>{' '}
                for <span className="font-bold text-slate-900 dark:text-white">{prod?.name || 'Loan Facility'}</span> is scheduled on{' '}
                <strong className="text-slate-950 dark:text-white font-extrabold">{dueFormatted}</strong>.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-1.5 font-mono">
                  <span className="text-slate-500 dark:text-slate-400">Principal:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{formatPHP(schedule.principal)}</strong>
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <span className="text-slate-500 dark:text-slate-400">Interest:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{formatPHP(schedule.interest)}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Cutoff: <strong className="text-slate-900 dark:text-white">{schedule.cutoffPeriod} Payday</strong> (Auto-Payroll)</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <span className="text-slate-500 dark:text-slate-400">Remaining Balance:</span>
                  <strong className="text-amber-700 dark:text-amber-300 font-bold">{formatPHP(loan.balance)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <button
              onClick={handleOpenSchedule}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400 dark:text-slate-950" />
              View Schedule
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Acknowledge and dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* In-place Amortization Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{loan.loanNumber}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{prod?.name} · Semi-Monthly Repayment Schedule</p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick highlight of the next upcoming repayment */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                  Next Scheduled Installment (# {schedule.installmentNo})
                </span>
                <span className="text-xs text-slate-700">
                  Due on <strong>{dueFormatted}</strong> ({schedule.cutoffPeriod} cutoff)
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-base text-amber-900 block">
                  {formatPHP(schedule.amount)}
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded">
                  Due in {daysRemaining} days
                </span>
              </div>
            </div>

            {/* Schedule Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Payday Due</th>
                    <th className="py-2.5 px-3">Cutoff</th>
                    <th className="py-2.5 px-3 font-mono text-right">Principal</th>
                    <th className="py-2.5 px-3 font-mono text-right">Interest</th>
                    <th className="py-2.5 px-3 font-mono text-right">Total Payment</th>
                    <th className="py-2.5 px-3 font-mono text-right">Balance After</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {loan.schedules.map(s => {
                    const isUpcomingTarget = s.id === schedule.id;

                    return (
                      <tr
                        key={s.id}
                        className={`transition-colors ${
                          isUpcomingTarget
                            ? 'bg-amber-100/70 font-semibold'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold">{s.installmentNo}</td>
                        <td className="py-2.5 px-3">{s.dueDate}</td>
                        <td className="py-2.5 px-3 font-sans">{s.cutoffPeriod}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-700">
                          {formatPHP(s.principal)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-700">
                          {formatPHP(s.interest)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatPHP(s.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700">
                          {formatPHP(s.balanceAfter)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              s.status === 'POSTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : isUpcomingTarget
                                ? 'bg-amber-200 text-amber-900 ring-1 ring-amber-400'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isUpcomingTarget ? 'NEXT DUE' : s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Loan Maturity Date: <strong className="text-slate-800">{loan.maturityDate}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setActiveTab('emp-active-loans');
                  }}
                  className="px-3.5 py-1.5 font-bold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  Go to Active Loans Ledger
                </button>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
