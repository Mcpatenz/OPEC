import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../lib/loans/calculator';
import {
  CreditCard,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Receipt,
  PieChart,
  AlertCircle,
} from 'lucide-react';

interface SummaryCardProps {
  setActiveTab?: (tab: string) => void;
  onOpenSchedule?: () => void;
}

export const LoanRepaymentSummaryCard: React.FC<SummaryCardProps> = ({
  setActiveTab,
  onOpenSchedule,
}) => {
  const { currentUser, employees, activeLoans, payrollDeductions } = useApp();

  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];

  // Active loans for this employee
  const myLoans = activeLoans.filter(l => l.employeeId === applicant.id);

  // 1. Total Active Loan Balance
  const totalBalance = myLoans.reduce((sum, l) => sum + (l.balance || 0), 0);
  const totalPrincipal = myLoans.reduce((sum, l) => sum + (l.principal || 0), 0);
  const totalPayable = myLoans.reduce((sum, l) => sum + (l.totalPayable || 0), 0);
  const totalPaid = myLoans.reduce((sum, l) => sum + (l.amountPaid || 0), 0);

  // 2. Next Payment Date & Amount
  // Scan all scheduled installments across active loans
  const allScheduled = myLoans
    .flatMap(l => (l.schedules || []).map(s => ({ ...s, loanNumber: l.loanNumber })))
    .filter(s => s.status === 'SCHEDULED')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const nextSchedule = allScheduled[0];

  // Scheduled payroll deduction fallback
  const upcomingPayroll = payrollDeductions.find(
    d => d.employeeId === applicant.id && d.status === 'SCHEDULED'
  );

  const nextPaymentDate = nextSchedule
    ? nextSchedule.dueDate
    : upcomingPayroll
    ? upcomingPayroll.payrollPeriod
    : 'No Pending Payments';

  const nextPaymentAmount = nextSchedule
    ? nextSchedule.amount
    : upcomingPayroll
    ? upcomingPayroll.scheduledAmount
    : 0;

  // Days until next payment
  let daysUntilDue: number | null = null;
  if (nextSchedule?.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(nextSchedule.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // 3. Quick-glance Progress Bar of Total Repayment Percentage
  const repaymentPercentage =
    totalPayable > 0 ? Math.min(100, Math.round((totalPaid / totalPayable) * 100)) : 0;

  const hasActiveLoans = myLoans.length > 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden transition-all">
      {/* Top Banner Accent - High Contrast & Clear Info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                Loan Portfolio & Repayment Overview
              </h2>
              <span className="text-slate-400 text-xs hidden md:inline">·</span>
              <span className="text-xs font-semibold text-slate-300 hidden md:inline">
                {applicant.firstName} {applicant.lastName} ({applicant.employeeNumber})
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Live balances, upcoming deduction schedules & cumulative repayment metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-slate-800 text-amber-300 border border-slate-700">
            {myLoans.length} Active {myLoans.length === 1 ? 'Loan Facility' : 'Loan Facilities'}
          </span>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('emp-active-loans')}
              className="text-xs text-white hover:text-amber-300 font-bold flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 transition-colors cursor-pointer"
            >
              <span>View Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Core Metric Cards: Total Active Loan, Next Payment Date, Repayment Metric */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: TOTAL ACTIVE LOAN */}
          <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  Total Active Loan
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-700/60">
                  Current Balance
                </span>
              </div>

              {/* Outstanding Balance */}
              <div className="text-3xl sm:text-4xl font-mono tabular-nums font-black text-slate-950 dark:text-white tracking-tight">
                {formatPHP(totalBalance)}
              </div>

              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Outstanding balance across {myLoans.length} active credit {myLoans.length === 1 ? 'account' : 'accounts'}.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">Gross Principal Borrowed:</span>
              <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                {formatPHP(totalPrincipal)}
              </span>
            </div>
          </div>

          {/* Card 2: NEXT PAYMENT DATE */}
          <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  Next Payment Date
                </span>
                {daysUntilDue !== null && daysUntilDue >= 0 ? (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                      daysUntilDue <= 5
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                        : 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
                    }`}
                  >
                    {daysUntilDue === 0 ? 'Due Today' : `In ${daysUntilDue} days`}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    Semi-Monthly
                  </span>
                )}
              </div>

              {/* The Date Itself */}
              <div className="text-2xl sm:text-3xl font-mono tabular-nums font-black text-slate-950 dark:text-white tracking-tight">
                {nextPaymentDate}
              </div>

              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Automated payroll deduction via OPEC Branch Master.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">Scheduled Installment:</span>
              <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                {nextPaymentAmount > 0 ? formatPHP(nextPaymentAmount) : '₱0.00'}
              </span>
            </div>
          </div>

          {/* Card 3: REPAYMENT METRIC */}
          <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Repayment Metric
                </span>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/80">
                  {repaymentPercentage}% Settled
                </span>
              </div>

              {/* Total Paid Amount */}
              <div className="text-3xl sm:text-4xl font-mono tabular-nums font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                {formatPHP(totalPaid)}
              </div>

              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Cumulative payments settled against total debt obligations.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">Total Obligation Debt:</span>
              <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                {formatPHP(totalPayable)}
              </span>
            </div>
          </div>

        </div>

        {/* Card 4: TOTAL LOAN REPAYMENT PROGRESS BAR & METRIC BREAKDOWN */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Total Loan Repayment Progress
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Settlement ratio across all approved amortization schedules
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xl font-mono font-black text-slate-900 dark:text-white">
                {repaymentPercentage}%
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono">
                ({formatPHP(totalPaid)} / {formatPHP(totalPayable)})
              </span>
            </div>
          </div>

          {/* High-Visibility Progress Bar Track */}
          <div className="relative w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                repaymentPercentage === 100
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500'
              }`}
              style={{ width: `${Math.max(hasActiveLoans ? 3 : 0, repaymentPercentage)}%` }}
            />
          </div>

          {/* Legend Items with High Contrast for Light and Dark Modes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <div className="flex items-center justify-between w-full">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Paid to Date:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white ml-2">
                  {formatPHP(totalPaid)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <div className="flex items-center justify-between w-full">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Remaining Debt:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white ml-2">
                  {formatPHP(totalBalance)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <div className="flex items-center justify-between w-full">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Total Obligations:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white ml-2">
                  {formatPHP(totalPayable)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
