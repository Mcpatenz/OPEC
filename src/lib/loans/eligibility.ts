import { Employee, LoanProduct, LoanAccount, LoanApplication } from '../../types';

export interface EligibilityEvaluation {
  eligible: boolean;
  yearsOfService: number;
  yearsOfServiceFormatted: string;
  employmentStatus: string;
  maximumLoanAmount: number;
  maximumTermMonths: number;
  requiredCoMakers: number;
  coMakerMinServiceYears: number;
  existingOutstandingBalance: number;
  disqualificationReasons: string[];
}

export interface CoMakerValidationResult {
  valid: boolean;
  reason?: string;
}

export function calculateYearsOfService(dateHiredStr: string, referenceDate: Date = new Date(2026, 9, 4)): {
  years: number;
  months: number;
  totalDecimalYears: number;
  formatted: string;
} {
  const hireDate = new Date(dateHiredStr);
  let years = referenceDate.getFullYear() - hireDate.getFullYear();
  let months = referenceDate.getMonth() - hireDate.getMonth();

  if (referenceDate.getDate() < hireDate.getDate()) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const totalDecimalYears = Math.round((years + months / 12) * 10) / 10;
  const formatted = `${years} yr${years !== 1 ? 's' : ''} ${months} mo${months !== 1 ? 's' : ''}`;

  return {
    years,
    months,
    totalDecimalYears,
    formatted,
  };
}

export function evaluateLoanEligibility(
  employee: Employee,
  product: LoanProduct,
  existingBalance: number = 0,
  referenceDate: Date = new Date(2026, 9, 4)
): EligibilityEvaluation {
  const service = calculateYearsOfService(employee.dateHired, referenceDate);
  const disqualificationReasons: string[] = [];

  // 1. Employment Status must be PERMANENT
  if (employee.employmentStatus !== 'PERMANENT') {
    disqualificationReasons.push(`Employee status is ${employee.employmentStatus}. Only PERMANENT employees are eligible for OPEC loans.`);
  }

  // 2. Minimum service years
  if (service.totalDecimalYears < product.minServiceYearsApplicant) {
    disqualificationReasons.push(
      `Insufficient service: ${service.formatted}. Minimum required for ${product.name} is ${product.minServiceYearsApplicant} year(s).`
    );
  }

  // 3. Outstanding loan restrictions
  // Note: An active Regular Multi-Purpose Loan does NOT prevent an employee from taking Emergency, Commodity, Calamity, or Petty Cash loans.
  // Only an active loan of the EXACT same short-term product restricts duplicate drawdown without clearance.

  // Determine tiers based on OPEC service ladder
  let tierMaxLoan = product.maxAmount;
  let tierMaxTerm = product.maxTermMonths;

  if (product.code === 'COMMODITY' || product.code === 'REGULAR_MPL') {
    if (service.totalDecimalYears >= 5) {
      tierMaxLoan = Math.min(product.maxAmount, 30000);
      tierMaxTerm = 24;
    } else if (service.totalDecimalYears >= 3) {
      tierMaxLoan = Math.min(product.maxAmount, 20000);
      tierMaxTerm = 18;
    } else if (service.totalDecimalYears >= 1) {
      tierMaxLoan = Math.min(product.maxAmount, 10000);
      tierMaxTerm = 12;
    } else {
      tierMaxLoan = 0;
    }
  }

  return {
    eligible: disqualificationReasons.length === 0,
    yearsOfService: service.totalDecimalYears,
    yearsOfServiceFormatted: service.formatted,
    employmentStatus: employee.employmentStatus,
    maximumLoanAmount: tierMaxLoan,
    maximumTermMonths: tierMaxTerm,
    requiredCoMakers: product.requiredCoMakers,
    coMakerMinServiceYears: product.minServiceYearsCoMaker,
    existingOutstandingBalance: existingBalance,
    disqualificationReasons,
  };
}

