import { Employee, LoanProduct } from '../../types';

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
  if (existingBalance > 0 && product.code === 'EMERGENCY') {
    // Some products forbid active loans
    disqualificationReasons.push(`Existing outstanding loan balance of ₱${existingBalance.toLocaleString()} must be settled or renewed.`);
  }

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
