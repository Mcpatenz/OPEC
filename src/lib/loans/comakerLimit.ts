import { LoanApplication, LoanAccount } from '../../types';

export const MAX_CO_MAKER_LIMIT = 5;

/**
 * Calculates the total number of loans for which an employee is currently an active co-maker.
 * Per OPEC Aurum Gems policy, each employee is strictly limited to 5 co-maker commitments.
 */
export const getEmployeeCoMakerCount = (
  employeeId: string,
  applications: LoanApplication[],
  _activeLoans: LoanAccount[] = []
): { count: number; isLimitReached: boolean; remaining: number } => {
  let count = 0;

  applications.forEach(app => {
    // Exclude rejected or closed loans
    if (app.status !== 'REJECTED' && app.status !== 'CLOSED') {
      if (app.coMakers?.some(cm => cm.employeeId === employeeId)) {
        count++;
      }
    }
  });

  return {
    count,
    isLimitReached: count >= MAX_CO_MAKER_LIMIT,
    remaining: Math.max(0, MAX_CO_MAKER_LIMIT - count),
  };
};