export function validateCoMaker(
  coMaker: Employee,
  applicant: Employee,
  selectedCoMakerIds: string[],
  minServiceYearsRequired: number = 5,
  referenceDate: Date = new Date(2026, 9, 4)
): CoMakerValidationResult {
  // Cannot be the applicant
  if (coMaker.id === applicant.id) {
    return { valid: false, reason: 'Applicant cannot be their own co-maker.' };
  }

  // Cannot be duplicate
  if (selectedCoMakerIds.includes(coMaker.id)) {
    return { valid: false, reason: 'Employee has already been selected as a co-maker.' };
  }

  // Must be active and permanent
  if (coMaker.employmentStatus !== 'PERMANENT') {
    return { valid: false, reason: `Co-maker must be PERMANENT (current: ${coMaker.employmentStatus}).` };
  }

  // Must be OPEC member
  if (!coMaker.opecMembership) {
    return { valid: false, reason: 'Co-maker must be an active OPEC member.' };
  }

  // Must meet minimum service years (standard 5+ years)
  const service = calculateYearsOfService(coMaker.dateHired, referenceDate);
  if (service.totalDecimalYears < minServiceYearsRequired) {
    return {
      valid: false,
      reason: `Co-maker has ${service.formatted} in service. OPEC policy requires at least ${minServiceYearsRequired} years.`,
    };
  }

  return { valid: true };
}

export const isRegularMplProduct = (productCodeOrId?: string): boolean => {
  if (!productCodeOrId) return false;
  const p = productCodeOrId.toLowerCase();
  return p === 'prod-mpl' || p === 'regular_mpl' || p === 'regular' || p.includes('mpl') || p.includes('multi');
};

export const isConcurrentAllowedProduct = (productCodeOrId?: string): boolean => {
  if (!productCodeOrId) return false;
  const p = productCodeOrId.toUpperCase();
  return (
    p.includes('EMERGENCY') ||
    p.includes('COMMODITY') ||
    p.includes('CALAMITY') ||
    p.includes('PETTY')
  );
};

export interface ReLoanEligibilityResult {
  canApply: boolean;
  isReLoan: boolean;
  hasActiveLoan: boolean;
  activeLoan?: LoanAccount;
  hasActiveRegularMpl: boolean;
  activeRegularMpl?: LoanAccount;
  paymentPercentage: number;
  isMoreThanHalfPaid: boolean;
  takeHomePayPercentage: number;
  has35PercentTakeHome: boolean;
  canReLoanRegularMpl: boolean;
  canApplyForOtherLoans: boolean;
  allowedOtherProducts: string[];
  isProductAllowed: (productCodeOrId: string) => boolean;
  getProductRestrictionReason: (productCodeOrId: string) => string | undefined;
  netTakeHomeAmount: number;
  monthlySalary: number;
  totalMonthlyDeductions: number;
  remainingLoanBalance: number;
  reason: string;
  badgeLabel: string;
}

