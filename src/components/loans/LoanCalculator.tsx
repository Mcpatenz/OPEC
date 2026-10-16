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
  Lock,
} from 'lucide-react';
import { evaluateReLoanEligibility } from '../../lib/loans/eligibility';

interface LoanCalculatorProps {
  onApplyWithTerms?: (terms: { productId: string; amount: number; termMonths: number }) => void;
  className?: string;
  defaultAmount?: number;
  defaultTerm?: number;
  defaultProductId?: string;
}

interface MonthlyAmortizationRow {
  month: number;
  periodLabel: string;
  dueDate: string;
  beginningBalance: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

interface YearlyAmortizationRow {
  year: number;
  yearLabel: string;
  startMonth: number;
  endMonth: number;
  monthCount: number;
  beginningBalance: number;
  principalPaid: number;
  interestPaid: number;
  totalPayment: number;
  endingBalance: number;
  principalProgress: number;
  months: MonthlyAmortizationRow[];
}

export const LoanCalculator: React.FC<LoanCalculatorProps> = ({
  onApplyWithTerms,
  className = '',
  defaultAmount = 25000,
  defaultTerm = 18,
  defaultProductId,
}) => {
  const { loanProducts, currentUser, employees, activeLoans, applications } = useApp();

  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];

  const reLoanEval = useMemo(() => {
    return evaluateReLoanEligibility(applicant, activeLoans, applications);
  }, [applicant, activeLoans, applications]);

