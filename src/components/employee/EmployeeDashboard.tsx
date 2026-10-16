import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateYearsOfService, evaluateReLoanEligibility } from '../../lib/loans/eligibility';
import { formatPHP } from '../../lib/loans/calculator';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  HeartHandshake,
  FilePlus,
  ShieldCheck,
  TrendingDown,
  Building,
  ArrowRight,
  Receipt,
  Calculator,
  Lock,
  Coins,
  AlertCircle,
  AlertTriangle,
  FileText,
  UserCheck,
  Wallet,
  Megaphone,
  Sparkles,
} from 'lucide-react';
import { LoanCalculator } from '../loans/LoanCalculator';
import { TakeHomePaySimulator } from './TakeHomePaySimulator';
import { LoanRepaymentSimulator } from './LoanRepaymentSimulator';
import { UpcomingRepaymentAlert } from './UpcomingRepaymentAlert';
import { RepaymentCalendar } from './RepaymentCalendar';
import { LoanRepaymentSummaryCard } from './LoanRepaymentSummaryCard';
import { InAppNotificationBanner } from './InAppNotificationBanner';
import { CbuEquityCard } from './CbuEquityCard';
import { LoanEligibilityChecker } from './LoanEligibilityChecker';
import { evaluateEmployeeCbu } from '../../lib/cbu/cbuCalculator';

interface EmpDashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenApply: () => void;
  onOpenApplyWithTerms?: (terms: { productId: string; amount: number; termMonths: number }) => void;
  onOpenNotificationCenter?: () => void;
  onOpenPaystub?: () => void;
  onOpenCSRReport?: () => void;
}

