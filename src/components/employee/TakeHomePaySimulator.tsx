import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../lib/loans/calculator';
import { LoanProduct } from '../../types';
import {
  Calculator,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Info,
  Layers,
  Percent,
  Printer,
  Sparkles,
  ArrowRight,
  TrendingDown,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertTriangle,
  Wallet,
  Coins,
  ShieldCheck,
  Building,
  Lock,
} from 'lucide-react';
import { evaluateReLoanEligibility } from '../../lib/loans/eligibility';

interface TakeHomePaySimulatorProps {
  onApplyWithTerms?: (terms: { productId: string; amount: number; termMonths: number }) => void;
  className?: string;
}

interface MonthlyAmortizationImpactRow {
  month: number;
  dueDate: string;
  beginningBalance: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  projectedTakeHomeMonthly: number;
  projectedTakeHomeCutoff: number;
}

export const TakeHomePaySimulator: React.FC<TakeHomePaySimulatorProps> = ({
  onApplyWithTerms,
  className = '',
}) => {
  const { loanProducts, currentUser, employees, activeLoans, applications } = useApp();

  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];

  const reLoanEval = useMemo(() => {
    return evaluateReLoanEligibility(applicant, activeLoans, applications);
  }, [applicant, activeLoans, applications]);

  // Active loans for this applicant
  const myLoans = activeLoans.filter(l => l.employeeId === applicant.id && l.status === 'ACTIVE');
  const existingMonthlyLoanDeductions = myLoans.reduce((sum, l) => {
    // Semi-monthly deduction estimate
    const sampleTerm = 12;
    const monthlyRate = 0.015;
    const monthlyAmt = (l.balance / sampleTerm) + (l.balance * monthlyRate);
    return sum + (monthlyAmt > 0 ? monthlyAmt : 0);
  }, 0);

  // Available loan products
  const availableProducts = useMemo(() => {
    return loanProducts.filter(p => p.active);
  }, [loanProducts]);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    availableProducts[0]?.id || ''
  );

  const selectedProduct: LoanProduct = useMemo(() => {
    return availableProducts.find(p => p.id === selectedProductId) || availableProducts[0] || {
      id: 'prod-commodity',
      code: 'COMMODITY',
      name: 'Commodity / Appliance Loan',
      description: 'Acquisition of home appliances, laptops, and essentials',
      minAmount: 5000,
      maxAmount: 50000,
      minTermMonths: 6,
      maxTermMonths: 24,
      interestRate: 1.5,
      interestMethod: 'FLAT_RATE',
      processingFee: 50,
      requiredCoMakers: 1,
      minServiceYearsCoMaker: 5,
      minServiceYearsApplicant: 1,
      active: true,
      applicableDeductions: 'PAYDAY_TWICE_MONTHLY',
    };
  }, [availableProducts, selectedProductId]);

  // Interactive user inputs
  const defaultBaseSalary = applicant.monthlySalary || 28000;
  const [baseMonthlySalary, setBaseMonthlySalary] = useState<number>(defaultBaseSalary);
  const [includeStatutory, setIncludeStatutory] = useState<boolean>(true);
  const [includeExistingLoans, setIncludeExistingLoans] = useState<boolean>(true);

  const [loanAmount, setLoanAmount] = useState<number>(20000);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [customRate, setCustomRate] = useState<number>(selectedProduct.interestRate);
  const [interestMethod, setInterestMethod] = useState<'FLAT_RATE' | 'REDUCING_BALANCE'>(
    selectedProduct.interestMethod === 'REDUCING_BALANCE' ? 'REDUCING_BALANCE' : 'FLAT_RATE'
  );

  const [showFullSchedule, setShowFullSchedule] = useState<boolean>(true);
  const [scheduleViewMode, setScheduleViewMode] = useState<'all' | 'first6'>('all');
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Handle product change
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = availableProducts.find(p => p.id === prodId);
    if (prod) {
      setCustomRate(prod.interestRate);
      setInterestMethod(prod.interestMethod === 'REDUCING_BALANCE' ? 'REDUCING_BALANCE' : 'FLAT_RATE');
      if (loanAmount > prod.maxAmount) setLoanAmount(prod.maxAmount);
      if (loanAmount < prod.minAmount) setLoanAmount(prod.minAmount);
      if (termMonths > prod.maxTermMonths) setTermMonths(prod.maxTermMonths);
      if (termMonths < prod.minTermMonths) setTermMonths(prod.minTermMonths);
    }
  };

  // 1. Current Deductions Analysis
  const mandatoryCbuDeductionMonthly = 200; // ₱100 / payday cutoff = ₱200 / month
  const statutoryDeductionsMonthly = includeStatutory
    ? Math.round(baseMonthlySalary * 0.095) // ~9.5% SSS, PhilHealth, Pag-IBIG
    : 0;
  const activeLoansDeductionMonthly = includeExistingLoans
    ? Math.round(existingMonthlyLoanDeductions)
    : 0;

  const currentTotalDeductionsMonthly =
    mandatoryCbuDeductionMonthly + statutoryDeductionsMonthly + activeLoansDeductionMonthly;
  const currentNetTakeHomeMonthly = Math.max(0, baseMonthlySalary - currentTotalDeductionsMonthly);
  const currentNetTakeHomeCutoff = currentNetTakeHomeMonthly / 2;

  // 2. New Loan Simulation & Interest Impact
  const simulation = useMemo(() => {
    const principal = Math.max(1000, loanAmount);
    const months = Math.max(1, termMonths);
    const monthlyRate = customRate / 100;
    const processingFee = selectedProduct.processingFee || 50;

    let totalInterest = 0;
    const monthlyRows: MonthlyAmortizationImpactRow[] = [];

    const now = new Date();
    const startYear = now.getFullYear();
    const startMonth = now.getMonth() + 1;

    if (interestMethod === 'FLAT_RATE') {
      const monthlyInterest = principal * monthlyRate;
      totalInterest = monthlyInterest * months;
      const monthlyPrincipal = principal / months;
      const monthlyPayment = monthlyPrincipal + monthlyInterest;

      let remainingBalance = principal;

      for (let m = 1; m <= months; m++) {
        const dueDate = new Date(startYear, startMonth + m - 1, 15);
        const dateStr = dueDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
        const begBal = remainingBalance;
        const actualPrincipal = m === months ? remainingBalance : monthlyPrincipal;
        const actualPayment = actualPrincipal + monthlyInterest;
        remainingBalance = Math.max(0, remainingBalance - actualPrincipal);

        const projectedTakeHomeMonthly = Math.max(0, currentNetTakeHomeMonthly - actualPayment);
        const projectedTakeHomeCutoff = projectedTakeHomeMonthly / 2;

        monthlyRows.push({
          month: m,
          dueDate: dateStr,
          beginningBalance: Math.round(begBal * 100) / 100,
          payment: Math.round(actualPayment * 100) / 100,
          principal: Math.round(actualPrincipal * 100) / 100,
          interest: Math.round(monthlyInterest * 100) / 100,
          remainingBalance: Math.round(remainingBalance * 100) / 100,
          projectedTakeHomeMonthly: Math.round(projectedTakeHomeMonthly * 100) / 100,
          projectedTakeHomeCutoff: Math.round(projectedTakeHomeCutoff * 100) / 100,
        });
      }
    } else {
      let monthlyPayment = 0;
      if (monthlyRate === 0) {
        monthlyPayment = principal / months;
      } else {
        const factor = Math.pow(1 + monthlyRate, months);
        monthlyPayment = (principal * (monthlyRate * factor)) / (factor - 1);
      }

      let remainingBalance = principal;

      for (let m = 1; m <= months; m++) {
        const dueDate = new Date(startYear, startMonth + m - 1, 15);
        const dateStr = dueDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
        const begBal = remainingBalance;
        const interestComponent = remainingBalance * monthlyRate;
        let principalComponent = monthlyPayment - interestComponent;

        if (m === months || remainingBalance - principalComponent < 0.5) {
          principalComponent = remainingBalance;
          monthlyPayment = principalComponent + interestComponent;
        }

        remainingBalance = Math.max(0, remainingBalance - principalComponent);
        totalInterest += interestComponent;

        const totalPay = principalComponent + interestComponent;
        const projectedTakeHomeMonthly = Math.max(0, currentNetTakeHomeMonthly - totalPay);
        const projectedTakeHomeCutoff = projectedTakeHomeMonthly / 2;

        monthlyRows.push({
          month: m,
          dueDate: dateStr,
          beginningBalance: Math.round(begBal * 100) / 100,
          payment: Math.round(totalPay * 100) / 100,
          principal: Math.round(principalComponent * 100) / 100,
          interest: Math.round(interestComponent * 100) / 100,
          remainingBalance: Math.round(remainingBalance * 100) / 100,
          projectedTakeHomeMonthly: Math.round(projectedTakeHomeMonthly * 100) / 100,
          projectedTakeHomeCutoff: Math.round(projectedTakeHomeCutoff * 100) / 100,
        });
      }
    }

    const totalPayable = principal + totalInterest;
    const averageMonthlyPayment = totalPayable / months;
    const semiMonthlyDeduction = averageMonthlyPayment / 2;
    const averageMonthlyInterest = totalInterest / months;
    const semiMonthlyInterest = averageMonthlyInterest / 2;
    const interestPercentOfPayment = Math.round((totalInterest / totalPayable) * 100);

    // New Take-home after this loan
    const newProjectedNetTakeHomeMonthly = Math.max(0, currentNetTakeHomeMonthly - averageMonthlyPayment);
    const newProjectedNetTakeHomeCutoff = newProjectedNetTakeHomeMonthly / 2;
    const monthlyNetReduction = currentNetTakeHomeMonthly - newProjectedNetTakeHomeMonthly;
    const netTakeHomeRetentionRate = baseMonthlySalary > 0
      ? Math.round((newProjectedNetTakeHomeMonthly / baseMonthlySalary) * 100)
      : 0;

    // Debt Service Ratio (Total deductions including this loan divided by Gross Salary)
    const totalDeductionsWithNewLoan = currentTotalDeductionsMonthly + averageMonthlyPayment;
    const debtBurdenRatio = baseMonthlySalary > 0
      ? Math.round((totalDeductionsWithNewLoan / baseMonthlySalary) * 100)
      : 0;

    // Financial health tier
    const isHealthy = debtBurdenRatio <= 35;
    const isModerate = debtBurdenRatio > 35 && debtBurdenRatio <= 50;
    const isHighBurden = debtBurdenRatio > 50;

    return {
      principal,
      termMonths: months,
      monthlyRate: customRate,
      interestMethod,
      totalInterest: Math.round(totalInterest * 100) / 100,
      processingFee,
      totalPayable: Math.round(totalPayable * 100) / 100,
      netProceedsReleased: Math.max(0, principal - processingFee),
      averageMonthlyPayment: Math.round(averageMonthlyPayment * 100) / 100,
      semiMonthlyDeduction: Math.round(semiMonthlyDeduction * 100) / 100,
      averageMonthlyInterest: Math.round(averageMonthlyInterest * 100) / 100,
      semiMonthlyInterest: Math.round(semiMonthlyInterest * 100) / 100,
      interestPercentOfPayment,
      newProjectedNetTakeHomeMonthly: Math.round(newProjectedNetTakeHomeMonthly * 100) / 100,
      newProjectedNetTakeHomeCutoff: Math.round(newProjectedNetTakeHomeCutoff * 100) / 100,
      monthlyNetReduction: Math.round(monthlyNetReduction * 100) / 100,
      netTakeHomeRetentionRate,
      debtBurdenRatio,
      isHealthy,
      isModerate,
      isHighBurden,
      rows: monthlyRows,
    };
  }, [
    loanAmount,
    termMonths,
    customRate,
    interestMethod,
    selectedProduct,
    currentNetTakeHomeMonthly,
    baseMonthlySalary,
    currentTotalDeductionsMonthly,
  ]);

  // CSV Export for Amortization Table with Take-Home Impact
  const handleExportCSV = () => {
    const headers = [
      'Month',
      'Due Date',
      'Beginning Balance (PHP)',
      'Principal Component (PHP)',
      'Interest Cost (Impact) (PHP)',
      'Total Installment (PHP)',
      'Remaining Balance (PHP)',
      'Projected Net Take-Home Pay (Monthly)',
      'Projected Cutoff Pay (15th & 30th)',
    ];

    const rows = simulation.rows.map(r => [
      `Month ${r.month}`,
      r.dueDate,
      r.beginningBalance.toFixed(2),
      r.principal.toFixed(2),
      r.interest.toFixed(2),
      r.payment.toFixed(2),
      r.remainingBalance.toFixed(2),
      r.projectedTakeHomeMonthly.toFixed(2),
      r.projectedTakeHomeCutoff.toFixed(2),
    ]);

    const csvContent = [
      `"OPEC Aurum Gems - Loan Simulation & Take-Home Pay Impact Schedule"`,
      `"Borrower: ${applicant.firstName} ${applicant.lastName} (${applicant.employeeNumber})"`,
      `"Base Monthly Salary: ${formatPHP(baseMonthlySalary)}"`,
      `"Facility: ${selectedProduct.name}"`,
      `"Loan Principal: ${formatPHP(simulation.principal)}"`,
      `"Repayment Term: ${simulation.termMonths} Months"`,
      `"Interest Rate: ${simulation.monthlyRate}% per month (${simulation.interestMethod})"`,
      `"Total Interest Impact: ${formatPHP(simulation.totalInterest)}"`,
      `"Semi-Monthly Cutoff Deduction: ${formatPHP(simulation.semiMonthlyDeduction)}"`,
      `"Projected Net Pay Per Cutoff: ${formatPHP(simulation.newProjectedNetTakeHomeCutoff)}"`,
      `"Generated: ${new Date().toLocaleDateString()}"`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `"TOTALS",,"",${simulation.principal.toFixed(2)},${simulation.totalInterest.toFixed(2)},${simulation.totalPayable.toFixed(2)},0.00,"-","-"`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `OPEC_TakeHome_Pay_Amortization_${applicant.employeeNumber}_${simulation.principal}_${simulation.termMonths}M.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleReset = () => {
    setBaseMonthlySalary(defaultBaseSalary);
    setLoanAmount(selectedProduct.minAmount || 20000);
    setTermMonths(12);
    setCustomRate(selectedProduct.interestRate);
  };

  const isSelectedProductMpl = selectedProduct.code === 'REGULAR_MPL' || selectedProduct.id === 'prod-mpl';
  const isSelectedProductAllowed = reLoanEval.isProductAllowed(selectedProduct.code);
  const isSelectedProductReLoan = isSelectedProductMpl && reLoanEval.hasActiveRegularMpl && reLoanEval.canReLoanRegularMpl;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 sm:p-6 text-white border-b border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Take-Home Pay Impact Simulator
                </span>
                <span className="text-xs text-slate-400">· OPEC Financial Health & Amortization</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                Simulate Interest Impact on Your Take-Home Pay
              </h2>
              <p className="text-xs text-slate-300">
                Visualize how monthly loan deductions and interest charges directly impact your net salary on every 15th and 30th cutoff before applying.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Reset to your profile defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {onApplyWithTerms && (
              isSelectedProductAllowed ? (
                <button
                  onClick={() =>
                    onApplyWithTerms({
                      productId: selectedProduct.id,
                      amount: simulation.principal,
                      termMonths: simulation.termMonths,
                    })
                  }
                  title={reLoanEval.reason}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span>{isSelectedProductReLoan ? 'Apply Re-Loan with Terms' : 'Apply with these Terms'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  disabled
                  title={reLoanEval.getProductRestrictionReason(selectedProduct.code) || reLoanEval.reason}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 rounded-xl shadow-xs cursor-not-allowed opacity-80"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Regular MPL Locked ({reLoanEval.paymentPercentage.toFixed(0)}% Paid · Need ≥50%)</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs (Left) and Take-Home Impact (Right) */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Simulation Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* 1. Base Salary & Current Deductions Configurator */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Your Gross Monthly Salary
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                From Profile: {applicant.firstName} {applicant.lastName}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₱</span>
                <input
                  type="number"
                  min={10000}
                  max={250000}
                  step={500}
                  value={baseMonthlySalary}
                  onChange={e => setBaseMonthlySalary(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2 text-base font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Quick Preset Buttons for Salary */}
              <div className="flex items-center gap-1.5">
                {[20000, 28000, 35000, 45000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBaseMonthlySalary(amt)}
                    className={`px-2 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${
                      baseMonthlySalary === amt
                        ? 'bg-amber-500 text-slate-950 border-amber-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ₱{(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Current Deductions Breakdown */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-750 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block">Mandatory CBU:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">₱200/mo (₱100/cutoff)</span>
              </div>

              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block">Statutory (SSS/PhilHealth):</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatPHP(statutoryDeductionsMonthly)}/mo</span>
              </div>

              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
                <span className="text-slate-500 block">Existing Loans:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {myLoans.length > 0 ? `${formatPHP(activeLoansDeductionMonthly)}/mo` : '₱0.00'}
                </span>
              </div>
            </div>

            {/* Current Net Pay Highlight */}
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
              <span className="text-emerald-900 dark:text-emerald-200 font-semibold">
                Current Net Take-Home (Before New Loan):
              </span>
              <div className="text-right">
                <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                  {formatPHP(currentNetTakeHomeMonthly)}
                </span>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 ml-1">
                  ({formatPHP(currentNetTakeHomeCutoff)}/cutoff)
                </span>
              </div>
            </div>
          </div>

          {/* 2. Choose Credit Facility */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
              Credit Facility & Terms
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableProducts.map(prod => {
                const isSelected = prod.id === selectedProductId;
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleProductChange(prod.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/50 shadow-xs ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {prod.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 ml-1" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>{prod.interestRate}%/mo</span>
                      <span>Max {formatPHP(prod.maxAmount).replace('.00', '')}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Loan Principal Amount Slider */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Principal Borrowing Amount
              </label>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 shadow-2xs">
                <span className="text-xs font-bold text-slate-500">₱</span>
                <input
                  type="number"
                  min={selectedProduct.minAmount}
                  max={selectedProduct.maxAmount}
                  step={1000}
                  value={loanAmount}
                  onChange={e => setLoanAmount(Number(e.target.value) || 0)}
                  className="w-24 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden text-right"
                />
              </div>
            </div>

            <input
              type="range"
              min={selectedProduct.minAmount}
              max={selectedProduct.maxAmount}
              step={1000}
              value={loanAmount}
              onChange={e => setLoanAmount(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
              <span>Min: {formatPHP(selectedProduct.minAmount)}</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{formatPHP(loanAmount)}</span>
              <span>Max: {formatPHP(selectedProduct.maxAmount)}</span>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700 flex-wrap">
              <span className="text-[11px] text-slate-500">Presets:</span>
              {Array.from(new Set([10000, 20000, 30000, 40000, selectedProduct.maxAmount]))
                .filter(p => p <= selectedProduct.maxAmount && p >= selectedProduct.minAmount)
                .sort((a, b) => a - b)
                .map(preset => (
                  <button
                    key={`thp-preset-${preset}`}
                    type="button"
                    onClick={() => setLoanAmount(preset)}
                    className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded border cursor-pointer ${
                      loanAmount === preset
                        ? 'bg-amber-500 text-slate-950 border-amber-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    ₱{(preset / 1000).toFixed(0)}k
                  </button>
                ))}
            </div>
          </div>

          {/* 4. Repayment Duration (Months) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Repayment Duration
              </label>
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                {termMonths} Months ({termMonths * 2} Payday Deductions)
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[3, 6, 12, 18, 24, 36].map(months => {
                const disabled = months < selectedProduct.minTermMonths || months > selectedProduct.maxTermMonths;
                const isSelected = termMonths === months;
                return (
                  <button
                    key={months}
                    type="button"
                    disabled={disabled}
                    onClick={() => setTermMonths(months)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      disabled
                        ? 'opacity-40 bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 cursor-not-allowed'
                        : isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {months} mos
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Interest Impact & Take-Home Pay Visualizer (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          {/* Main Impact Card */}
          <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Take-Home Pay Impact
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {simulation.interestMethod === 'FLAT_RATE' ? 'Flat 1.5% Formula' : 'Diminishing Formula'}
                </span>
              </div>

              {/* 1. Primary Highlight: Projected Net Take-Home Pay */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
                  Projected Paycheck Per Cutoff (15th & 30th)
                </span>
                <div className="text-3xl font-mono font-black text-amber-400 mt-1">
                  {formatPHP(simulation.newProjectedNetTakeHomeCutoff)}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300 mt-1.5 pt-1.5 border-t border-amber-500/20">
                  <span>Projected Monthly Total:</span>
                  <span className="font-mono font-bold text-white">{formatPHP(simulation.newProjectedNetTakeHomeMonthly)}</span>
                </div>
              </div>

              {/* 2. Monthly Loan Deduction & Interest Impact Breakdown */}
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Monthly Deduction:</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    -{formatPHP(simulation.averageMonthlyPayment)}
                  </span>
                </div>
                
                {/* INTEREST IMPACT CALLOUT */}
                <div className="p-2.5 rounded-lg bg-amber-950/50 border border-amber-600/40 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span>Monthly Interest Impact:</span>
                    <span className="font-mono font-bold">+{formatPHP(simulation.averageMonthlyInterest)} / mo</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>Semi-Monthly Cutoff Interest:</span>
                    <span className="font-mono text-amber-400">{formatPHP(simulation.semiMonthlyInterest)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1 border-t border-amber-600/20">
                    <strong className="text-amber-300 font-mono">{simulation.interestPercentOfPayment}%</strong> of your installment represents interest fee ({formatPHP(simulation.totalInterest)} total). The remaining goes directly to reducing your principal.
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Per-Cutoff Salary Deduction:</span>
                  <span className="font-mono font-bold text-white">
                    {formatPHP(simulation.semiMonthlyDeduction)} (15th & 30th)
                  </span>
                </div>
              </div>

              {/* 3. Before vs After Comparison */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Pre-Loan Net Take-Home:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{formatPHP(currentNetTakeHomeMonthly)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Net Pay Reduction:</span>
                  <span className="font-mono text-rose-400 font-bold">
                    -{formatPHP(simulation.monthlyNetReduction)} (-{Math.round((simulation.monthlyNetReduction / Math.max(1, currentNetTakeHomeMonthly)) * 100)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Net Salary Retention Rate:</span>
                  <span className="font-mono text-white font-bold">{simulation.netTakeHomeRetentionRate}% of Gross</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Net Loan Release (Proceeds):</span>
                  <span className="font-mono text-emerald-300 font-bold">{formatPHP(simulation.netProceedsReleased)}</span>
                </div>
              </div>

              {/* 4. Financial Health & Capacity Badge */}
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                simulation.isHealthy
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : simulation.isModerate
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              }`}>
                {simulation.isHealthy ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                )}
                <div>
                  <span className="font-bold block text-[11px]">
                    {simulation.isHealthy
                      ? `HEALTHY CAPACITY (${simulation.debtBurdenRatio}% Deductions)`
                      : simulation.isModerate
                      ? `MODERATE IMPACT (${simulation.debtBurdenRatio}% Deductions)`
                      : `HIGH DEBT LOAD (${simulation.debtBurdenRatio}% Deductions)`}
                  </span>
                  <p className="text-[10px] opacity-90 mt-0.5">
                    {simulation.isHealthy
                      ? 'Total deductions remain below 35% of gross pay. Excellent financial stability.'
                      : simulation.isModerate
                      ? 'Deductions are within standard limits. Maintain prudent personal budgeting.'
                      : 'Deductions exceed 50% of your gross salary. Please review term duration.'}
                  </p>
                </div>
              </div>

            </div>

            {/* Direct Application CTA */}
            {onApplyWithTerms && (
              <div className="mt-5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={!isSelectedProductAllowed}
                  title={!isSelectedProductAllowed ? (reLoanEval.getProductRestrictionReason(selectedProduct.code) || reLoanEval.reason) : undefined}
                  onClick={() => {
                    if (isSelectedProductAllowed) {
                      onApplyWithTerms({
                        productId: selectedProduct.id,
                        amount: simulation.principal,
                        termMonths: simulation.termMonths,
                      });
                    }
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs shadow-md transition-all ${
                    isSelectedProductAllowed
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 cursor-pointer active:scale-[0.98]'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-80'
                  }`}
                >
                  {isSelectedProductAllowed ? (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>{isSelectedProductReLoan ? 'Apply for Re-Loan with this Simulated Term' : 'Apply with this Simulated Term'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Regular MPL Locked ({reLoanEval.paymentPercentage.toFixed(0)}% Paid · Need ≥50%)</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-1.5">
                  {!isSelectedProductAllowed
                    ? (reLoanEval.getProductRestrictionReason(selectedProduct.code) || reLoanEval.reason)
                    : `Pre-fills facility, amount (${formatPHP(simulation.principal)}), and term (${simulation.termMonths} mos) into the wizard.`}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* MONTHLY AMORTIZATION SCHEDULE TABLE WITH TAKE-HOME PAY */}
      {/* ======================================================== */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Monthly Amortization Table & Projected Take-Home Pay
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {simulation.termMonths} Months ({termMonths * 2} Payday Deductions)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Exact month-by-month schedule detailing principal paydown, interest impact, and your projected net take-home pay.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setScheduleViewMode('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  scheduleViewMode === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All {simulation.termMonths} Months
              </button>
              <button
                type="button"
                onClick={() => setScheduleViewMode('first6')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  scheduleViewMode === 'first6'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                First 6 Months
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
              title="Export Amortization Table to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exportSuccess ? 'CSV Exported!' : 'Export CSV'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
              title="Print schedule"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFullSchedule(!showFullSchedule)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              {showFullSchedule ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide Table</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Show Table</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Amortization Table Container */}
        {showFullSchedule && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-3">Est. Due Date</th>
                  <th className="py-3 px-3 text-right">Beginning Balance</th>
                  <th className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">Principal</th>
                  <th className="py-3 px-3 text-right text-amber-600 dark:text-amber-400">Interest (Impact)</th>
                  <th className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">Monthly Installment</th>
                  <th className="py-3 px-3 text-right">Remaining Balance</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40">
                    Projected Net Take-Home Pay
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750 font-mono">
                {(scheduleViewMode === 'first6' ? simulation.rows.slice(0, 6) : simulation.rows).map(row => (
                  <tr key={row.month} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                    <td className="py-2.5 px-4 font-sans font-bold text-slate-900 dark:text-white">
                      Month {row.month}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-sans text-[11px]">
                      {row.dueDate}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                      {formatPHP(row.beginningBalance)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatPHP(row.principal)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400 font-semibold">
                      {formatPHP(row.interest)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatPHP(row.payment)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                      {row.remainingBalance === 0 ? (
                        <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded text-[10px] font-sans">
                          ₱0.00 (Fully Paid)
                        </span>
                      ) : (
                        formatPHP(row.remainingBalance)
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20">
                      <div>{formatPHP(row.projectedTakeHomeMonthly)}</div>
                      <div className="text-[10px] font-normal text-emerald-800 dark:text-emerald-400 font-sans">
                        {formatPHP(row.projectedTakeHomeCutoff)}/cutoff
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-750 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                  <td className="py-3 px-4 text-slate-900 dark:text-white" colSpan={2}>
                    TOTALS ({simulation.termMonths} Months)
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500 font-mono">-</td>
                  <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatPHP(simulation.principal)}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400 font-mono">
                    {formatPHP(simulation.totalInterest)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-900 dark:text-white font-mono text-sm">
                    {formatPHP(simulation.totalPayable)}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-mono">
                    ₱0.00
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-950/60">
                    {formatPHP(simulation.newProjectedNetTakeHomeMonthly)} / mo
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Schedule Footnote */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            * Per-payday semi-monthly payroll deduction is exactly half of the monthly installment:{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatPHP(simulation.semiMonthlyDeduction)}</strong> per cutoff (15th & 30th).
          </span>
          <span className="font-mono">
            Interest Formula: {simulation.interestMethod.replace(/_/g, ' ')} · Rate: {simulation.monthlyRate}%/mo
          </span>
        </div>
      </div>
    </div>
  );
};
