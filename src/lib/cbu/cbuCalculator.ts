import { Employee, EmploymentStatus } from '../../types';

export const CBU_PER_PAYDAY = 100; // ₱100.00 mandatory OPEC Capital Build-Up per semi-monthly payday
export const CBU_RETAINER_FEE_RATE = 0.10; // 10% Retainer's Fee given to OPEC upon resignation, AWOL, or removal from office
export const CBU_REFUNDABLE_RATE = 0.90; // 90% Net Refundable Equity to employee upon clearance

export interface CbuLedgerEntry {
  payPeriod: string; // e.g. "2026-10-15"
  periodLabel: string; // e.g. "October 15, 2026 (1st Cutoff)"
  contribution: number; // ₱100.00
  cumulativeTotal: number;
  status: 'POSTED' | 'SCHEDULED';
}

export interface CbuEvaluation {
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  dateHired: string;
  evaluationDate: string;
  paydaysCount: number;
  totalMonths: number;
  cbuPerPayday: number;
  monthlyContribution: number;
  totalCbu: number;
  retainersFee: number;
  netRefundableCbu: number;
  employmentStatus: EmploymentStatus;
  isSeparated: boolean;
  separationReason?: string;
  statusPolicyNote: string;
  recentLedger: CbuLedgerEntry[];
}

/**
 * Calculates total paydays elapsed between employee hire date and reference date.
 * Philippine payroll operates on a semi-monthly cycle (15th and end-of-month: 2 paydays/month).
 */
export function calculatePaydaysElapsed(
  dateHiredStr: string,
  referenceDate: Date = new Date(2026, 9, 15) // Oct 15, 2026 system reference date
): { totalPaydays: number; totalMonths: number } {
  const hireDate = new Date(dateHiredStr);
  if (isNaN(hireDate.getTime())) {
    return { totalPaydays: 48, totalMonths: 24 }; // Fallback to 2 years
  }

  let years = referenceDate.getFullYear() - hireDate.getFullYear();
  let months = referenceDate.getMonth() - hireDate.getMonth();

  if (referenceDate.getDate() < hireDate.getDate()) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const totalMonths = Math.max(1, years * 12 + months);
  // 2 paydays per month: 15th and end of month
  let totalPaydays = totalMonths * 2;

  // Partial month check for reference day
  if (referenceDate.getDate() >= 15 && hireDate.getDate() <= 15) {
    totalPaydays += 1;
  }
  if (referenceDate.getDate() >= 28 && hireDate.getDate() <= 28) {
    totalPaydays += 1;
  }

  return {
    totalPaydays: Math.max(1, totalPaydays),
    totalMonths,
  };
}

/**
 * Evaluates the full CBU accumulation, 10% retainer's fee, and 90% net refundable equity.
 * Rule:
 * - Employees contribute ₱100 per payday into Capital Build-Up (CBU).
 * - Total CBU is subject to a 10% retainer's fee given to OPEC if the employee
 *   resigns, AWOL (absence without official leave), or is removed from office/work.
 * - Remaining 90% is refunded to the employee upon clearance.
 */
export function evaluateEmployeeCbu(
  employee: Employee,
  referenceDate: Date = new Date(2026, 9, 15)
): CbuEvaluation {
  const { totalPaydays, totalMonths } = calculatePaydaysElapsed(employee.dateHired, referenceDate);

  // Use explicit cbuBalance if provided, otherwise compute from paydays * ₱100
  const totalCbu =
    typeof employee.cbuBalance === 'number' && employee.cbuBalance > 0
      ? employee.cbuBalance
      : totalPaydays * CBU_PER_PAYDAY;

  const retainersFee = Math.round(totalCbu * CBU_RETAINER_FEE_RATE * 100) / 100;
  const netRefundableCbu = Math.round((totalCbu - retainersFee) * 100) / 100;

  const status = employee.employmentStatus;
  const isSeparated =
    status === 'RESIGNED' ||
    status === 'AWOL' ||
    status === 'REMOVED' ||
    status === 'TERMINATED' ||
    status === 'INACTIVE';

  let separationReason = employee.separationReason;
  if (!separationReason) {
    if (status === 'RESIGNED') separationReason = 'Voluntary Resignation';
    else if (status === 'AWOL') separationReason = 'Absence Without Official Leave (AWOL)';
    else if (status === 'REMOVED' || status === 'TERMINATED') separationReason = 'Removed from Office / Work';
    else if (status === 'RETIRED') separationReason = 'Mandatory Retirement';
  }

  let statusPolicyNote =
    'Active Member Policy: ₱100 is deducted every semi-monthly payday. Upon separation (resignation, AWOL, or removal from office), 10% is retained by OPEC as Retainers Fee and 90% is refundable.';

  if (isSeparated) {
    statusPolicyNote = `Separation Applied (${separationReason}): Under OPEC Cooperative bylaws, 10% (₱${retainersFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}) has been retained for OPEC. The net refundable equity is ₱${netRefundableCbu.toLocaleString('en-PH', { minimumFractionDigits: 2 })}.`;
  }

  // Generate simulated recent semi-monthly ledger entries (last 6 pay periods)
  const recentLedger: CbuLedgerEntry[] = [];
  const periods = [
    { date: '2026-10-15', label: 'Oct 15, 2026 (1st Cutoff)', status: 'SCHEDULED' as const },
    { date: '2026-09-30', label: 'Sep 30, 2026 (2nd Cutoff)', status: 'POSTED' as const },
    { date: '2026-09-15', label: 'Sep 15, 2026 (1st Cutoff)', status: 'POSTED' as const },
    { date: '2026-08-31', label: 'Aug 31, 2026 (2nd Cutoff)', status: 'POSTED' as const },
    { date: '2026-08-15', label: 'Aug 15, 2026 (1st Cutoff)', status: 'POSTED' as const },
    { date: '2026-07-31', label: 'Jul 31, 2026 (2nd Cutoff)', status: 'POSTED' as const },
  ];

  let running = totalCbu;
  periods.forEach((p, idx) => {
    recentLedger.push({
      payPeriod: p.date,
      periodLabel: p.label,
      contribution: CBU_PER_PAYDAY,
      cumulativeTotal: running,
      status: p.status,
    });
    if (idx > 0) {
      running -= CBU_PER_PAYDAY;
    }
  });

  return {
    employeeId: employee.id,
    employeeNumber: employee.employeeNumber,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    dateHired: employee.dateHired,
    evaluationDate: '2026-10-15',
    paydaysCount: totalPaydays,
    totalMonths,
    cbuPerPayday: CBU_PER_PAYDAY,
    monthlyContribution: CBU_PER_PAYDAY * 2,
    totalCbu,
    retainersFee,
    netRefundableCbu,
    employmentStatus: status,
    isSeparated,
    separationReason,
    statusPolicyNote,
    recentLedger,
  };
}