export const EmployeeDashboard: React.FC<EmpDashboardProps> = ({
  setActiveTab,
  onOpenApply,
  onOpenApplyWithTerms,
  onOpenNotificationCenter,
  onOpenPaystub,
  onOpenCSRReport,
}) => {
  const { currentUser, employees, branches, applications, activeLoans, payrollDeductions, csrProjects, announcements } = useApp();
  const [calculatorMode, setCalculatorMode] = useState<'repayment' | 'take-home' | 'standard'>('repayment');

  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const branch = branches.find(b => b.id === applicant.branchId);
  const service = calculateYearsOfService(applicant.dateHired);

  // Filter applicant's own applications and loans
  const myApplications = applications.filter(a => a.employeeId === applicant.id);
  const myLoans = activeLoans.filter(l => l.employeeId === applicant.id);
  const myTotalBalance = myLoans.reduce((sum, l) => sum + (l.balance || 0), 0);

  // CBU (Capital Build-Up) ₱100/payday and 10% retainers fee calculation
  const cbu = evaluateEmployeeCbu(applicant);

  // Next deduction
  const myUpcomingDeduction = payrollDeductions.find(
    d => d.employeeId === applicant.id && d.status === 'SCHEDULED'
  );

  // Active / Submitted application for status alert
  const pendingApplication = myApplications.find(
    a => a.status !== 'FULLY_PAID' && a.status !== 'CLOSED' && a.status !== 'REJECTED' && a.status !== 'DRAFT'
  );

  // Co-Maker pending requests directed to this applicant
  const pendingCoMakerRequests = applications.filter(a =>
    a.coMakers.some(cm => cm.employeeId === applicant.id && cm.status === 'PENDING')
  );

  const activeAnnouncements = announcements.filter(a => a.status === 'PUBLISHED');

  const reLoanEval = useMemo(() => {
    return evaluateReLoanEligibility(applicant, activeLoans, applications);
  }, [applicant, activeLoans, applications]);

  return (
    <div className="space-y-6">
      {/* 0. Official OPEC Broadcast & Announcements Banner */}
      {activeAnnouncements.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300 dark:border-amber-600/40 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shrink-0 mt-0.5">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  {activeAnnouncements[0].isPinned ? 'Pinned Notice' : 'Official Notice'}
                </span>
                <span className="text-xs text-slate-500">
                  {activeAnnouncements[0].publishDate}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {activeAnnouncements[0].title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                {activeAnnouncements[0].content}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('emp-announcements')}
            className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shrink-0 shadow-xs cursor-pointer"
          >
            Read Bulletins ({activeAnnouncements.length}) →
          </button>
        </div>
      )}

      {/* 1. In-App Notification Alerts Banner (Loan status changes, Co-Maker requests, Upcoming payments) */}
      <InAppNotificationBanner
        setActiveTab={setActiveTab}
        onOpenNotificationCenter={onOpenNotificationCenter || (() => {})}
      />

      {/* 2. 5-Day Upcoming Repayment Alert Notification Component */}
      <UpcomingRepaymentAlert setActiveTab={setActiveTab} />

      {/* 3. Dedicated Action Required & Loan Status Alert Card (High Contrast) */}
      {(pendingCoMakerRequests.length > 0 || pendingApplication) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Action Required Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-amber-400 dark:border-amber-500/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 shadow-2xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Action Required
                </span>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  {pendingCoMakerRequests.length > 0 ? `${pendingCoMakerRequests.length} Pending Endorsement` : 'Ready'}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white mt-1">
                {pendingCoMakerRequests.length > 0
                  ? 'Co-Maker Guarantee Signature Pending'
                  : 'Document Verification & Signatures'}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
                {pendingCoMakerRequests.length > 0
                  ? `You have a co-maker endorsement request waiting for your digital signature verification. Prompt review prevents loan release delays.`
                  : `Ensure all uploaded ID and proof-of-income documents in your secure vault remain up-to-date for upcoming loan cycles.`}
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Action: Digital Signature
              </span>
              <button
                onClick={() => setActiveTab('emp-applications')}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Review Requests</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Loan Status Alert Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-emerald-500 dark:border-emerald-500/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-600 text-white shadow-2xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Loan Status Alert
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {pendingApplication?.applicationNo || 'Pipeline Alert'}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white mt-1">
                {pendingApplication
                  ? `Application ${pendingApplication.applicationNo}: ${pendingApplication.status.replace(/_/g, ' ')}`
                  : 'All Submitted Applications Processed'}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
                {pendingApplication
                  ? `Your loan request for ${formatPHP(pendingApplication.requestedAmount)} is actively progressing through the OPEC review hierarchy.`
                  : 'You have no pending loan applications under review. Check your active loan accounts or calculate new loan options below.'}
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                {pendingApplication ? `Stage: ${pendingApplication.status.replace(/_/g, ' ')}` : 'Status: Good Standing'}
              </span>
              <button
                onClick={() => setActiveTab('emp-applications')}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>View Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 4. Welcome Banner with Official OPEC Header Banner Artwork & Employee Details */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white border-2 border-amber-500/30 bg-slate-900 shadow-xl">
        {/* Header background picture overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/opec_header_banner_1791532764943.jpg"
            alt="OPEC Header Background"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-right opacity-30 brightness-110 filter saturate-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950/70" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 shadow-xl ring-2 ring-amber-500/20">
                {applicant.avatarUrl ? (
                  <img src={applicant.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center font-bold text-lg">
                    {applicant.firstName.charAt(0)}
                  </div>
                )}
              </div>
              <img
                src="/src/assets/images/opec_logo_1791532750142.jpg"
                alt="OPEC Crest"
                referrerPolicy="no-referrer"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full object-cover border border-amber-300 shadow-md"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  {applicant.employeeNumber}
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  OPEC {applicant.opecPosition || 'Member'}
                </span>
                <span className="text-[10px] font-semibold text-amber-200/90 uppercase tracking-wider">
                  ZASURMIS Region
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                Welcome, {applicant.firstName} {applicant.lastName}
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                {applicant.position} · {branch?.name || 'Main Branch'} · M Lhuillier OPEC Member
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {reLoanEval.hasActiveRegularMpl ? (
              reLoanEval.canReLoanRegularMpl ? (
                <>
                  <button
                    onClick={onOpenApply}
                    title={reLoanEval.reason}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Apply for Re-Loan (Halfway Qualified)</span>
                  </button>
                  <button
                    onClick={onOpenApply}
                    title="Apply for Emergency, Commodity, Calamity, or Petty Cash"
                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl transition-all cursor-pointer"
                  >
                    <FilePlus className="w-4 h-4 text-amber-400" />
                    <span>Other Loans</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    disabled
                    title={reLoanEval.getProductRestrictionReason('REGULAR_MPL')}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700/80 rounded-xl shadow-xs transition-all cursor-not-allowed opacity-80"
                  >
                    <Lock className="w-4 h-4 text-amber-400/80" />
                    <span>
                      Regular MPL Locked ({reLoanEval.paymentPercentage.toFixed(0)}% Paid · Need ≥50%)
                    </span>
                  </button>
                  <button
                    onClick={onOpenApply}
                    title="Apply for Emergency, Commodity, Calamity Assistance, or Petty Cash loan"
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <FilePlus className="w-4 h-4" />
                    <span>Apply for Other Loans (Emergency/Commodity/etc.)</span>
                  </button>
                </>
              )
            ) : (
              <button
                onClick={onOpenApply}
                title="Every employee can apply for an OPEC loan"
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <FilePlus className="w-4 h-4" />
                <span>Apply for OPEC Loan</span>
              </button>
            )}
          </div>
        </div>

        {/* Re-Loan / Halfway Evaluation Banner */}
        {reLoanEval.hasActiveRegularMpl && (
          <div className={`mt-5 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            reLoanEval.canReLoanRegularMpl
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-100'
              : 'bg-amber-950/50 border-amber-500/40 text-amber-100'
          }`}>
            <div className="flex items-start gap-2.5">
              {reLoanEval.canReLoanRegularMpl ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">
                    {reLoanEval.canReLoanRegularMpl
                      ? 'Regular MPL Re-Loan (Halfway) Criteria Satisfied'
                      : 'Active Regular Multi-Purpose Loan on File'}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    reLoanEval.canReLoanRegularMpl
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    Loan #{reLoanEval.activeRegularMpl?.loanNumber}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed max-w-2xl">
                  {reLoanEval.canReLoanRegularMpl
                    ? `Payments made on Regular MPL are ${reLoanEval.paymentPercentage.toFixed(1)}% (≥50%) and take-home pay is ${reLoanEval.takeHomePayPercentage.toFixed(1)}% (≥35%). You can re-loan Regular MPL, or apply for Emergency, Commodity, Calamity, and Petty Cash.`
                    : `Under OPEC policy, another Regular MPL is restricted until paid in half (currently ${reLoanEval.paymentPercentage.toFixed(1)}%, need ≥50%) with ≥35% take-home pay. You ARE permitted to loan for Emergency, Commodity, Calamity Assistance, or Petty Cash.`}
                </p>
                {/* Permitted loans quick links */}
                <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Permitted facilities:</span>
                  {[
                    { id: 'prod-emergency', name: 'Emergency Loan' },
                    { id: 'prod-commodity', name: 'Commodity Loan' },
                    { id: 'prod-calamity', name: 'Calamity Assistance' },
                    { id: 'prod-petty-cash', name: 'Petty Cash' },
                  ].map(facility => (
                    <button
                      key={facility.id}
                      onClick={() => {
                        if (onOpenApplyWithTerms) {
                          onOpenApplyWithTerms({ productId: facility.id, amount: 10000, termMonths: 6 });
                        } else {
                          onOpenApply();
                        }
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 cursor-pointer transition-colors"
                    >
                      + {facility.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div>
                <div className="text-[10px] text-slate-400">Regular MPL Paid:</div>
                <div className={`font-mono font-bold text-xs ${reLoanEval.isMoreThanHalfPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {reLoanEval.paymentPercentage.toFixed(1)}% <span className="text-[10px] text-slate-400">(≥50% req)</span>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <div className="text-[10px] text-slate-400">Take-Home Pay:</div>
                <div className={`font-mono font-bold text-xs ${reLoanEval.has35PercentTakeHome ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {reLoanEval.takeHomePayPercentage.toFixed(1)}% <span className="text-[10px] text-slate-400">(≥35% req)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!reLoanEval.hasActiveLoan && !reLoanEval.canApply && (
          <div className="mt-5 p-3.5 rounded-xl border bg-blue-950/50 border-blue-500/40 text-blue-100 flex items-center gap-2.5 text-xs">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-[11px] text-slate-300">{reLoanEval.reason}</span>
          </div>
        )}

        {/* Tenure & Eligibility strip */}
        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Calculated Service Tenure:</span>
            <span className="font-bold text-amber-300 font-mono text-sm">{service.formatted}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Employment Status:</span>
            <span className="font-bold text-emerald-400">{applicant.employmentStatus}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Maximum Credit Capacity:</span>
            <span className="font-bold text-white font-mono">₱30,000.00</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Co-Maker Eligibility:</span>
            <span className="font-bold text-emerald-400">QUALIFIED (≥5 Yrs)</span>
          </div>
        </div>
      </div>

      {/* 5. Total Active Loan Balance, Next Payment Date, and Quick-Glance Repayment Metric Card */}
      <LoanRepaymentSummaryCard setActiveTab={setActiveTab} />

      {/* 6. OPEC Capital Build-Up (CBU) & Retainers Fee Equity Section (Mandatory ₱100/payday & 10% Retainer Fee) */}
      <CbuEquityCard onOpenPaystub={onOpenPaystub} />

      {/* 6.5 Loan Eligibility Checker Component (Analyzes tenure, current loan balances, and product criteria) */}
      <LoanEligibilityChecker
        onOpenApplyWithTerms={onOpenApplyWithTerms}
        onOpenApply={onOpenApply}
        setActiveTab={setActiveTab}
      />

      {/* 7. Redesigned 4-Column KPI Grid with Large High-Contrast Typography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Upcoming Payday Salary Deduction */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Upcoming Payday
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                Oct 15, 2026
              </span>
            </div>
            <div className="text-3xl font-mono tabular-nums font-black text-slate-950 dark:text-white tracking-tight">
              {myUpcomingDeduction ? formatPHP(myUpcomingDeduction.scheduledAmount) : '₱1,750.00'}
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">
              Automated semi-monthly salary deduction + ₱100 OPEC CBU.
            </p>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-750 text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Cutoff: 15th Payday</span>
            {onOpenPaystub && (
              <button
                onClick={onOpenPaystub}
                className="text-amber-700 dark:text-amber-400 hover:text-amber-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View Paystub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* KPI 2: Total Active Loan */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Total Active Loan
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                Active Debt
              </span>
            </div>
            <div className="text-3xl font-mono tabular-nums font-black text-slate-950 dark:text-white tracking-tight">
              {formatPHP(myTotalBalance)}
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">
              Across {myLoans.length} active credit facility account(s).
            </p>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-750 text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Interest Status: Regular</span>
            <button
              onClick={() => setActiveTab('emp-active-loans')}
              className="text-blue-700 dark:text-blue-400 hover:text-blue-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 3: Loan Status & Applications Pipeline */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Loan Status Alert
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                {myApplications.length} Application(s)
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              {myApplications[0] ? myApplications[0].status.replace(/_/g, ' ') : 'No Pending'}
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">
              {myApplications.filter(a => a.status === 'CREDIT_COMMITTEE').length > 0
                ? 'Under Credit Committee review'
                : 'All submissions reviewed'}
            </p>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-750 text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Hierarchy: Multi-Role</span>
            <button
              onClick={() => setActiveTab('emp-applications')}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 4: Total CBU Equity & 10% Retainer Fee */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Total CBU Equity
              </span>
              <span className="font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 text-[11px]">
                ₱100/payday
              </span>
            </div>
            <div className="text-3xl font-mono tabular-nums font-black text-amber-700 dark:text-amber-300 tracking-tight">
              {formatPHP(cbu.totalCbu)}
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">
              10% Retainer: <strong className="text-rose-600 dark:text-rose-400 font-mono font-bold">{formatPHP(cbu.retainersFee)}</strong> (upon separation)
            </p>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-750 text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-medium">90% Refundable</span>
            <button
              onClick={() => setActiveTab('emp-profile')}
              className="text-amber-700 dark:text-amber-400 hover:text-amber-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>CBU Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 8. Monthly Repayment Calendar Visualization */}
      <RepaymentCalendar setActiveTab={setActiveTab} />

      {/* 9. Document Vault Quick Access Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Secure Archive
              </span>
              <span className="text-xs text-slate-300">· Official Loan Legal Records</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">Official Document Vault Available</h3>
            <p className="text-xs text-slate-300">
              View and download your generated master loan agreements, promissory notes, and discharge certificates in PDF format.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('emp-vault')}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          Open Document Vault
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 10. Interactive Loan & Take-Home Pay Impact Simulator Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
              Financial Simulator & Amortization
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              Simulate Repayments, Outstanding Balance & Payday Deductions
            </h3>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-bold self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setCalculatorMode('repayment')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                calculatorMode === 'repayment'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Repayment Simulator (w/ Balance)</span>
            </button>
            <button
              onClick={() => setCalculatorMode('take-home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                calculatorMode === 'take-home'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Take-Home Pay Impact</span>
            </button>
            <button
              onClick={() => setCalculatorMode('standard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                calculatorMode === 'standard'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Standard Calculator</span>
            </button>
          </div>
        </div>

        {calculatorMode === 'repayment' ? (
          <LoanRepaymentSimulator
            onApplyWithTerms={onOpenApplyWithTerms || (() => onOpenApply())}
          />
        ) : calculatorMode === 'take-home' ? (
          <TakeHomePaySimulator
            onApplyWithTerms={onOpenApplyWithTerms || (() => onOpenApply())}
          />
        ) : (
          <LoanCalculator
            onApplyWithTerms={onOpenApplyWithTerms || (() => onOpenApply())}
          />
        )}
      </div>

      {/* 11. Applications & Recent Activities with Full Dark Mode Support */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* My Applications Progress Tracker */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-750">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              My Loan Applications
            </h2>
            <button
              onClick={() => setActiveTab('emp-applications')}
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              View All ({myApplications.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-750 mt-2">
            {myApplications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                You have no active loan applications submitted.
              </div>
            ) : (
              myApplications.map(app => (
                <div key={app.id} className="py-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{app.applicationNo}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs ml-2">{app.submittedAt?.split('T')[0]}</span>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                      app.status === 'FOR_RELEASE'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                        : app.status === 'CREDIT_COMMITTEE'
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                        : 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
                    }`}>
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span className="truncate max-w-xs">{app.purpose}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formatPHP(app.requestedAmount)}</span>
                  </div>

                  {/* Multi-role sign-off pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {app.approvals.map(apr => (
                      <span
                        key={apr.id}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          apr.decision === 'APPROVED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {apr.title.split(' ')[0]}: {apr.decision}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming CSR Outreaches */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-750">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              OPEC Community Activities
            </h2>
            <div className="flex items-center gap-2">
              {onOpenCSRReport && (
                <button
                  onClick={onOpenCSRReport}
                  className="text-xs font-bold text-rose-700 dark:text-rose-400 hover:text-rose-900 hover:underline cursor-pointer"
                >
                  + Submit Report
                </button>
              )}
              <button
                onClick={() => setActiveTab('emp-activities')}
                className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Volunteer Roster
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-750 mt-2">
            {csrProjects.slice(0, 2).map(proj => (
              <div key={proj.id} className="py-3.5 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{proj.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                    {proj.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{proj.location}</p>
                <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>Coordinator: {proj.projectLeader}</span>
                  <span className="text-amber-700 dark:text-amber-400 font-bold">{proj.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
