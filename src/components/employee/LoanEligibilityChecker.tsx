import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateYearsOfService, evaluateLoanEligibility, evaluateReLoanEligibility } from '../../lib/loans/eligibility';
import { formatPHP, calculateLoanFinancials } from '../../lib/loans/calculator';
import { LoanProduct } from '../../types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Users,
  ChevronRight,
  Calculator,
  Sliders,
  Info,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Lock,
} from 'lucide-react';

interface LoanEligibilityCheckerProps {
  onOpenApplyWithTerms?: (terms: { productId: string; amount: number; termMonths: number }) => void;
  onOpenApply?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const LoanEligibilityChecker: React.FC<LoanEligibilityCheckerProps> = ({
  onOpenApplyWithTerms,
  onOpenApply,
  setActiveTab,
}) => {
  const { currentUser, employees, activeLoans, applications, loanProducts } = useApp();

  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const service = calculateYearsOfService(applicant.dateHired);

  // Applicant active loans
  const myLoans = activeLoans.filter(l => l.employeeId === applicant.id && l.status === 'ACTIVE');
  const totalActiveBalance = myLoans.reduce((sum, l) => sum + (l.balance || 0), 0);

  // Re-Loan / Halfway eligibility check
  const reLoanEval = useMemo(() => {
    return evaluateReLoanEligibility(applicant, activeLoans, applications);
  }, [applicant, activeLoans, applications]);

  // Filters
  const [filter, setFilter] = useState<'ALL' | 'ELIGIBLE' | 'INELIGIBLE'>('ALL');
  const [selectedProductForSim, setSelectedProductForSim] = useState<string | null>(null);
  const [simAmount, setSimAmount] = useState<number>(15000);
  const [simTerm, setSimTerm] = useState<number>(12);

  // Evaluate each product
  const evaluations = useMemo(() => {
    return loanProducts.map(product => {
      // Find if applicant has an active loan of this specific product
      const activeLoanOfThisType = myLoans.find(l => l.loanProductId === product.id);
      const evalResult = evaluateLoanEligibility(applicant, product, totalActiveBalance);

      const reasons = [...evalResult.disqualificationReasons];
      const isMpl = product.code === 'REGULAR_MPL' || product.id === 'prod-mpl';
      let isReLoan = false;
      let isAllowedWithActiveMpl = false;

      if (isMpl) {
        if (reLoanEval.hasActiveRegularMpl) {
          if (reLoanEval.canReLoanRegularMpl) {
            isReLoan = true;
          } else {
            const restrictionReason = reLoanEval.getProductRestrictionReason('REGULAR_MPL');
            if (restrictionReason && !reasons.includes(restrictionReason)) {
              reasons.push(restrictionReason);
            }
          }
        }
      } else {
        // Emergency, Commodity, Calamity Assistance, Petty Cash:
        // An active Regular Multi-Purpose Loan is explicitly ALLOWED!
        if (reLoanEval.hasActiveRegularMpl) {
          isAllowedWithActiveMpl = true;
        }

        // Only restrict if active loan of this EXACT same facility is still ongoing
        if (activeLoanOfThisType) {
          reasons.push(`You currently have an active ${product.name} (Balance: ${formatPHP(activeLoanOfThisType.balance)}). Settle this facility before new drawdown.`);
        }
      }

      const isEligible = reasons.length === 0 && (isMpl ? (!reLoanEval.hasActiveRegularMpl || reLoanEval.canReLoanRegularMpl) : true);

      // Determine max borrowable amount for their specific tenure
      let tenureMax = evalResult.maximumLoanAmount;
      if (product.code === 'PETTY_CASH') {
        tenureMax = service.totalDecimalYears >= 0.5 ? 5000 : 0;
      } else if (product.code === 'CALAMITY') {
        tenureMax = service.totalDecimalYears >= 1 ? 20000 : 0;
      }

      // Sample semi-monthly amortization estimate for max amount and max term
      const sampleTerm = Math.min(product.maxTermMonths, 12);
      const sampleAmount = Math.min(tenureMax || product.minAmount, 20000);
      const financials = calculateLoanFinancials(
        sampleAmount,
        sampleTerm,
        product
      );

      return {
        product,
        isEligible,
        isReLoan,
        isAllowedWithActiveMpl,
        reasons,
        tenureMax,
        sampleFinancials: financials,
        sampleAmount,
        sampleTerm,
        hasExistingOfProduct: !!activeLoanOfThisType,
        existingBalanceOnProduct: activeLoanOfThisType?.balance || 0,
      };
    });
  }, [applicant, loanProducts, totalActiveBalance, myLoans, service, reLoanEval]);

  const eligibleCount = evaluations.filter(e => e.isEligible).length;
  const ineligibleCount = evaluations.length - eligibleCount;

  const filteredEvaluations = evaluations.filter(e => {
    if (filter === 'ELIGIBLE') return e.isEligible;
    if (filter === 'INELIGIBLE') return !e.isEligible;
    return true;
  });

  // Active simulated product
  const activeSimProduct = evaluations.find(e => e.product.id === selectedProductForSim);

  const simFinancials = useMemo(() => {
    if (!activeSimProduct) return null;
    return calculateLoanFinancials(
      simAmount,
      simTerm,
      activeSimProduct.product
    );
  }, [activeSimProduct, simAmount, simTerm]);

  const simIsEligible = useMemo(() => {
    if (!activeSimProduct) return false;
    if (!activeSimProduct.isEligible) return false;
    if (simAmount > activeSimProduct.tenureMax) return false;
    if (simAmount < activeSimProduct.product.minAmount) return false;
    if (simTerm > activeSimProduct.product.maxTermMonths) return false;
    return true;
  }, [activeSimProduct, simAmount, simTerm]);

  const handleStartSimulation = (product: LoanProduct, tenureMax: number) => {
    setSelectedProductForSim(product.id);
    const initialAmount = Math.max(product.minAmount, Math.min(tenureMax, 15000));
    setSimAmount(initialAmount);
    setSimTerm(Math.min(product.maxTermMonths, 12));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-500/30 shadow-lg overflow-hidden transition-all duration-200">
      {/* Header section with OPEC Gold & Navy accents */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white border-b border-amber-500/25">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Loan Eligibility Checker
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                OPEC Credit Policy Assessment
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-2 tracking-tight">
              Pre-Qualification Status & Borrowing Capacity
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time analysis comparing your service tenure ({service.formatted}), current loan balance ({formatPHP(totalActiveBalance)}), and employment status against OPEC cooperative credit products.
            </p>
          </div>

          {/* Quick status scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 shrink-0">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Tenure</span>
              <span className="text-sm font-black text-amber-400">{service.formatted}</span>
              <span className="text-[10px] text-slate-400 block">Tier: {service.totalDecimalYears >= 5 ? 'Tier 1 (≥5y)' : service.totalDecimalYears >= 3 ? 'Tier 2 (≥3y)' : 'Standard'}</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Debt</span>
              <span className="text-sm font-black text-white">{formatPHP(totalActiveBalance)}</span>
              <span className="text-[10px] text-slate-400 block">{myLoans.length} Active Account(s)</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
              <span className="text-sm font-black text-emerald-400">{applicant.employmentStatus}</span>
              <span className="text-[10px] text-slate-400 block">{applicant.opecMembership ? 'OPEC Member' : 'Non-Member'}</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Qualification</span>
              <span className="text-sm font-black text-amber-400">{eligibleCount} of {loanProducts.length} Eligible</span>
              <span className="text-[10px] text-slate-400 block">Instant Clearance</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Products ({loanProducts.length})
          </button>
          <button
            onClick={() => setFilter('ELIGIBLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'ELIGIBLE'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/90 text-emerald-400 hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Eligible ({eligibleCount})</span>
          </button>
          <button
            onClick={() => setFilter('INELIGIBLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'INELIGIBLE'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-800/90 text-rose-400 hover:bg-slate-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Needs Qualifications ({ineligibleCount})</span>
          </button>
        </div>
      </div>

      {/* Main Grid of Loan Product Eligibility Cards */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvaluations.map(({ product, isEligible, isReLoan, isAllowedWithActiveMpl, reasons, tenureMax, sampleFinancials, sampleAmount, sampleTerm, hasExistingOfProduct, existingBalanceOnProduct }) => {
            const isCurrentlySelected = selectedProductForSim === product.id;

            return (
              <div
                key={product.id}
                className={`rounded-xl border-2 p-5 transition-all flex flex-col justify-between ${
                  isEligible
                    ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-500'
                    : 'border-slate-300 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-90'
                } ${isCurrentlySelected ? 'ring-2 ring-amber-500 shadow-md' : ''}`}
              >
                <div>
                  {/* Top Header & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                          {product.code}
                        </span>
                        {isAllowedWithActiveMpl && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            Allowed with Active MPL
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {product.name}
                      </h3>
                    </div>

                    {isEligible ? (
                      isReLoan ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center gap-1 shrink-0 shadow-2xs">
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          Re-Loan Eligible
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-xs font-black bg-emerald-500 text-slate-950 flex items-center gap-1 shrink-0 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Eligible
                        </span>
                      )
                    ) : (
                      <span className="px-2.5 py-1 rounded-md text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 shrink-0">
                        <XCircle className="w-3.5 h-3.5" />
                        {product.code === 'REGULAR_MPL' ? 'Re-Loan Locked' : 'Not Eligible'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Detailed Criteria Checklist */}
                  <div className="space-y-2 py-3 border-y border-slate-200/80 dark:border-slate-800 text-xs">
                    {/* Tenure Check */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Min. Service Required:
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {product.minServiceYearsApplicant} yr(s)
                        </span>
                        <span className={`ml-1.5 text-[11px] font-bold ${
                          service.totalDecimalYears >= product.minServiceYearsApplicant
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          (You: {service.formatted})
                        </span>
                      </div>
                    </div>

                    {/* Borrowing Limit based on tenure */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        Qualified Credit Limit:
                      </span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                        {isEligible ? formatPHP(tenureMax) : '₱0.00'}
                      </span>
                    </div>

                    {/* Co-makers Requirement */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        Required Co-Makers:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">
                        {product.requiredCoMakers === 0
                          ? '0 (No Co-maker Needed)'
                          : `${product.requiredCoMakers} co-maker(s) (≥${product.minServiceYearsCoMaker}y)`}
                      </span>
                    </div>

                    {/* Interest Rate & Term */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-purple-500" />
                        Interest & Terms:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">
                        {product.interestRate}%/mo · {product.minTermMonths}-{product.maxTermMonths} mos
                      </span>
                    </div>

                    {/* Outstanding Balance Note if exists */}
                    {hasExistingOfProduct && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
                        <span className="font-bold">Active Loan:</span> Balance of {formatPHP(existingBalanceOnProduct)} currently active on this facility.
                      </div>
                    )}
                  </div>

                  {/* Disqualification Reasons Banner if ineligible */}
                  {!isEligible && reasons.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                      <span className="font-black flex items-center gap-1 text-[11px] uppercase tracking-wider text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Policy Requirements Not Met:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {reasons.map((r, idx) => (
                          <li key={idx} className="leading-snug">{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Pre-calculated Estimated Payment if eligible */}
                  {isEligible && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Est. Payday Deduction ({sampleTerm} mos):
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatPHP(sampleFinancials.semiMonthlyDeduction)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions bottom bar */}
                <div className="pt-4 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  {isEligible ? (
                    <>
                      <button
                        onClick={() => {
                          if (onOpenApplyWithTerms) {
                            onOpenApplyWithTerms({
                              productId: product.id,
                              amount: tenureMax,
                              termMonths: Math.min(product.maxTermMonths, 12),
                            });
                          } else if (onOpenApply) {
                            onOpenApply();
                          }
                        }}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span>{isReLoan ? 'Apply Re-Loan' : 'Apply Now'} ({formatPHP(tenureMax)})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleStartSimulation(product, tenureMax)}
                        title="Simulate custom loan amount and terms"
                        className={`p-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                          isCurrentlySelected
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750'
                        }`}
                      >
                        <Calculator className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 py-1 font-medium">
                      <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold text-[11px] truncate max-w-[220px]" title={reasons.join(' ')}>
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        {product.code === 'REGULAR_MPL' && reLoanEval.hasActiveRegularMpl
                          ? `Re-Loan Locked (${reLoanEval.paymentPercentage.toFixed(0)}% Paid · Need ≥50%)`
                          : 'Application Disabled'}
                      </span>
                      <button
                        onClick={() => handleStartSimulation(product, tenureMax || product.minAmount)}
                        className="text-amber-600 dark:text-amber-400 font-bold hover:underline shrink-0"
                      >
                        Simulate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Loan Term Simulator Section (When a product is selected for simulation) */}
        {activeSimProduct && (
          <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-slate-900 text-white border-2 border-amber-500/50 shadow-xl space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Live Eligibility Simulator
                  </span>
                  <h4 className="text-lg font-black text-white">
                    Testing Terms for: {activeSimProduct.product.name}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-md text-xs font-black ${
                  simIsEligible
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-rose-600 text-white'
                }`}>
                  {simIsEligible ? 'QUALIFIED FOR SPECIFIED TERMS' : 'TERMS EXCEED TENURE CAPACITY'}
                </span>
                <button
                  onClick={() => setSelectedProductForSim(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Controls Column */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-bold text-slate-300">Desired Amount:</label>
                    <span className="font-mono font-bold text-amber-400">{formatPHP(simAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min={activeSimProduct.product.minAmount}
                    max={Math.max(activeSimProduct.product.minAmount, activeSimProduct.tenureMax)}
                    step={1000}
                    value={simAmount}
                    onChange={e => setSimAmount(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>Min: {formatPHP(activeSimProduct.product.minAmount)}</span>
                    <span>Max Qualified: {formatPHP(activeSimProduct.tenureMax)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-bold text-slate-300">Repayment Term (Months):</label>
                    <span className="font-mono font-bold text-amber-400">{simTerm} Months</span>
                  </div>
                  <input
                    type="range"
                    min={activeSimProduct.product.minTermMonths}
                    max={activeSimProduct.product.maxTermMonths}
                    step={1}
                    value={simTerm}
                    onChange={e => setSimTerm(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>Min: {activeSimProduct.product.minTermMonths} mos</span>
                    <span>Max: {activeSimProduct.product.maxTermMonths} mos</span>
                  </div>
                </div>
              </div>

              {/* Financial Calculation Column */}
              {simFinancials && (
                <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700 space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block pb-1 border-b border-slate-700">
                    Calculated Financial Breakdown
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gross Principal:</span>
                    <span className="font-mono font-bold text-white">{formatPHP(simFinancials.principal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Interest ({activeSimProduct.product.interestRate}%/mo):</span>
                    <span className="font-mono font-bold text-amber-300">{formatPHP(simFinancials.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Processing Fee:</span>
                    <span className="font-mono font-bold text-white">{formatPHP(simFinancials.processingFee)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-700">
                    <span className="text-slate-300 font-bold">Total Repayable:</span>
                    <span className="font-mono font-bold text-amber-400">{formatPHP(simFinancials.totalPayable)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-emerald-400 font-bold">
                    <span>Semi-Monthly Salary Deduction:</span>
                    <span className="font-mono text-sm">{formatPHP(simFinancials.semiMonthlyDeduction)}</span>
                  </div>
                </div>
              )}

              {/* Action Column */}
              <div className="flex flex-col justify-between space-y-3">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs space-y-1">
                  <span className="font-bold text-slate-200 block">Pre-flight Verification:</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Salary Deduction represents approx. {Math.round((simFinancials?.semiMonthlyDeduction || 0) / (applicant.monthlySalary / 2) * 100)}% of your semi-monthly salary ({formatPHP(applicant.monthlySalary / 2)}). Well within OPEC safe debt ceiling.
                  </p>
                </div>

                <button
                  disabled={!simIsEligible || !reLoanEval.canApply}
                  title={!reLoanEval.canApply ? reLoanEval.reason : undefined}
                  onClick={() => {
                    if (onOpenApplyWithTerms) {
                      onOpenApplyWithTerms({
                        productId: activeSimProduct.product.id,
                        amount: simAmount,
                        termMonths: simTerm,
                      });
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                    simIsEligible && reLoanEval.canApply
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-md'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-80'
                  }`}
                >
                  <Lock className={`w-4 h-4 ${simIsEligible && reLoanEval.canApply ? 'hidden' : 'inline'}`} />
                  <span>
                    {!reLoanEval.canApply
                      ? `Re-Loan Disabled (${reLoanEval.paymentPercentage.toFixed(0)}% Paid · Need >50%)`
                      : `Apply with These Terms (${formatPHP(simAmount)})`}
                  </span>
                  {simIsEligible && reLoanEval.canApply && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
