import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../lib/loans/calculator';
import { evaluateReLoanEligibility } from '../../lib/loans/eligibility';
import { LoanProduct } from '../../types';
import {
  Calculator,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingDown,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  ShieldCheck,
  Building,
  Lock,
  ArrowRight,
  Info,
  Sparkles,
  Percent,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Printer,
  BadgeAlert,
  Coins,
  Receipt,
  Scale,
} from 'lucide-react';

interface LoanRepaymentSimulatorProps {
  onApplyWithTerms?: (terms: { productId: string; amount: number; termMonths: number }) => void;
  className?: string;
  defaultAmount?: number;
  defaultTerm?: number;
  defaultInterestRate?: number;
}

interface SimulatedScheduleRow {
  installmentNo: number;
  periodLabel: string;
  dueDate: string;
  beginningBalance: number;
  principal: number;
  interest: number;
  installmentAmount: number;
  endingBalance: number;
}

export const LoanRepaymentSimulator: React.FC<LoanRepaymentSimulatorProps> = ({
  onApplyWithTerms,
  className = '',
  defaultAmount = 20000,
  defaultTerm = 12,
  defaultInterestRate = 1.5,
}) => {
  const { currentUser, employees, activeLoans, applications, loanProducts } = useApp();

  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];

  // 1. Detect applicant's real existing active loan accounts
  const existingActiveLoans = useMemo(() => {
    return activeLoans.filter(
      l => l.employeeId === applicant.id &&
           ['ACTIVE', 'PARTIALLY_PAID', 'APPROVED', 'RELEASED'].includes(l.status) &&
           l.balance > 0
    );
  }, [activeLoans, applicant.id]);

  const primaryExistingLoan = existingActiveLoans[0] || null;

  // Real outstanding balance from ledger
  const realOutstandingBalance = useMemo(() => {
    return existingActiveLoans.reduce((sum, l) => sum + (l.balance || 0), 0);
  }, [existingActiveLoans]);

  // Real existing monthly amortization
  const realExistingMonthlyAmortization = useMemo(() => {
    return existingActiveLoans.reduce((sum, l) => {
      if (l.schedules && l.schedules.length > 0) {
        const upcoming = l.schedules.find(s => s.status === 'SCHEDULED');
        if (upcoming) return sum + (upcoming.amount * 2);
      }
      return sum + (l.balance / 12);
    }, 0);
  }, [existingActiveLoans]);

  // Evaluate OPEC re-loan & 35% take-home pay rules
  const reLoanEval = useMemo(() => {
    return evaluateReLoanEligibility(applicant, activeLoans, applications);
  }, [applicant, activeLoans, applications]);

  // 2. Interactive Simulator State
  const [selectedProductId, setSelectedProductId] = useState<string>(
    loanProducts[0]?.id || 'prod-commodity'
  );
  const selectedProduct = useMemo(() => {
    return loanProducts.find(p => p.id === selectedProductId) || loanProducts[0] || {
      id: 'prod-standard',
      name: 'Standard OPEC Loan',
      code: 'REGULAR',
      interestRate: 1.5,
      minAmount: 5000,
      maxAmount: 50000,
      maxTermMonths: 24,
      processingFee: 50,
      interestMethod: 'FLAT_RATE',
    };
  }, [loanProducts, selectedProductId]);

  // Loan parameters
  const [simPrincipal, setSimPrincipal] = useState<number>(defaultAmount);
  const [simInterestRate, setSimInterestRate] = useState<number>(
    selectedProduct.interestRate || defaultInterestRate
  );
  const [simTermMonths, setSimTermMonths] = useState<number>(defaultTerm);
  const [interestMethod, setInterestMethod] = useState<'FLAT_RATE' | 'REDUCING_BALANCE'>('FLAT_RATE');
  const [frequency, setFrequency] = useState<'SEMI_MONTHLY' | 'MONTHLY'>('SEMI_MONTHLY');

  // Outstanding Loan Balance Configuration
  const [includeExistingBalance, setIncludeExistingBalance] = useState<boolean>(realOutstandingBalance > 0);
  const [simOutstandingBalance, setSimOutstandingBalance] = useState<number>(realOutstandingBalance);
  const [balanceHandlingMode, setBalanceHandlingMode] = useState<'PARALLEL' | 'CONSOLIDATE'>('PARALLEL');
  const [existingMonthlyPaymentInput, setExistingMonthlyPaymentInput] = useState<number>(
    Math.round(realExistingMonthlyAmortization)
  );

  // Salary Simulator
  const [grossMonthlySalary, setGrossMonthlySalary] = useState<number>(
    applicant.monthlySalary || 28000
  );

  // Expandable schedule toggle
  const [showScheduleTable, setShowScheduleTable] = useState<boolean>(false);
  const [schedulePage, setSchedulePage] = useState<number>(1);

  // Quick preset handlers
  const handleAmountPreset = (amt: number) => {
    setSimPrincipal(amt);
  };

  const handleTermPreset = (months: number) => {
    setSimTermMonths(months);
  };

  const handleRatePreset = (rate: number) => {
    setSimInterestRate(rate);
  };

  const handleResetToProfile = () => {
    setSimPrincipal(20000);
    setSimInterestRate(selectedProduct.interestRate || 1.5);
    setSimTermMonths(12);
    setInterestMethod('FLAT_RATE');
    setFrequency('SEMI_MONTHLY');
    setIncludeExistingBalance(realOutstandingBalance > 0);
    setSimOutstandingBalance(realOutstandingBalance);
    setBalanceHandlingMode('PARALLEL');
    setExistingMonthlyPaymentInput(Math.round(realExistingMonthlyAmortization));
    setGrossMonthlySalary(applicant.monthlySalary || 28000);
  };

  // 3. Mathematical Amortization Engine
  const simulation = useMemo(() => {
    const principal = Math.max(1000, Number(simPrincipal) || 0);
    const months = Math.max(1, Number(simTermMonths) || 1);
    const monthlyRateDec = (Number(simInterestRate) || 0) / 100;
    const processingFee = selectedProduct.processingFee || 50;

    let totalInterest = 0;
    const rows: SimulatedScheduleRow[] = [];

    const totalInstallments = frequency === 'SEMI_MONTHLY' ? months * 2 : months;
    const periodsPerMonth = frequency === 'SEMI_MONTHLY' ? 2 : 1;
    const periodicRate = monthlyRateDec / periodsPerMonth;

    if (interestMethod === 'FLAT_RATE') {
      // Standard OPEC flat rate: Interest = Principal * MonthlyRate * TermMonths
      totalInterest = principal * monthlyRateDec * months;
      const totalPayable = principal + totalInterest;
      const perInstallmentTotal = Math.round((totalPayable / totalInstallments) * 100) / 100;
      const perInstallmentPrincipal = Math.round((principal / totalInstallments) * 100) / 100;
      const perInstallmentInterest = Math.round((totalInterest / totalInstallments) * 100) / 100;

      let balance = totalPayable;
      const baseDate = new Date(2026, 9, 15); // Oct 15, 2026 reference
      let curYear = baseDate.getFullYear();
      let curMonth = baseDate.getMonth();
      let is15th = baseDate.getDate() <= 15;

      for (let i = 1; i <= totalInstallments; i++) {
        const isLast = i === totalInstallments;
        const instAmt = isLast ? Math.round(balance * 100) / 100 : perInstallmentTotal;
        const instPrinc = isLast ? Math.round((balance - perInstallmentInterest) * 100) / 100 : perInstallmentPrincipal;
        const instInt = isLast ? perInstallmentInterest : perInstallmentInterest;
        const endBal = Math.max(0, Math.round((balance - instAmt) * 100) / 100);

        const d = new Date(curYear, curMonth, frequency === 'SEMI_MONTHLY' ? (is15th ? 15 : 30) : 30);
        const dateStr = d.toISOString().split('T')[0];

        rows.push({
          installmentNo: i,
          periodLabel: frequency === 'SEMI_MONTHLY' ? `${is15th ? '15th' : '30th'} Payday` : `Month ${i}`,
          dueDate: dateStr,
          beginningBalance: balance,
          principal: instPrinc,
          interest: instInt,
          installmentAmount: instAmt,
          endingBalance: endBal,
        });

        balance = endBal;

        if (frequency === 'SEMI_MONTHLY') {
          if (is15th) {
            is15th = false;
          } else {
            is15th = true;
            curMonth++;
            if (curMonth > 11) {
              curMonth = 0;
              curYear++;
            }
          }
        } else {
          curMonth++;
          if (curMonth > 11) {
            curMonth = 0;
            curYear++;
          }
        }
      }
    } else {
      // Diminishing / Reducing Balance
      // Fixed principal amortization with declining interest
      const fixedPrincipalPerPeriod = Math.round((principal / totalInstallments) * 100) / 100;
      let balance = principal;
      const baseDate = new Date(2026, 9, 15);
      let curYear = baseDate.getFullYear();
      let curMonth = baseDate.getMonth();
      let is15th = baseDate.getDate() <= 15;

      for (let i = 1; i <= totalInstallments; i++) {
        const isLast = i === totalInstallments;
        const interestForPeriod = Math.round((balance * periodicRate) * 100) / 100;
        totalInterest += interestForPeriod;
        const principalForPeriod = isLast ? Math.round(balance * 100) / 100 : fixedPrincipalPerPeriod;
        const installmentAmt = Math.round((principalForPeriod + interestForPeriod) * 100) / 100;
        const endBal = Math.max(0, Math.round((balance - principalForPeriod) * 100) / 100);

        const d = new Date(curYear, curMonth, frequency === 'SEMI_MONTHLY' ? (is15th ? 15 : 30) : 30);
        const dateStr = d.toISOString().split('T')[0];

        rows.push({
          installmentNo: i,
          periodLabel: frequency === 'SEMI_MONTHLY' ? `${is15th ? '15th' : '30th'} Payday` : `Month ${i}`,
          dueDate: dateStr,
          beginningBalance: balance,
          principal: principalForPeriod,
          interest: interestForPeriod,
          installmentAmount: installmentAmt,
          endingBalance: endBal,
        });

        balance = endBal;

        if (frequency === 'SEMI_MONTHLY') {
          if (is15th) {
            is15th = false;
          } else {
            is15th = true;
            curMonth++;
            if (curMonth > 11) {
              curMonth = 0;
              curYear++;
            }
          }
        } else {
          curMonth++;
          if (curMonth > 11) {
            curMonth = 0;
            curYear++;
          }
        }
      }
    }

    const totalPayable = principal + totalInterest;
    const monthlyAmortization = frequency === 'SEMI_MONTHLY'
      ? (rows[0]?.installmentAmount || 0) * 2
      : (rows[0]?.installmentAmount || 0);

    const semiMonthlyDeduction = frequency === 'SEMI_MONTHLY'
      ? (rows[0]?.installmentAmount || 0)
      : Math.round(((rows[0]?.installmentAmount || 0) / 2) * 100) / 100;

    // Existing Loan factors
    const activeBalanceAmount = includeExistingBalance ? Math.max(0, Number(simOutstandingBalance) || 0) : 0;
    const activeMonthlyAmort = includeExistingBalance ? Math.max(0, Number(existingMonthlyPaymentInput) || 0) : 0;
    const activeSemiMonthlyAmort = Math.round((activeMonthlyAmort / 2) * 100) / 100;

    // Combined calculations based on handling mode
    let combinedMonthlyAmort = 0;
    let combinedSemiMonthlyDeduction = 0;
    let netCashDisbursement = Math.max(0, principal - processingFee);

    if (balanceHandlingMode === 'CONSOLIDATE' && includeExistingBalance && activeBalanceAmount > 0) {
      // Net disbursement is reduced by the existing loan balance payoff
      netCashDisbursement = Math.max(0, principal - processingFee - activeBalanceAmount);
      // Existing loan balance is settled, so ongoing amortization is just the new loan
      combinedMonthlyAmort = monthlyAmortization;
      combinedSemiMonthlyDeduction = semiMonthlyDeduction;
    } else {
      // Parallel repayment: Both loans deducted simultaneously
      combinedMonthlyAmort = monthlyAmortization + activeMonthlyAmort;
      combinedSemiMonthlyDeduction = semiMonthlyDeduction + activeSemiMonthlyAmort;
    }

    // Salary & 35% Take-Home Pay Meter
    const statutoryDeductions = 3200; // Standard SSS, PhilHealth, Pag-IBIG
    const mandatoryCbuDeduction = 200; // Mandatory OPEC CBU (₱100/payday)
    const totalStatutoryAndCbu = statutoryDeductions + mandatoryCbuDeduction;

    const totalDeductionsWithLoans = totalStatutoryAndCbu + combinedMonthlyAmort;
    const projectedNetSalary = Math.max(0, grossMonthlySalary - totalDeductionsWithLoans);
    const takeHomePercentage = grossMonthlySalary > 0
      ? (projectedNetSalary / grossMonthlySalary) * 100
      : 0;

    const meets35PercentRule = takeHomePercentage >= 35;
    const minTakeHomeThreshold = grossMonthlySalary * 0.35;
    const takeHomeBuffer = projectedNetSalary - minTakeHomeThreshold;

    return {
      principal,
      termMonths: months,
      monthlyRateDec,
      annualRatePercent: Math.round(monthlyRateDec * 12 * 100 * 10) / 10,
      processingFee,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayable: Math.round(totalPayable * 100) / 100,
      netCashDisbursement: Math.round(netCashDisbursement * 100) / 100,
      monthlyAmortization: Math.round(monthlyAmortization * 100) / 100,
      semiMonthlyDeduction: Math.round(semiMonthlyDeduction * 100) / 100,
      totalInstallments,
      rows,
      // Existing loan stats
      activeBalanceAmount,
      activeMonthlyAmort,
      activeSemiMonthlyAmort,
      // Combined stats
      combinedMonthlyAmort: Math.round(combinedMonthlyAmort * 100) / 100,
      combinedSemiMonthlyDeduction: Math.round(combinedSemiMonthlyDeduction * 100) / 100,
      // Take-home pay stats
      totalStatutoryAndCbu,
      totalDeductionsWithLoans: Math.round(totalDeductionsWithLoans * 100) / 100,
      projectedNetSalary: Math.round(projectedNetSalary * 100) / 100,
      projectedSemiMonthlyNet: Math.round((projectedNetSalary / 2) * 100) / 100,
      takeHomePercentage: Math.round(takeHomePercentage * 10) / 10,
      meets35PercentRule,
      minTakeHomeThreshold: Math.round(minTakeHomeThreshold * 100) / 100,
      takeHomeBuffer: Math.round(takeHomeBuffer * 100) / 100,
    };
  }, [
    simPrincipal,
    simTermMonths,
    simInterestRate,
    interestMethod,
    frequency,
    selectedProduct,
    includeExistingBalance,
    simOutstandingBalance,
    existingMonthlyPaymentInput,
    balanceHandlingMode,
    grossMonthlySalary,
  ]);

  // Paginated schedule rows (12 rows per page)
  const pageSize = 12;
  const totalPages = Math.ceil(simulation.rows.length / pageSize);
  const paginatedRows = useMemo(() => {
    const start = (schedulePage - 1) * pageSize;
    return simulation.rows.slice(start, start + pageSize);
  }, [simulation.rows, schedulePage]);

  // Print schedule
  const handlePrintSchedule = () => {
    window.print();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header Banner & Persona Snapshot */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Official OPEC Financial Desk
              </span>
              <span className="text-xs text-slate-300 font-medium">
                · M Lhuillier Multi-Tier Credit Simulator
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2.5">
              <Calculator className="w-6 h-6 text-amber-400" />
              Loan Repayment & Outstanding Balance Simulator
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Estimate your monthly and payday payroll amortization. Seamlessly factor in your current outstanding loan balance, test different interest rates and term lengths, and ensure compliance with the mandatory 35% net take-home pay ceiling before applying.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetToProfile}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-700"
              title="Reset to your profile defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={handlePrintSchedule}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-700"
              title="Print Schedule"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Existing Loan Notification Bar */}
        {primaryExistingLoan ? (
          <div className="mt-5 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Receipt className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200">
                  Detected Active Loan: {primaryExistingLoan.loanNumber}
                </span>
                <span className="text-slate-400 ml-2">
                  Balance: <strong className="text-amber-300 font-mono">{formatPHP(realOutstandingBalance)}</strong> · Current Amortization: <strong className="text-slate-200 font-mono">{formatPHP(realExistingMonthlyAmortization)}/mo</strong>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                reLoanEval.isMoreThanHalfPaid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {reLoanEval.paymentPercentage.toFixed(1)}% Paid ({reLoanEval.isMoreThanHalfPaid ? '>50% Qualified' : 'Need >50%'})
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-5 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>No existing active debt on record. You are eligible to apply for your primary OPEC loan facility.</span>
          </div>
        )}
      </div>

      {/* 2. Main Simulation Grid (Controls Left, Live Impact Dashboard Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Controls & Input Parameters (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Card A: Target Facility & Loan Principal */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-750">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  1. Loan Facility & Desired Principal
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {selectedProduct.code}
              </span>
            </div>

            {/* Product Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Select OPEC Facility Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {loanProducts.filter(p => p.active).map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => {
                      setSelectedProductId(prod.id);
                      setSimInterestRate(prod.interestRate);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                      selectedProductId === prod.id
                        ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-bold ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold truncate">{prod.name}</div>
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                      {prod.interestRate}% / mo · Max {formatPHP(prod.maxAmount)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Principal Amount Slider & Input */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Principal Borrowing Amount:
                </label>
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-xs text-slate-400">₱</span>
                  <input
                    type="number"
                    min={selectedProduct.minAmount || 1000}
                    max={selectedProduct.maxAmount || 50000}
                    step={1000}
                    value={simPrincipal}
                    onChange={e => setSimPrincipal(Number(e.target.value))}
                    className="w-32 px-2.5 py-1 text-sm font-bold font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <input
                type="range"
                min={selectedProduct.minAmount || 5000}
                max={selectedProduct.maxAmount || 50000}
                step={1000}
                value={simPrincipal}
                onChange={e => setSimPrincipal(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              {/* Amount Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Array.from(new Set([5000, 10000, 15000, 20000, 30000, selectedProduct.maxAmount]))
                  .filter(amt => amt >= (selectedProduct.minAmount || 5000) && amt <= (selectedProduct.maxAmount || 50000))
                  .sort((a, b) => a - b)
                  .map(amt => (
                  <button
                    key={`repay-preset-${amt}`}
                    onClick={() => handleAmountPreset(amt)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                      simPrincipal === amt
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {formatPHP(amt)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card B: Interest Rate & Term Lengths */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-750">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. Interest Rate & Repayment Term
                </h2>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {simulation.annualRatePercent}% Annualized APR
              </span>
            </div>

            {/* Interest Rate Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Monthly Interest Rate:
                  </label>
                  <span className="text-[11px] text-slate-400 ml-2">
                    (Standard OPEC rate is 1.50% / mo)
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="number"
                    min={0.25}
                    max={5.0}
                    step={0.05}
                    value={simInterestRate}
                    onChange={e => setSimInterestRate(Number(e.target.value))}
                    className="w-20 px-2 py-1 text-sm font-bold font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-xs text-slate-500 font-bold">%</span>
                </div>
              </div>

              <input
                type="range"
                min={0.5}
                max={3.0}
                step={0.05}
                value={simInterestRate}
                onChange={e => setSimInterestRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              {/* Rate Quick Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: '1.00% (Promo)', val: 1.0 },
                  { label: '1.25% (Preferred)', val: 1.25 },
                  { label: '1.50% (OPEC Standard)', val: 1.5 },
                  { label: '1.75% (Market)', val: 1.75 },
                  { label: '2.00% (Emergency)', val: 2.0 },
                ].map(r => (
                  <button
                    key={r.val}
                    onClick={() => handleRatePreset(r.val)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                      simInterestRate === r.val
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Term Lengths */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-750">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Loan Tenure (Term Length):
                </label>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  {simTermMonths} Months ({simTermMonths >= 12 ? `${(simTermMonths / 12).toFixed(1)} Yrs` : `${simTermMonths} Mos`})
                </span>
              </div>

              <input
                type="range"
                min={3}
                max={selectedProduct.maxTermMonths || 36}
                step={1}
                value={simTermMonths}
                onChange={e => setSimTermMonths(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              {/* Term Quick Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[3, 6, 12, 18, 24, 36].map(t => (
                  <button
                    key={`term-preset-${t}`}
                    onClick={() => handleTermPreset(t)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                      simTermMonths === t
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t} Months
                  </button>
                ))}
              </div>
            </div>

            {/* Interest Method & Frequency Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-750 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Calculation Model
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                  <button
                    onClick={() => setInterestMethod('FLAT_RATE')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                      interestMethod === 'FLAT_RATE'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Flat Rate (OPEC)
                  </button>
                  <button
                    onClick={() => setInterestMethod('REDUCING_BALANCE')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                      interestMethod === 'REDUCING_BALANCE'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Diminishing
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Repayment Schedule
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                  <button
                    onClick={() => setFrequency('SEMI_MONTHLY')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                      frequency === 'SEMI_MONTHLY'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    15th & 30th Paydays
                  </button>
                  <button
                    onClick={() => setFrequency('MONTHLY')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                      frequency === 'MONTHLY'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Monthly Cutoff
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card C: Current Outstanding Loan Balance Integrator */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-750">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  3. Outstanding Loan Balance Factor
                </h2>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeExistingBalance}
                  onChange={e => setIncludeExistingBalance(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Include in Simulation
                </span>
              </label>
            </div>

            {includeExistingBalance ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Outstanding Principal Balance
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400 font-mono">₱</span>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={simOutstandingBalance}
                        onChange={e => setSimOutstandingBalance(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-sm font-bold font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Current Monthly Deduction
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400 font-mono">₱</span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={existingMonthlyPaymentInput}
                        onChange={e => setExistingMonthlyPaymentInput(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-sm font-bold font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Treatment Options */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Outstanding Debt Treatment:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setBalanceHandlingMode('PARALLEL')}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        balanceHandlingMode === 'PARALLEL'
                          ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-bold">Parallel Deduction</div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Both old and new loan amortizations continue simultaneously.
                      </p>
                    </button>

                    <button
                      onClick={() => setBalanceHandlingMode('CONSOLIDATE')}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        balanceHandlingMode === 'CONSOLIDATE'
                          ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-bold">Consolidation / Payoff</div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        New loan pays off existing balance; net cash released is difference.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-750 text-xs text-slate-500 dark:text-slate-400">
                Outstanding balance is excluded from this simulation. The calculation assumes you have zero active loan deduction.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Impact Dashboard & 35% Take-Home Pay Meter (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Card D: Estimated Monthly Amortization Highlights */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Estimated Amortization Summary
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {frequency === 'SEMI_MONTHLY' ? 'Semi-Monthly Cutoffs' : 'Monthly'}
              </span>
            </div>

            {/* Big Numbers */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  New Loan Monthly Amortization:
                </span>
                <div className="text-3xl font-mono font-black text-amber-400 mt-0.5 tracking-tight">
                  {formatPHP(simulation.monthlyAmortization)}
                  <span className="text-xs text-slate-400 font-sans font-normal ml-1">/ month</span>
                </div>
                {frequency === 'SEMI_MONTHLY' && (
                  <div className="text-xs font-mono font-semibold text-emerald-400 mt-1">
                    ≈ {formatPHP(simulation.semiMonthlyDeduction)} per payday (15th & 30th)
                  </div>
                )}
              </div>

              {/* Combined Total If Outstanding Balance Included */}
              {includeExistingBalance && simulation.activeMonthlyAmort > 0 && (
                <div className="pt-3 border-t border-slate-700 space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Existing Loan Monthly Deduction:</span>
                    <span className="font-mono font-bold text-slate-300">
                      {formatPHP(simulation.activeMonthlyAmort)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-amber-300 font-bold pt-1 border-t border-slate-700/60">
                    <span>Combined Total Monthly Deduction:</span>
                    <span className="font-mono text-sm">
                      {formatPHP(simulation.combinedMonthlyAmort)}
                    </span>
                  </div>
                  {frequency === 'SEMI_MONTHLY' && (
                    <div className="flex justify-between text-[11px] text-emerald-400 font-mono">
                      <span>Combined Payday Deduction:</span>
                      <span>{formatPHP(simulation.combinedSemiMonthlyDeduction)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Financial Breakdown Table */}
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Principal Borrowed:</span>
                <span className="font-mono font-bold">{formatPHP(simulation.principal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Interest ({simInterestRate}% × {simTermMonths} mos):</span>
                <span className="font-mono font-bold text-amber-300">+{formatPHP(simulation.totalInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">OPEC Processing Fee:</span>
                <span className="font-mono text-slate-400">₱{simulation.processingFee}.00</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-white">
                <span>Total Repayable:</span>
                <span className="font-mono text-amber-400">{formatPHP(simulation.totalPayable)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-[11px] text-emerald-400">
                <span>Net Cash Received:</span>
                <span className="font-mono font-bold">{formatPHP(simulation.netCashDisbursement)}</span>
              </div>
            </div>
          </div>

          {/* Card E: Salary & 35% Take-Home Pay Meter (Debt Ceiling) */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-750">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Salary Impact & 35% Take-Home Rule
                </h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                simulation.meets35PercentRule
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
              }`}>
                {simulation.meets35PercentRule ? 'Meets 35% Ceiling' : 'Exceeds Ceiling'}
              </span>
            </div>

            {/* Take-Home Pay Progress Bar Gauge */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">
                  Projected Net Take-Home:
                </span>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                  {formatPHP(simulation.projectedNetSalary)} ({simulation.takeHomePercentage}%)
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden relative">
                {/* 35% threshold marker line */}
                <div className="absolute top-0 bottom-0 left-[35%] w-0.5 bg-rose-500 z-10" title="Mandatory 35% minimum threshold" />
                <div
                  className={`h-full transition-all duration-300 ${
                    simulation.meets35PercentRule ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, simulation.takeHomePercentage))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0%</span>
                <span className="text-rose-500 font-bold">35% Minimum Threshold ({formatPHP(simulation.minTakeHomeThreshold)})</span>
                <span>100%</span>
              </div>
            </div>

            {/* Salary Breakdown Lines */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-750 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Gross Monthly Salary:</span>
                <span className="font-mono font-semibold">{formatPHP(grossMonthlySalary)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Statutory & OPEC CBU Deductions:</span>
                <span className="font-mono">-{formatPHP(simulation.totalStatutoryAndCbu)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>All Loan Amortizations (Simulated):</span>
                <span className="font-mono">-{formatPHP(simulation.combinedMonthlyAmort)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                <span>Remaining Net Monthly Pay:</span>
                <span className={`font-mono ${simulation.meets35PercentRule ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatPHP(simulation.projectedNetSalary)}
                </span>
              </div>
            </div>

            {/* Threshold Notice message */}
            <p className={`text-[11px] leading-relaxed p-2.5 rounded-lg border ${
              simulation.meets35PercentRule
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200'
            }`}>
              {simulation.meets35PercentRule
                ? `Safe Debt Ratio: Your projected take-home pay is ${simulation.takeHomePercentage}%, which is ${formatPHP(simulation.takeHomeBuffer)} above the mandatory 35% floor.`
                : `Policy Warning: Your projected take-home pay would drop to ${simulation.takeHomePercentage}%, falling below the mandatory 35% minimum (${formatPHP(simulation.minTakeHomeThreshold)}). Consider lengthening term or borrowing a lower principal.`}
            </p>
          </div>

          {/* Card F: Policy Verification & Direct Apply Button */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Pre-flight OPEC Loan Policy Check
            </span>

            {/* Evaluation Status Banner */}
            {(() => {
              const isSelectedProductMpl = selectedProduct.code === 'REGULAR_MPL' || selectedProduct.id === 'prod-mpl';
              const isSelectedProductAllowed = reLoanEval.isProductAllowed(selectedProduct.code);
              const isSelectedProductReLoan = isSelectedProductMpl && reLoanEval.hasActiveRegularMpl && reLoanEval.canReLoanRegularMpl;
              const canProceed = isSelectedProductAllowed && simulation.meets35PercentRule;

              return (
                <>
                  <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    canProceed
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                  }`}>
                    {canProceed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold">
                        {canProceed
                          ? (isSelectedProductReLoan
                              ? 'Halfway Re-Loan Qualified'
                              : (!isSelectedProductMpl && reLoanEval.hasActiveRegularMpl
                                  ? 'Allowed with Active Regular MPL'
                                  : 'Eligible for OPEC Loan Drawdown'))
                          : 'Loan Policy Restriction Active'}
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {!simulation.meets35PercentRule
                          ? 'The simulated loan terms violate the 35% take-home pay rule. Adjust amount or term length.'
                          : !isSelectedProductAllowed
                          ? (reLoanEval.getProductRestrictionReason(selectedProduct.code) || reLoanEval.reason)
                          : (!isSelectedProductMpl && reLoanEval.hasActiveRegularMpl
                              ? 'Under OPEC policy, you are permitted to loan for Emergency, Commodity, Calamity Assistance, or Petty Cash while your Regular MPL is active.'
                              : reLoanEval.reason)}
                      </p>
                    </div>
                  </div>

                  {/* Action Apply Button (Respects disabling rules) */}
                  {onApplyWithTerms && (
                    <div className="pt-2">
                      {canProceed ? (
                        <button
                          type="button"
                          onClick={() =>
                            onApplyWithTerms({
                              productId: selectedProduct.id,
                              amount: simulation.principal,
                              termMonths: simulation.termMonths,
                            })
                          }
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>
                            {isSelectedProductReLoan
                              ? `Apply for Re-Loan with These Terms (${formatPHP(simulation.principal)})`
                              : `Apply for Loan with These Terms (${formatPHP(simulation.principal)})`}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title={!simulation.meets35PercentRule ? 'Net take-home pay falls below 35% debt ceiling' : (reLoanEval.getProductRestrictionReason(selectedProduct.code) || reLoanEval.reason)}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-750 text-slate-400 dark:text-slate-500 font-bold text-xs border border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-80"
                        >
                          <Lock className="w-4 h-4 text-amber-500" />
                          <span>
                            {!simulation.meets35PercentRule
                              ? 'Apply Disabled (Take-Home < 35%)'
                              : isSelectedProductMpl && reLoanEval.hasActiveRegularMpl
                              ? `Regular MPL Locked (${reLoanEval.paymentPercentage.toFixed(0)}% Paid · Need ≥50%)`
                              : 'Apply Loan Disabled'}
                          </span>
                        </button>
                      )}
                      <p className="text-[10px] text-center text-slate-400 mt-1.5">
                        Pre-populates facility, amount, and term directly into the official 6-step loan wizard.
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

        </div>
      </div>

      {/* 3. Expandable Amortization Schedule Drawer & Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowScheduleTable(!showScheduleTable)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Complete Amortization Breakdown Table ({simulation.rows.length} Installments)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Review installment dates, principal vs interest distribution, and remaining balances per cutoff.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>{showScheduleTable ? 'Hide Schedule' : 'View Schedule'}</span>
            {showScheduleTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showScheduleTable && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-700 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Cutoff Period</th>
                    <th className="py-2.5 px-3">Scheduled Due Date</th>
                    <th className="py-2.5 px-3 text-right">Beginning Balance</th>
                    <th className="py-2.5 px-3 text-right">Principal</th>
                    <th className="py-2.5 px-3 text-right">Interest</th>
                    <th className="py-2.5 px-3 text-right font-black text-amber-600 dark:text-amber-400">Installment Deduction</th>
                    <th className="py-2.5 px-3 text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750 font-mono">
                  {paginatedRows.map(row => (
                    <tr key={row.installmentNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/40">
                      <td className="py-2 px-3 text-slate-400">{row.installmentNo}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-700 dark:text-slate-300">{row.periodLabel}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{row.dueDate}</td>
                      <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">{formatPHP(row.beginningBalance)}</td>
                      <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{formatPHP(row.principal)}</td>
                      <td className="py-2 px-3 text-right text-amber-600 dark:text-amber-400">{formatPHP(row.interest)}</td>
                      <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-white">{formatPHP(row.installmentAmount)}</td>
                      <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300 font-semibold">{formatPHP(row.endingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">
                  Showing page {schedulePage} of {totalPages} ({simulation.rows.length} total cutoffs)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={schedulePage === 1}
                    onClick={() => setSchedulePage(prev => Math.max(1, prev - 1))}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 disabled:opacity-40 font-semibold cursor-pointer"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx + 1}
                      onClick={() => setSchedulePage(idx + 1)}
                      className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                        schedulePage === idx + 1
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    disabled={schedulePage === totalPages}
                    onClick={() => setSchedulePage(prev => Math.min(totalPages, prev + 1))}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 disabled:opacity-40 font-semibold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