  // Active products or fallback
  const availableProducts = useMemo(() => {
    return loanProducts.filter(p => p.active);
  }, [loanProducts]);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    defaultProductId || availableProducts[0]?.id || ''
  );

  const selectedProduct: LoanProduct = useMemo(() => {
    return availableProducts.find(p => p.id === selectedProductId) || availableProducts[0] || {
      id: 'custom',
      code: 'CUSTOM',
      name: 'Custom Facility',
      description: 'Custom rates and terms',
      minAmount: 5000,
      maxAmount: 100000,
      minTermMonths: 3,
      maxTermMonths: 36,
      interestRate: 1.0,
      interestMethod: 'FLAT_RATE',
      processingFee: 50,
      requiredCoMakers: 1,
      minServiceYearsCoMaker: 5,
      minServiceYearsApplicant: 1,
      active: true,
      applicableDeductions: 'PAYDAY_TWICE_MONTHLY',
    };
  }, [availableProducts, selectedProductId]);

  // Interactive controls
  const [loanAmount, setLoanAmount] = useState<number>(defaultAmount);
  const [termMonths, setTermMonths] = useState<number>(defaultTerm);
  const [customRate, setCustomRate] = useState<number>(selectedProduct.interestRate);
  const [interestMethod, setInterestMethod] = useState<'FLAT_RATE' | 'REDUCING_BALANCE'>(
    selectedProduct.interestMethod === 'REDUCING_BALANCE' ? 'REDUCING_BALANCE' : 'FLAT_RATE'
  );
  const [scheduleView, setScheduleView] = useState<'monthly' | 'semi-monthly'>('monthly');
  const [scheduleViewMode, setScheduleViewMode] = useState<'yearly' | 'monthly'>('yearly');
  const [expandedYears, setExpandedYears] = useState<number[]>([1]);
  const [showFullSchedule, setShowFullSchedule] = useState<boolean>(true);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Sync rate when product changes if user hasn't overridden
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

  // Financial Calculations & Amortization Generation
  const calculation = useMemo(() => {
    const principal = Math.max(1000, loanAmount);
    const months = Math.max(1, termMonths);
    const monthlyRate = customRate / 100;
    const processingFee = selectedProduct.processingFee || 50;

    let totalInterest = 0;
    const monthlyRows: MonthlyAmortizationRow[] = [];

    // Reference start date: next month or 15th
    const now = new Date();
    const startYear = now.getFullYear();
    const startMonth = now.getMonth() + 1; // 0-indexed + 1

    if (interestMethod === 'FLAT_RATE') {
      // Flat Rate: monthly interest = principal * monthlyRate
      // Constant throughout each month
      const monthlyInterest = principal * monthlyRate;
      totalInterest = monthlyInterest * months;
      const monthlyPrincipal = principal / months;
      const monthlyPayment = monthlyPrincipal + monthlyInterest;

      let remainingBalance = principal;

      for (let m = 1; m <= months; m++) {
        const dueDate = new Date(startYear, startMonth + m - 1, 15);
        const dateStr = dueDate.toISOString().split('T')[0];
        const begBal = remainingBalance;
        const actualPrincipal = m === months ? remainingBalance : monthlyPrincipal;
        const actualPayment = actualPrincipal + monthlyInterest;
        remainingBalance = Math.max(0, remainingBalance - actualPrincipal);

        monthlyRows.push({
          month: m,
          periodLabel: `Month ${m}`,
          dueDate: dateStr,
          beginningBalance: Math.round(begBal * 100) / 100,
          payment: Math.round(actualPayment * 100) / 100,
          principal: Math.round(actualPrincipal * 100) / 100,
          interest: Math.round(monthlyInterest * 100) / 100,
          remainingBalance: Math.round(remainingBalance * 100) / 100,
        });
      }
    } else {
      // Reducing / Diminishing Balance Amortization Formula
      // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
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
        const dateStr = dueDate.toISOString().split('T')[0];
        const begBal = remainingBalance;
        const interestComponent = remainingBalance * monthlyRate;
        let principalComponent = monthlyPayment - interestComponent;

        if (m === months || remainingBalance - principalComponent < 0.5) {
          principalComponent = remainingBalance;
          monthlyPayment = principalComponent + interestComponent;
        }

        remainingBalance = Math.max(0, remainingBalance - principalComponent);
        totalInterest += interestComponent;

        monthlyRows.push({
          month: m,
          periodLabel: `Month ${m}`,
          dueDate: dateStr,
          beginningBalance: Math.round(begBal * 100) / 100,
          payment: Math.round((principalComponent + interestComponent) * 100) / 100,
          principal: Math.round(principalComponent * 100) / 100,
          interest: Math.round(interestComponent * 100) / 100,
          remainingBalance: Math.round(remainingBalance * 100) / 100,
        });
      }
    }

    // Generate Year-by-Year rows based on calculated loan amount and interest rates
    const totalYears = Math.ceil(months / 12);
    const yearlyRows: YearlyAmortizationRow[] = [];

    for (let y = 1; y <= totalYears; y++) {
      const startM = (y - 1) * 12 + 1;
      const endM = Math.min(months, y * 12);
      const childMonths = monthlyRows.filter(m => m.month >= startM && m.month <= endM);

      if (childMonths.length === 0) continue;

      const begBal = childMonths[0].beginningBalance;
      const principalPaid = childMonths.reduce((sum, r) => sum + r.principal, 0);
      const interestPaid = childMonths.reduce((sum, r) => sum + r.interest, 0);
      const totalPayment = principalPaid + interestPaid;
      const endBal = childMonths[childMonths.length - 1].remainingBalance;
      const cumulativePrincipalPaid = principal - endBal;
      const principalProgress = Math.min(100, Math.round((cumulativePrincipalPaid / principal) * 100));

      yearlyRows.push({
        year: y,
        yearLabel: `Year ${y} (Months ${startM} - ${endM})`,
        startMonth: startM,
        endMonth: endM,
        monthCount: childMonths.length,
        beginningBalance: Math.round(begBal * 100) / 100,
        principalPaid: Math.round(principalPaid * 100) / 100,
        interestPaid: Math.round(interestPaid * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        endingBalance: Math.round(endBal * 100) / 100,
        principalProgress,
        months: childMonths,
      });
    }

    const totalPayable = principal + totalInterest;
    const netDisbursement = Math.max(0, principal - processingFee);
    const averageMonthlyPayment = totalPayable / months;
    const semiMonthlyDeduction = averageMonthlyPayment / 2;
    const termYears = Math.round((months / 12) * 10) / 10;
    const year1PrincipalPaid = yearlyRows[0]?.principalPaid || 0;
    const year1PaydownPercent = Math.min(100, Math.round((year1PrincipalPaid / principal) * 100));

    return {
      principal,
      termMonths: months,
      termYears,
      totalYears,
      monthlyRate: customRate,
      interestMethod,
      totalInterest: Math.round(totalInterest * 100) / 100,
      processingFee,
      totalPayable: Math.round(totalPayable * 100) / 100,
      netDisbursement: Math.round(netDisbursement * 100) / 100,
      monthlyPayment: Math.round(averageMonthlyPayment * 100) / 100,
      semiMonthlyDeduction: Math.round(semiMonthlyDeduction * 100) / 100,
      year1PaydownPercent,
      rows: monthlyRows,
      yearlyRows,
    };
  }, [loanAmount, termMonths, customRate, interestMethod, selectedProduct]);

  // Export Amortization Schedule to CSV (Supports both Year-by-Year and Month-by-Month)
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (scheduleViewMode === 'yearly') {
      headers = [
        'Year',
        'Period Span',
        'Months Included',
        'Beginning Balance (PHP)',
        'Principal Paid (PHP)',
        'Interest Paid (PHP)',
        'Total Annual Payment (PHP)',
        'Ending Balance (PHP)',
        'Cumulative Principal Paid (%)',
      ];
      rows = calculation.yearlyRows.map(y => [
        `Year ${y.year}`,
        `Months ${y.startMonth} - ${y.endMonth}`,
        y.monthCount,
        y.beginningBalance.toFixed(2),
        y.principalPaid.toFixed(2),
        y.interestPaid.toFixed(2),
        y.totalPayment.toFixed(2),
        y.endingBalance.toFixed(2),
        `${y.principalProgress}%`,
      ]);
    } else {
      headers = [
        'Month',
        'Due Date',
        'Beginning Balance (PHP)',
        'Principal (PHP)',
        'Interest (PHP)',
        'Total Payment (PHP)',
        'Remaining Balance (PHP)',
      ];
      rows = calculation.rows.map(r => [
        r.month,
        r.dueDate,
        r.beginningBalance.toFixed(2),
        r.principal.toFixed(2),
        r.interest.toFixed(2),
        r.payment.toFixed(2),
        r.remainingBalance.toFixed(2),
      ]);
    }

    const csvContent = [
      `"OPEC Aurum Gems - Loan Amortization Schedule (${scheduleViewMode === 'yearly' ? 'Year-by-Year Annual Schedule' : 'Month-by-Month Schedule'})"`,
      `"Product: ${selectedProduct.name}"`,
      `"Principal: ${formatPHP(calculation.principal)}"`,
      `"Term: ${calculation.termMonths} Months (${calculation.termYears} Years)"`,
      `"Interest Rate: ${calculation.monthlyRate}% per month (${calculation.interestMethod})"`,
      `"Total Interest: ${formatPHP(calculation.totalInterest)}"`,
      `"Total Payable: ${formatPHP(calculation.totalPayable)}"`,
      `"Generated: ${new Date().toLocaleDateString()}"`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `"TOTALS",,"",${calculation.principal.toFixed(2)},${calculation.totalInterest.toFixed(2)},${calculation.totalPayable.toFixed(2)},0.00,"100%"`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `OPEC_${scheduleViewMode === 'yearly' ? 'Yearly' : 'Monthly'}_Amortization_${selectedProduct.code}_${calculation.principal}_${calculation.termMonths}M.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  // Reset to defaults
  const handleReset = () => {
    setLoanAmount(selectedProduct.minAmount || 20000);
    setTermMonths(12);
    setCustomRate(selectedProduct.interestRate);
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 text-white border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Interactive Simulator
                </span>
                <span className="text-xs text-slate-400">· OPEC Aurum Gems Credit Facility</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">Loan & Amortization Calculator</h2>
              <p className="text-xs text-slate-300">
                Simulate monthly repayments, payroll salary deductions, and examine the complete amortization schedule before applying.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Reset to default settings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            {onApplyWithTerms && (() => {
              const isSelectedProductMpl = selectedProduct.code === 'REGULAR_MPL' || selectedProduct.id === 'prod-mpl';
              const isSelectedProductAllowed = reLoanEval.isProductAllowed(selectedProduct.code);
              const isSelectedProductReLoan = isSelectedProductMpl && reLoanEval.hasActiveRegularMpl && reLoanEval.canReLoanRegularMpl;

              return isSelectedProductAllowed ? (
                <button
                  onClick={() =>
                    onApplyWithTerms({
                      productId: selectedProduct.id,
                      amount: calculation.principal,
                      termMonths: calculation.termMonths,
                    })
                  }
                  title={reLoanEval.reason}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {isSelectedProductReLoan ? 'Apply Re-Loan with Terms' : 'Apply with these Terms'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  disabled
                  title={reLoanEval.getProductRestrictionReason(selectedProduct.code) || reLoanEval.reason}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 rounded-lg shadow-xs cursor-not-allowed opacity-80"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Regular MPL Locked ({reLoanEval.paymentPercentage.toFixed(0)}% Paid · Need ≥50%)</span>
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Main Grid: Controls on Left, Computation on Right */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Parameters (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Loan Product Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>1. Choose Credit Facility</span>
              <span className="text-slate-400 font-normal normal-case">
                {selectedProduct.applicableDeductions === 'PAYDAY_TWICE_MONTHLY'
                  ? 'Twice Monthly (15th & 30th)'
                  : 'Monthly Payroll'}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {availableProducts.map(prod => {
                const isSelected = prod.id === selectedProductId;
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleProductChange(prod.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/60 shadow-xs ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {prod.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-1" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{prod.interestRate}% / mo</span>
                      <span>Max {formatPHP(prod.maxAmount).replace('.00', '')}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {selectedProduct.description}
            </p>
          </div>

          {/* 2. Loan Amount Slider & Direct Input */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Principal Loan Amount
              </label>
              <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs">
                <span className="text-xs font-bold text-slate-500">₱</span>
                <input
                  type="number"
                  min={selectedProduct.minAmount}
                  max={selectedProduct.maxAmount}
                  step={1000}
                  value={loanAmount}
                  onChange={e => setLoanAmount(Number(e.target.value) || 0)}
                  className="w-28 text-sm font-mono font-bold text-slate-900 focus:outline-hidden text-right"
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
              className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2 font-mono">
              <span>Min: {formatPHP(selectedProduct.minAmount)}</span>
              <span className="font-semibold text-amber-700">{formatPHP(loanAmount)}</span>
              <span>Max: {formatPHP(selectedProduct.maxAmount)}</span>
            </div>

            {/* Quick Preset Chips */}
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-200 flex-wrap">
              <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
              {Array.from(new Set([10000, 20000, 30000, 50000, selectedProduct.maxAmount]))
                .filter(preset => preset <= selectedProduct.maxAmount && preset >= selectedProduct.minAmount)
                .sort((a, b) => a - b)
                .map(preset => {
                  return (
                    <button
                      key={`preset-${preset}`}
                      type="button"
                      onClick={() => setLoanAmount(preset)}
                      className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-md border transition-all cursor-pointer ${
                        loanAmount === preset
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ₱{(preset / 1000).toFixed(0)}k
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 3. Repayment Term (Months) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Repayment Duration (Months)
              </label>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-md border border-amber-300">
                {termMonths} Months ({termMonths * 2} Payday Deductions)
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {[3, 6, 12, 18, 24, 36].map(months => {
                const disabled = months < selectedProduct.minTermMonths || months > selectedProduct.maxTermMonths;
                const isSelected = termMonths === months;
                return (
                  <button
                    key={months}
                    type="button"
                    disabled={disabled}
                    onClick={() => setTermMonths(months)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all ${
                      disabled
                        ? 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {months} mos
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>Allowed tenure for {selectedProduct.name}:</span>
              <span className="font-mono font-bold text-slate-700">
                {selectedProduct.minTermMonths} to {selectedProduct.maxTermMonths} Months
              </span>
            </div>
          </div>

          {/* 4. Advanced Interest Method & Rate Customization */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-600" />
                Interest Rate & Method
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInterestMethod('FLAT_RATE')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    interestMethod === 'FLAT_RATE'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  OPEC Flat 1.0% / mo
                </button>
                <button
                  type="button"
                  onClick={() => setInterestMethod('REDUCING_BALANCE')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    interestMethod === 'REDUCING_BALANCE'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Diminishing Balance
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Monthly Interest Rate:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={customRate}
                    onChange={e => setCustomRate(Number(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-right rounded border border-slate-300 bg-white"
                  />
                  <span className="font-bold text-slate-700">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Processing Fee:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatPHP(calculation.processingFee)} (Fixed)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Results Summary (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          {/* Main Card */}
          <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-lg flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Repayment Summary
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {calculation.interestMethod === 'FLAT_RATE' ? 'Flat Formula' : 'Diminishing Formula'}
                </span>
              </div>

              {/* Primary Metric: Semi-monthly deduction */}
              <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
                  Semi-Monthly Payday Deduction (15th & 30th)
                </span>
                <div className="text-3xl font-mono font-bold text-amber-400 mt-1">
                  {formatPHP(calculation.semiMonthlyDeduction)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Deducted automatically from your salary on each cutoff ({calculation.termMonths * 2} paydays total).
                </p>
              </div>

              {/* Monthly Repayment Equivalent */}
              <div className="mt-3 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-300 block">Total Monthly Repayment:</span>
                  <span className="text-[10px] text-slate-400">Combined 15th + 30th installments</span>
                </div>
                <div className="text-xl font-mono font-bold text-white">
                  {formatPHP(calculation.monthlyPayment)}
                  <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="space-y-2.5 mt-5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/70">
                  <span className="text-slate-400">Gross Principal:</span>
                  <span className="font-mono font-bold text-white">{formatPHP(calculation.principal)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/70">
                  <span className="text-slate-400">Total Interest ({calculation.monthlyRate}% × {calculation.termMonths} mos):</span>
                  <span className="font-mono font-semibold text-amber-400">+{formatPHP(calculation.totalInterest)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/70">
                  <span className="text-slate-400">OPEC Fixed Processing Fee:</span>
                  <span className="font-mono text-slate-400">-{formatPHP(calculation.processingFee)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/70 text-emerald-400">
                  <span className="font-semibold">Net Loan Proceeds to Release:</span>
                  <span className="font-mono font-bold text-base">{formatPHP(calculation.netDisbursement)}</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-200 font-bold">Total Amount to Repay:</span>
                  <span className="font-mono font-bold text-amber-300 text-lg">
                    {formatPHP(calculation.totalPayable)}
                  </span>
                </div>
              </div>
            </div>

            {/* Application CTA inside summary */}
            {onApplyWithTerms && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={!reLoanEval.canApply}
                  title={!reLoanEval.canApply ? reLoanEval.reason : undefined}
                  onClick={() => {
                    if (reLoanEval.canApply) {
                      onApplyWithTerms({
                        productId: selectedProduct.id,
                        amount: calculation.principal,
                        termMonths: calculation.termMonths,
                      });
                    }
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs shadow-md transition-all ${
                    reLoanEval.canApply
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 cursor-pointer active:scale-[0.98]'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-80'
                  }`}
                >
                  {reLoanEval.canApply ? (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>{reLoanEval.isReLoan ? 'Proceed to Re-Loan Application with these Terms' : 'Proceed to Loan Application with these Terms'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Application Disabled ({reLoanEval.paymentPercentage.toFixed(0)}% Paid · Need &gt;50%)</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  {!reLoanEval.canApply
                    ? reLoanEval.reason
                    : 'Auto-fills loan product, amount, and term into the 6-step application wizard.'}
                </p>
              </div>
            )}
          </div>

          {/* Quick Notice Card */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">OPEC Aurum Gems Eligibility Note:</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Maximum capacity is determined by tenure and credit score. Co-maker with at least 5 years of service is required for standard facilities.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Amortization Schedule Section (Extended with Full Year-by-Year Table) */}
      <div className="border-t border-slate-200 bg-slate-50/70 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Full Loan Amortization Schedule
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {calculation.termYears} Years ({calculation.termMonths} Months)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Year-by-year annual paydown breakdown and monthly schedule based on calculated principal of {formatPHP(calculation.principal)} at {calculation.monthlyRate}%/mo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle Switcher */}
            <div className="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setScheduleViewMode('yearly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  scheduleViewMode === 'yearly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Year-by-Year (Annual)</span>
                <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
                  {calculation.totalYears}Y
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleViewMode('monthly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  scheduleViewMode === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Month-by-Month</span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
                  {calculation.termMonths}M
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
              title="Export current schedule to CSV file"
            >
              <Download className="w-3.5 h-3.5" />
              {exportSuccess ? 'CSV Exported!' : 'Export CSV'}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
              title="Print schedule"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            <button
              type="button"
              onClick={() => setShowFullSchedule(!showFullSchedule)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
            >
              {showFullSchedule ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Hide Table
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show Table
                </>
              )}
            </button>
          </div>
        </div>

        {/* Schedule Table Container */}
        {showFullSchedule && (
          <div className="mt-4 space-y-4">
            
            {/* Annual Performance Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Loan Span
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                  {calculation.termYears} Years ({calculation.termMonths} Mos)
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {calculation.totalYears} Annual Fiscal Cycles
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Year 1 Paydown
                </span>
                <span className="text-sm font-bold font-mono text-emerald-700 mt-0.5 block">
                  {calculation.year1PaydownPercent}% Principal Paid
                </span>
                <span className="text-[10px] text-emerald-600 block">
                  {formatPHP(calculation.yearlyRows[0]?.principalPaid || 0)} in Year 1
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Avg. Annual Debt Service
                </span>
                <span className="text-sm font-bold font-mono text-amber-700 mt-0.5 block">
                  {formatPHP(Math.round(calculation.totalPayable / calculation.totalYears))}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Per 12-month calendar year
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Effective Annual Rate (APR)
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                  {(calculation.monthlyRate * 12).toFixed(1)}% p.a.
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Based on {calculation.monthlyRate}% monthly rate
                </span>
              </div>
            </div>

            {/* VIEW 1: Year-by-Year Amortization Schedule Table */}
            {scheduleViewMode === 'yearly' ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Fiscal Period</th>
                      <th className="py-3 px-3">Months Span</th>
                      <th className="py-3 px-3 text-right">Beginning Balance</th>
                      <th className="py-3 px-3 text-right text-emerald-700">Principal Paid</th>
                      <th className="py-3 px-3 text-right text-amber-700">Interest Paid</th>
                      <th className="py-3 px-3 text-right font-bold text-slate-900">Total Annual Payment</th>
                      <th className="py-3 px-3 text-right">Ending Balance</th>
                      <th className="py-3 px-4 text-center">Cumulative Paydown</th>
                      <th className="py-3 px-3 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {calculation.yearlyRows.map(yRow => {
                      const isExpanded = expandedYears.includes(yRow.year);

                      return (
                        <React.Fragment key={yRow.year}>
                          <tr className="hover:bg-amber-50/40 transition-colors">
                            <td className="py-3 px-4 font-sans font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-900 font-mono font-bold flex items-center justify-center text-xs">
                                  Y{yRow.year}
                                </span>
                                <span>Year {yRow.year}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-sans text-[11px]">
                              Months {yRow.startMonth} - {yRow.endMonth} ({yRow.monthCount} mos)
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600">
                              {formatPHP(yRow.beginningBalance)}
                            </td>
                            <td className="py-3 px-3 text-right text-emerald-700 font-semibold">
                              {formatPHP(yRow.principalPaid)}
                            </td>
                            <td className="py-3 px-3 text-right text-amber-700">
                              {formatPHP(yRow.interestPaid)}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">
                              {formatPHP(yRow.totalPayment)}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-800">
                              {yRow.endingBalance === 0 ? (
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-sans border border-emerald-200">
                                  ₱0.00 (Fully Paid)
                                </span>
                              ) : (
                                formatPHP(yRow.endingBalance)
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-2 font-sans">
                                <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full transition-all"
                                    style={{ width: `${yRow.principalProgress}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 w-9 text-right font-mono">
                                  {yRow.principalProgress}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedYears(prev =>
                                    prev.includes(yRow.year)
                                      ? prev.filter(y => y !== yRow.year)
                                      : [...prev, yRow.year]
                                  );
                                }}
                                className="px-2 py-1 rounded text-[10px] font-sans font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    Hide Months
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    {yRow.monthCount} Months
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* Nested monthly rows when expanded */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-b border-slate-200">
                              <td colSpan={9} className="p-3 pl-8">
                                <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                                  <div className="bg-slate-100 px-3 py-1.5 font-sans font-semibold text-[11px] text-slate-700 flex items-center justify-between border-b border-slate-200">
                                    <span>Month-by-Month Details for Year {yRow.year} (Months {yRow.startMonth} to {yRow.endMonth})</span>
                                    <span className="font-mono text-slate-500 text-[10px]">Semi-monthly deduction: {formatPHP(calculation.semiMonthlyDeduction)} / cutoff</span>
                                  </div>
                                  <table className="w-full text-left text-[11px]">
                                    <thead>
                                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                                        <th className="py-1.5 px-3">Month</th>
                                        <th className="py-1.5 px-3">Due Date</th>
                                        <th className="py-1.5 px-3 text-right">Beg. Balance</th>
                                        <th className="py-1.5 px-3 text-right text-emerald-700">Principal</th>
                                        <th className="py-1.5 px-3 text-right text-amber-700">Interest</th>
                                        <th className="py-1.5 px-3 text-right">Monthly Payment</th>
                                        <th className="py-1.5 px-3 text-right">End. Balance</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-mono">
                                      {yRow.months.map(mRow => (
                                        <tr key={mRow.month} className="hover:bg-slate-50">
                                          <td className="py-1.5 px-3 font-sans font-medium text-slate-800">
                                            Month {mRow.month}
                                          </td>
                                          <td className="py-1.5 px-3 font-sans text-slate-400">
                                            {mRow.dueDate}
                                          </td>
                                          <td className="py-1.5 px-3 text-right text-slate-500">
                                            {formatPHP(mRow.beginningBalance)}
                                          </td>
                                          <td className="py-1.5 px-3 text-right text-emerald-700 font-medium">
                                            {formatPHP(mRow.principal)}
                                          </td>
                                          <td className="py-1.5 px-3 text-right text-amber-700">
                                            {formatPHP(mRow.interest)}
                                          </td>
                                          <td className="py-1.5 px-3 text-right font-medium text-slate-900">
                                            {formatPHP(mRow.payment)}
                                          </td>
                                          <td className="py-1.5 px-3 text-right text-slate-700">
                                            {mRow.remainingBalance === 0 ? '₱0.00' : formatPHP(mRow.remainingBalance)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-xs">
                      <td className="py-3 px-4 text-slate-900" colSpan={2}>
                        TOTALS ({calculation.totalYears} Years / {calculation.termMonths} Months)
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500 font-mono">-</td>
                      <td className="py-3 px-3 text-right text-emerald-700 font-mono">
                        {formatPHP(calculation.principal)}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-700 font-mono">
                        {formatPHP(calculation.totalInterest)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 font-mono text-sm">
                        {formatPHP(calculation.totalPayable)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-700 font-mono">
                        ₱0.00
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-700">
                        100% Paid Off
                      </td>
                      <td className="py-3 px-3 text-center">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              /* VIEW 2: Month-by-Month Amortization Schedule Table */
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-3">Est. Due Date</th>
                      <th className="py-3 px-3 text-right">Beginning Balance</th>
                      <th className="py-3 px-3 text-right text-emerald-700">Principal</th>
                      <th className="py-3 px-3 text-right text-amber-700">Interest</th>
                      <th className="py-3 px-3 text-right font-bold text-slate-900">Total Payment</th>
                      <th className="py-3 px-4 text-right">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {calculation.rows.map(row => (
                      <tr
                        key={row.month}
                        className="hover:bg-amber-50/40 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-sans font-bold text-slate-900">
                          Month {row.month}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-sans text-[11px]">
                          {row.dueDate}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {formatPHP(row.beginningBalance)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">
                          {formatPHP(row.principal)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-700">
                          {formatPHP(row.interest)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatPHP(row.payment)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                          {row.remainingBalance === 0 ? (
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-sans">
                              ₱0.00 (Fully Paid)
                            </span>
                          ) : (
                            formatPHP(row.remainingBalance)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-xs">
                      <td className="py-3 px-4 text-slate-900" colSpan={2}>
                        TOTALS ({calculation.termMonths} Months)
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500 font-mono">-</td>
                      <td className="py-3 px-3 text-right text-emerald-700 font-mono">
                        {formatPHP(calculation.principal)}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-700 font-mono">
                        {formatPHP(calculation.totalInterest)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 font-mono text-sm">
                        {formatPHP(calculation.totalPayable)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-mono">
                        ₱0.00
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Schedule Footnote */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 text-[11px] text-slate-500">
              <span>
                * Per-payday semi-monthly payroll deduction is exactly half of the monthly payment:{' '}
                <strong className="text-slate-800 font-mono">{formatPHP(calculation.semiMonthlyDeduction)}</strong> per cutoff (15th & 30th).
              </span>
              <span className="font-mono">
                Formula: {calculation.interestMethod.replace(/_/g, ' ')} · Rate: {calculation.monthlyRate}%/mo · Term: {calculation.termYears} Years
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
