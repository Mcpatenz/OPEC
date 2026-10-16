import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../lib/loans/calculator';
import { LoanAccount, LoanApplication } from '../../types';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  BadgeDollarSign,
  ArrowRight,
  X,
  Award,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { evaluateReLoanEligibility } from '../../lib/loans/eligibility';
import { LoanClearancePrint } from '../documents/LoanClearancePrint';
import { LoanApplicationTimeline } from './LoanApplicationTimeline';
import { ActiveLoanAmortizationSchedule } from './ActiveLoanAmortizationSchedule';

interface MyLoansProps {
  onOpenApply: () => void;
  onOpenVault?: () => void;
}

export const MyLoansView: React.FC<MyLoansProps> = ({ onOpenApply, onOpenVault }) => {
  const { currentUser, employees, branches, loanProducts, applications, activeLoans } = useApp();

  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const branch = branches.find(b => b.id === applicant.branchId);

  const myApplications = applications.filter(a => a.employeeId === applicant.id);
  const myLoans = activeLoans.filter(l => l.employeeId === applicant.id);

  const [selectedLoan, setSelectedLoan] = useState<LoanAccount | null>(null);
  const [showClearance, setShowClearance] = useState<LoanAccount | null>(null);

  const reLoanEval = evaluateReLoanEligibility(applicant, activeLoans, applications);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">My OPEC Loans & Amortization</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your loan application approvals, active schedules, and semi-monthly payroll deductions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenVault && (
            <button
              onClick={onOpenVault}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Document Vault
            </button>
          )}

          {reLoanEval.hasActiveRegularMpl ? (
            reLoanEval.canReLoanRegularMpl ? (
              <button
                onClick={onOpenApply}
                title={reLoanEval.reason}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Apply for Re-Loan (Halfway)</span>
              </button>
            ) : (
              <button
                onClick={onOpenApply}
                title="Apply for Emergency, Commodity, Calamity Assistance, or Petty Cash loan"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950"
              >
                <CreditCard className="w-4 h-4" />
                <span>Apply for Other Loans (Emergency / Commodity)</span>
              </button>
            )
          ) : (
            <button
              onClick={onOpenApply}
              title={reLoanEval.reason}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950"
            >
              <CreditCard className="w-4 h-4" />
              <span>Apply New Loan</span>
            </button>
          )}
        </div>
      </div>

      {/* Re-Loan / Halfway Evaluation Card if employee has active loan */}
      {reLoanEval.hasActiveRegularMpl && (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          reLoanEval.canReLoanRegularMpl
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-700/50 dark:text-emerald-200'
            : 'bg-amber-50 border-amber-200 text-amber-950 dark:bg-amber-950/40 dark:border-amber-700/50 dark:text-amber-200'
        }`}>
          <div className="flex items-start gap-2.5">
            {reLoanEval.canReLoanRegularMpl ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold">
                  {reLoanEval.canReLoanRegularMpl ? 'Regular MPL Re-Loan (Halfway) Criteria Satisfied' : 'Active Regular Multi-Purpose Loan on Record'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 font-bold border border-slate-300 dark:border-slate-700">
                  Loan #{reLoanEval.activeRegularMpl?.loanNumber}
                </span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed max-w-2xl">
                {reLoanEval.canReLoanRegularMpl
                  ? `Your active Regular MPL is ${reLoanEval.paymentPercentage.toFixed(1)}% paid (≥50%) and net take-home pay is ${reLoanEval.takeHomePayPercentage.toFixed(1)}% (≥35%). Halfway re-loan is unlocked.`
                  : `Another Regular MPL is locked until paid in half (currently ${reLoanEval.paymentPercentage.toFixed(1)}%, need ≥50%) with ≥35% take-home pay. You CAN apply for Emergency, Commodity, Calamity Assistance, or Petty Cash loans.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] text-slate-500 block">Regular MPL Paid:</span>
              <span className={`font-mono font-bold text-xs ${reLoanEval.isMoreThanHalfPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {reLoanEval.paymentPercentage.toFixed(1)}% <span className="text-[10px] text-slate-400">(≥50% req)</span>
              </span>
            </div>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
            <div>
              <span className="text-[10px] text-slate-500 block">Take-Home Pay:</span>
              <span className={`font-mono font-bold text-xs ${reLoanEval.has35PercentTakeHome ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {reLoanEval.takeHomePayPercentage.toFixed(1)}% <span className="text-[10px] text-slate-400">(≥35% req)</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Applications Section with Animated Visual Progress Trackers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Loan Applications & Status Timelines ({myApplications.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            Color-coded lifecycle: Pending → Review → Committee → Approved → Disbursed
          </span>
        </div>

        {myApplications.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            No applications submitted. Click "Apply New Loan" to start.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {myApplications.map(app => {
              const prod = loanProducts.find(p => p.id === app.loanProductId);

              return (
                <div key={app.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-4">
                  {/* Top card bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-slate-950 text-sm">{app.applicationNo}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-800">{prod?.name}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Submitted {app.submittedAt?.split('T')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-950 text-sm block">
                          {formatPHP(app.requestedAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {app.termMonths} Months ({app.termMonths * 2} Payday Deductions)
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${
                        app.status === 'FOR_RELEASE' || app.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : app.status === 'CREDIT_COMMITTEE'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Purpose description */}
                  <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-medium">Loan Purpose: </span>
                      <strong className="text-slate-800">{app.purpose}</strong>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Interest: <strong className="text-slate-700">{app.interestRate}%/mo</strong> · Release:{' '}
                      <strong className="text-slate-700">{app.releaseMethod.replace(/_/g, ' ')}</strong>
                    </div>
                  </div>

                  {/* Animated Visual Progress Tracker with Color-Coded Timeline */}
                  <LoanApplicationTimeline application={app} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Loans Section */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Active Loan Accounts & Amortization Schedules ({myLoans.length})
        </h2>

        {myLoans.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            No active disbursed loan accounts on record.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myLoans.map(loan => {
              const prod = loanProducts.find(p => p.id === loan.loanProductId);
              const progressPercent = Math.min(100, Math.round((loan.amountPaid / loan.totalPayable) * 100));

              // Compute monthly breakdown estimates
              const totalInstallments = loan.schedules?.length || 1;
              const isSemiMonthly = (loan.schedules || []).some(s => s.cutoffPeriod === '15th' || s.cutoffPeriod === '30th');
              const estimatedMonths = Math.max(1, isSemiMonthly ? Math.round(totalInstallments / 2) : totalInstallments);
              const monthlyPrincipal = Math.round((loan.principal / estimatedMonths) * 100) / 100;
              const monthlyInterest = Math.round((loan.interestTotal / estimatedMonths) * 100) / 100;
              const monthlyTotal = Math.round((monthlyPrincipal + monthlyInterest) * 100) / 100;

              return (
                <div key={loan.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-3.5 hover:border-amber-400 transition-all">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-mono font-bold text-slate-900 text-sm">{loan.loanNumber}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {loan.status}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 text-sm">{prod?.name}</span>
                    <p className="text-[11px] text-slate-500">Maturity Date: {loan.maturityDate} · Released: {loan.releaseDate}</p>
                  </div>

                  {/* Monthly Principal & Interest Payment Breakdown Strip */}
                  <div className="p-3 bg-gradient-to-r from-amber-50/60 via-slate-50 to-emerald-50/60 rounded-xl border border-slate-200/90 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <span>Monthly Amortization Breakdown</span>
                      <span className="text-amber-800 font-mono">1.5% mo. rate</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="bg-white/80 p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Monthly Principal</span>
                        <span className="font-mono font-bold text-emerald-700">{formatPHP(monthlyPrincipal)}</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Monthly Interest</span>
                        <span className="font-mono font-bold text-amber-700">{formatPHP(monthlyInterest)}</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Total Monthly</span>
                        <span className="font-mono font-black text-slate-900">{formatPHP(monthlyTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Balance & progress */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Outstanding Balance:</span>
                      <span className="font-mono font-bold text-rose-700 text-sm">{formatPHP(loan.balance)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Total Paid: {formatPHP(loan.amountPaid)}</span>
                      <span className="font-mono font-semibold">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    {loan.balance === 0 ? (
                      <button
                        onClick={() => setShowClearance(loan)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Loan Clearance Certificate
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Semi-Monthly Payroll Deduction</span>
                    )}

                    <button
                      onClick={() => setSelectedLoan(loan)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      Detailed Amortization (P&I)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Amortization Ledger Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-6 overflow-y-auto">
          <div className="max-w-5xl w-full my-auto animate-in fade-in duration-200">
            <ActiveLoanAmortizationSchedule
              loan={selectedLoan}
              onClose={() => setSelectedLoan(null)}
            />
          </div>
        </div>
      )}

      {/* Clearance Certificate */}
      {showClearance && (
        <LoanClearancePrint
          loanNumber={showClearance.loanNumber}
          borrowerName={`${applicant.firstName} ${applicant.lastName}`}
          employeeNumber={applicant.employeeNumber}
          branchName={branch?.name || 'Main Branch'}
          principal={showClearance.principal}
          completionDate={new Date().toISOString().split('T')[0]}
          onClose={() => setShowClearance(null)}
        />
      )}
    </div>
  );
};
