import { LoanAmortizationSchedule, LoanProduct, PaymentStatus } from '../../types';

export interface CalculationResult {
  principal: number;
  termMonths: number;
  interestRate: number;
  totalInterest: number;
  processingFee: number;
  totalPayable: number;
  netDisbursement: number;
  semiMonthlyDeduction: number;
  monthlyDeduction: number;
  totalInstallments: number;
  schedules: LoanAmortizationSchedule[];
}

export function calculateLoanFinancials(
  principal: number,
  termMonths: number,
  product: LoanProduct,
  startDate: Date = new Date(2026, 9, 15) // Oct 15, 2026
): CalculationResult {
  const processingFee = product.processingFee || 50;
  let totalInterest = 0;

  // 1.5% per month or based on interestMethod
  if (product.interestMethod === 'FLAT_RATE') {
    totalInterest = principal * (product.interestRate / 100) * termMonths;
  } else if (product.interestMethod === 'REDUCING_BALANCE') {
    // Standard declining balance simulation
    const monthlyRate = (product.interestRate / 100);
    let balance = principal;
    const monthlyPrincipal = principal / termMonths;
    for (let i = 0; i < termMonths; i++) {
      totalInterest += balance * monthlyRate;
      balance -= monthlyPrincipal;
    }
  } else {
    // Custom OPEC Formula (1.5% flat on principal)
    totalInterest = principal * (product.interestRate / 100) * termMonths;
  }

  // Rounded to 2 decimals
  totalInterest = Math.round(totalInterest * 100) / 100;
  const totalPayable = Math.round((principal + totalInterest) * 100) / 100;
  const netDisbursement = Math.max(0, Math.round((principal - processingFee) * 100) / 100);

  // Payday installments: 2 per month (15th and 30th/end of month)
  const isTwiceMonthly = product.applicableDeductions === 'PAYDAY_TWICE_MONTHLY';
  const totalInstallments = isTwiceMonthly ? termMonths * 2 : termMonths;
  
  const semiMonthlyDeduction = isTwiceMonthly
    ? Math.round((totalPayable / totalInstallments) * 100) / 100
    : Math.round((totalPayable / termMonths / 2) * 100) / 100;

  const monthlyDeduction = Math.round((totalPayable / termMonths) * 100) / 100;

  // Generate Amortization Schedule
  const schedules: LoanAmortizationSchedule[] = [];
  let runningBalance = totalPayable;
  const perInstallmentPrincipal = Math.round((principal / totalInstallments) * 100) / 100;
  const perInstallmentInterest = Math.round((totalInterest / totalInstallments) * 100) / 100;

  let currentYear = startDate.getFullYear();
  let currentMonth = startDate.getMonth(); // 0-indexed
  let isFifteenth = startDate.getDate() <= 15;

  for (let i = 1; i <= totalInstallments; i++) {
    const isLast = i === totalInstallments;
    let installmentTotal = semiMonthlyDeduction;

    if (isLast) {
      // Adjust last installment for rounding
      installmentTotal = Math.round(runningBalance * 100) / 100;
    }

    const scheduledDate = new Date(currentYear, currentMonth, isFifteenth ? 15 : 30);
    const dateStr = scheduledDate.toISOString().split('T')[0];

    runningBalance = Math.max(0, Math.round((runningBalance - installmentTotal) * 100) / 100);

    schedules.push({
      id: `sched-${i}-${Date.now().toString(36)}`,
      installmentNo: i,
      dueDate: dateStr,
      cutoffPeriod: isFifteenth ? '15th' : '30th',
      principal: perInstallmentPrincipal,
      interest: perInstallmentInterest,
      fees: 0,
      amount: installmentTotal,
      balanceAfter: runningBalance,
      status: 'SCHEDULED' as PaymentStatus,
    });

    if (isTwiceMonthly) {
      if (isFifteenth) {
        isFifteenth = false;
      } else {
        isFifteenth = true;
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }
    } else {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }
  }

  return {
    principal,
    termMonths,
    interestRate: product.interestRate,
    totalInterest,
    processingFee,
    totalPayable,
    netDisbursement,
    semiMonthlyDeduction,
    monthlyDeduction,
    totalInstallments,
    schedules,
  };
}

export function formatPHP(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}