export function evaluateReLoanEligibility(
  employee: Employee,
  activeLoans: LoanAccount[],
  applications: LoanApplication[],
  targetProduct?: LoanProduct | string
): ReLoanEligibilityResult {
  const monthlySalary = employee.monthlySalary || 28000;
  const targetCode = typeof targetProduct === 'string'
    ? targetProduct
    : targetProduct?.code || targetProduct?.id;

  // 1. Check for pending or approved in-flight applications for this employee
  const employeePendingApplications = applications.filter(
    a => a.employeeId === employee.id &&
         ['SUBMITTED', 'FOR_REVIEW', 'AREA_MANAGER_REVIEW', 'OPEC_PRESIDENT_REVIEW', 'REGIONAL_MANAGER_REVIEW', 'CREDIT_COMMITTEE', 'FOR_RELEASE', 'APPROVED'].includes(a.status)
  );

  // 2. Find active or approved loans for this employee with positive balance
  const employeeActiveLoans = activeLoans.filter(
    l => l.employeeId === employee.id &&
         ['ACTIVE', 'PARTIALLY_PAID', 'APPROVED', 'RELEASED'].includes(l.status) &&
         (l.balance > 0)
  );

  const activeLoan = employeeActiveLoans[0];
  const hasActiveLoan = employeeActiveLoans.length > 0;

  // 3. Specifically locate active Regular Multi-Purpose Loan
  const activeRegularMpl = employeeActiveLoans.find(
    l => isRegularMplProduct(l.loanProductId) || (l.productName && isRegularMplProduct(l.productName))
  );
  const hasActiveRegularMpl = !!activeRegularMpl;

  // 4. Compute halfway and 35% take-home pay conditions on active Regular MPL
  let paymentPercentage = 0;
  let isMoreThanHalfPaid = false;
  let monthlyLoanDeduction = 0;

  if (activeRegularMpl) {
    const totalPayable = activeRegularMpl.totalPayable || (activeRegularMpl.principal + activeRegularMpl.interestTotal) || 1;
    const amountPaid = activeRegularMpl.amountPaid !== undefined
      ? activeRegularMpl.amountPaid
      : Math.max(0, totalPayable - activeRegularMpl.balance);
    paymentPercentage = totalPayable > 0 ? (amountPaid / totalPayable) * 100 : 0;
    isMoreThanHalfPaid = paymentPercentage >= 50;

    monthlyLoanDeduction = activeRegularMpl.schedules && activeRegularMpl.schedules.length > 0
      ? activeRegularMpl.schedules[0].amount * 2
      : activeRegularMpl.balance / 12;
  } else if (activeLoan) {
    const totalPayable = activeLoan.totalPayable || (activeLoan.principal + activeLoan.interestTotal) || 1;
    const amountPaid = activeLoan.amountPaid !== undefined
      ? activeLoan.amountPaid
      : Math.max(0, totalPayable - activeLoan.balance);
    paymentPercentage = totalPayable > 0 ? (amountPaid / totalPayable) * 100 : 0;
    isMoreThanHalfPaid = paymentPercentage >= 50;

    monthlyLoanDeduction = activeLoan.schedules && activeLoan.schedules.length > 0
      ? activeLoan.schedules[0].amount * 2
      : activeLoan.balance / 12;
  }

  // Statutory deductions & CBU (₱200/mo mandatory CBU + ~₱3,200 standard statutory)
  const statutoryAndCbu = 3400;
  const totalMonthlyDeductions = statutoryAndCbu + monthlyLoanDeduction;
  const netTakeHomeAmount = Math.max(0, monthlySalary - totalMonthlyDeductions);
  const takeHomePayPercentage = monthlySalary > 0 ? (netTakeHomeAmount / monthlySalary) * 100 : 0;
  const has35PercentTakeHome = takeHomePayPercentage >= 35;
  const canReLoanRegularMpl = isMoreThanHalfPaid && has35PercentTakeHome;

  // Allowed other products concurrent with active Regular MPL
  const allowedOtherProducts = ['EMERGENCY', 'COMMODITY', 'CALAMITY', 'PETTY_CASH'];

  // Helper function to check if a product is allowed
  const isProductAllowed = (codeOrId: string): boolean => {
    // If pending application for this exact facility exists, block duplicate
    const hasPendingOfFacility = employeePendingApplications.some(
      a => a.loanProductId === codeOrId || (a.loanProductId && isRegularMplProduct(a.loanProductId) && isRegularMplProduct(codeOrId))
    );
    if (hasPendingOfFacility) return false;

    // Check Regular Multi-Purpose Loan
    if (isRegularMplProduct(codeOrId)) {
      if (hasActiveRegularMpl) {
        // Can only re-loan if paid in half and has >= 35% take-home pay
        return canReLoanRegularMpl;
      }
      return true;
    }

    // Emergency, Commodity, Calamity Assistance, Petty Cash
    if (isConcurrentAllowedProduct(codeOrId)) {
      // An active Regular MPL does NOT block these!
      // Check if employee has an active loan of THAT EXACT SAME product:
      const hasActiveOfSameProduct = employeeActiveLoans.some(l => {
        const pId = l.loanProductId?.toUpperCase() || '';
        const target = codeOrId.toUpperCase();
        return pId === target || (target.includes('EMERGENCY') && pId.includes('EMERGENCY')) ||
               (target.includes('COMMODITY') && pId.includes('COMMODITY')) ||
               (target.includes('CALAMITY') && pId.includes('CALAMITY')) ||
               (target.includes('PETTY') && pId.includes('PETTY'));
      });
      return !hasActiveOfSameProduct;
    }

    return true;
  };

  const getProductRestrictionReason = (codeOrId: string): string | undefined => {
    if (isRegularMplProduct(codeOrId)) {
      if (hasActiveRegularMpl && !canReLoanRegularMpl) {
        if (!isMoreThanHalfPaid && !has35PercentTakeHome) {
          return `You currently have an active Regular Multi-Purpose Loan (#${activeRegularMpl?.loanNumber}). You cannot take another Regular MPL until it is paid in half (currently ${paymentPercentage.toFixed(1)}%, requires ≥50%) and maintains ≥35% net take-home pay (currently ${takeHomePayPercentage.toFixed(1)}%). You CAN loan for Emergency, Commodity, Calamity Assistance, or Petty Cash.`;
        }
        if (!isMoreThanHalfPaid) {
          return `You have an active Regular Multi-Purpose Loan (#${activeRegularMpl?.loanNumber}). To re-loan, payments made must be paid in half (currently ${paymentPercentage.toFixed(1)}%, requires ≥50%). You CAN loan for Emergency, Commodity, Calamity Assistance, or Petty Cash.`;
        }
        return `Payments on active Regular MPL (#${activeRegularMpl?.loanNumber}) are ${paymentPercentage.toFixed(1)}% (≥50%), but projected take-home pay is ${takeHomePayPercentage.toFixed(1)}% (below the mandatory 35% threshold). You CAN loan for Emergency, Commodity, Calamity Assistance, or Petty Cash.`;
      }
    }
    return undefined;
  };

  const remainingLoanBalance = activeRegularMpl?.balance || activeLoan?.balance || 0;

  // Case A: Specific target product requested
  if (targetCode) {
    const isTargetMpl = isRegularMplProduct(targetCode);
    const isTargetAllowed = isProductAllowed(targetCode);

    if (isTargetMpl) {
      if (hasActiveRegularMpl) {
        if (canReLoanRegularMpl) {
          return {
            canApply: true,
            isReLoan: true,
            hasActiveLoan: true,
            activeLoan: activeRegularMpl || activeLoan,
            hasActiveRegularMpl: true,
            activeRegularMpl,
            paymentPercentage,
            isMoreThanHalfPaid: true,
            takeHomePayPercentage,
            has35PercentTakeHome: true,
            canReLoanRegularMpl: true,
            canApplyForOtherLoans: true,
            allowedOtherProducts,
            isProductAllowed,
            getProductRestrictionReason,
            netTakeHomeAmount,
            monthlySalary,
            totalMonthlyDeductions,
            remainingLoanBalance,
            reason: `Eligible for Regular MPL Re-Loan: Active loan #${activeRegularMpl?.loanNumber} is paid in half (${paymentPercentage.toFixed(1)}% ≥ 50%) and maintains ${takeHomePayPercentage.toFixed(1)}% take-home pay (≥35%) after deducting remaining balance of ₱${remainingLoanBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
            badgeLabel: 'Re-Loan (Halfway) Eligible',
          };
        } else {
          return {
            canApply: false,
            isReLoan: false,
            hasActiveLoan: true,
            activeLoan: activeRegularMpl || activeLoan,
            hasActiveRegularMpl: true,
            activeRegularMpl,
            paymentPercentage,
            isMoreThanHalfPaid,
            takeHomePayPercentage,
            has35PercentTakeHome,
            canReLoanRegularMpl: false,
            canApplyForOtherLoans: true,
            allowedOtherProducts,
            isProductAllowed,
            getProductRestrictionReason,
            netTakeHomeAmount,
            monthlySalary,
            totalMonthlyDeductions,
            remainingLoanBalance,
            reason: getProductRestrictionReason(targetCode) || 'Regular MPL re-loan locked.',
            badgeLabel: !isMoreThanHalfPaid
              ? `Regular MPL Locked (${paymentPercentage.toFixed(0)}% Paid — Need ≥50%)`
              : `Regular MPL Locked (Take-Home ${takeHomePayPercentage.toFixed(0)}% — Need ≥35%)`,
          };
        }
      }
    } else if (isConcurrentAllowedProduct(targetCode)) {
      // Target is Emergency, Commodity, Calamity, or Petty Cash:
      // Having an active Regular MPL is ALLOWED!
      return {
        canApply: isTargetAllowed,
        isReLoan: false,
        hasActiveLoan: true,
        activeLoan: activeRegularMpl || activeLoan,
        hasActiveRegularMpl,
        activeRegularMpl,
        paymentPercentage,
        isMoreThanHalfPaid,
        takeHomePayPercentage,
        has35PercentTakeHome,
        canReLoanRegularMpl,
        canApplyForOtherLoans: true,
        allowedOtherProducts,
        isProductAllowed,
        getProductRestrictionReason,
        netTakeHomeAmount,
        monthlySalary,
        totalMonthlyDeductions,
        remainingLoanBalance,
        reason: hasActiveRegularMpl
          ? 'Allowed with active Regular Multi-Purpose Loan: Employees with an active Regular MPL are permitted to apply for Emergency, Commodity, Calamity Assistance, or Petty Cash loans.'
          : 'Eligible for loan drawdown.',
        badgeLabel: hasActiveRegularMpl ? 'Allowed with Active Regular MPL' : 'Eligible to Apply',
      };
    }
  }

  // Case B: General evaluation (no target product or general dashboard button)
  if (!hasActiveLoan) {
    return {
      canApply: true,
      isReLoan: false,
      hasActiveLoan: false,
      hasActiveRegularMpl: false,
      paymentPercentage: 100,
      isMoreThanHalfPaid: true,
      takeHomePayPercentage: 100,
      has35PercentTakeHome: true,
      canReLoanRegularMpl: true,
      canApplyForOtherLoans: true,
      allowedOtherProducts,
      isProductAllowed,
      getProductRestrictionReason,
      netTakeHomeAmount: monthlySalary,
      monthlySalary,
      totalMonthlyDeductions: 0,
      remainingLoanBalance: 0,
      reason: 'No existing active loan. All OPEC loan facilities are open for application.',
      badgeLabel: 'Eligible to Apply',
    };
  }

  // Has active loan
  if (hasActiveRegularMpl) {
    if (canReLoanRegularMpl) {
      return {
        canApply: true,
        isReLoan: true,
        hasActiveLoan: true,
        activeLoan: activeRegularMpl || activeLoan,
        hasActiveRegularMpl: true,
        activeRegularMpl,
        paymentPercentage,
        isMoreThanHalfPaid: true,
        takeHomePayPercentage,
        has35PercentTakeHome: true,
        canReLoanRegularMpl: true,
        canApplyForOtherLoans: true,
        allowedOtherProducts,
        isProductAllowed,
        getProductRestrictionReason,
        netTakeHomeAmount,
        monthlySalary,
        totalMonthlyDeductions,
        remainingLoanBalance,
        reason: `Eligible for Regular MPL Re-Loan: Payments on loan #${activeRegularMpl.loanNumber} are ${paymentPercentage.toFixed(1)}% (≥50%) and Net Take-Home Pay is ${takeHomePayPercentage.toFixed(1)}% (≥35%). You can also apply for Emergency, Commodity, Calamity, or Petty Cash loans.`,
        badgeLabel: 'Re-Loan (Halfway) Eligible',
      };
    } else {
      // Cannot re-loan Regular MPL, but CAN loan for Emergency, Commodity, Calamity, Petty Cash
      return {
        canApply: true, // Can apply for the other allowed products!
        isReLoan: false,
        hasActiveLoan: true,
        activeLoan: activeRegularMpl || activeLoan,
        hasActiveRegularMpl: true,
        activeRegularMpl,
        paymentPercentage,
        isMoreThanHalfPaid,
        takeHomePayPercentage,
        has35PercentTakeHome,
        canReLoanRegularMpl: false,
        canApplyForOtherLoans: true,
        allowedOtherProducts,
        isProductAllowed,
        getProductRestrictionReason,
        netTakeHomeAmount,
        monthlySalary,
        totalMonthlyDeductions,
        remainingLoanBalance,
        reason: `Active Regular Multi-Purpose Loan (#${activeRegularMpl.loanNumber}) cannot be renewed until paid in half (currently ${paymentPercentage.toFixed(1)}%, need ≥50%) and maintains ≥35% take-home pay (currently ${takeHomePayPercentage.toFixed(1)}%). However, you CAN loan for Emergency, Commodity, Calamity Assistance, and Petty Cash!`,
        badgeLabel: 'Emergency / Commodity / Calamity / Petty Cash Eligible',
      };
    }
  }

  // Active loan in other facility
  return {
    canApply: true,
    isReLoan: isMoreThanHalfPaid && has35PercentTakeHome,
    hasActiveLoan: true,
    activeLoan,
    hasActiveRegularMpl: false,
    paymentPercentage,
    isMoreThanHalfPaid,
    takeHomePayPercentage,
    has35PercentTakeHome,
    canReLoanRegularMpl: false,
    canApplyForOtherLoans: true,
    allowedOtherProducts,
    isProductAllowed,
    getProductRestrictionReason,
    netTakeHomeAmount,
    monthlySalary,
    totalMonthlyDeductions,
    remainingLoanBalance,
    reason: `Active loan #${activeLoan?.loanNumber} (${paymentPercentage.toFixed(1)}% paid). Regular Multi-Purpose, Emergency, Commodity, Calamity, and Petty Cash rules apply.`,
    badgeLabel: 'Active Loan On Record',
  };
}
