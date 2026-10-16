import { LoanAccount, Employee, PayrollDeductionEntry, AppNotification } from '../../types';
import { sendGmailNotification } from './gmailService';
import { formatPHP } from '../loans/calculator';

export interface SchedulerConfig {
  enabled: boolean;
  leadDays: number; // Default 3 days before payroll deduction date
  cronFrequency: 'DAILY' | 'TWICE_DAILY' | 'HOURLY';
  scheduledTime: string; // e.g. "08:00"
  subjectTemplate: string;
  autoSendEnabled: boolean;
  ccAdminEmail: boolean;
  adminEmail: string;
  lastRunTimestamp?: string;
  nextRunTimestamp?: string;
}

export interface UpcomingPaymentAlertItem {
  id: string;
  loanAccountId: string;
  loanNumber: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  recipientEmail: string;
  branchName: string;
  loanProductName: string;
  scheduledAmount: number;
  totalBalance: number;
  deductionDate: string; // e.g. "2026-10-15"
  alertTriggerDate: string; // deductionDate - leadDays (e.g. "2026-10-12")
  daysUntilDeduction: number;
  isDueForAlertToday: boolean;
  alertStatus: 'READY_TO_SEND' | 'ALREADY_SENT' | 'UPCOMING' | 'OVERDUE';
  lastSentAt?: string;
  lastMessageId?: string;
}

export interface SchedulerLogEntry {
  id: string;
  timestamp: string;
  triggerType: 'AUTOMATED_CRON' | 'MANUAL_SWEEP' | 'TEST_RUN';
  cutoffDate: string;
  eligibleCount: number;
  sentCount: number;
  skippedCount: number;
  recipients: string[];
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  summary: string;
}

const SCHEDULER_CONFIG_KEY = 'oagims_scheduler_config';
const SCHEDULER_LOGS_KEY = 'oagims_scheduler_logs';
const SENT_ALERTS_KEY = 'oagims_sent_payment_alerts';

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  enabled: true,
  leadDays: 3, // 3 days before payroll deduction date as required
  cronFrequency: 'DAILY',
  scheduledTime: '08:00 AM PHT',
  subjectTemplate: '[OPEC OA-GIMS Alert] Upcoming Payroll Deduction Notice - {{amount}} on {{deductionDate}}',
  autoSendEnabled: true,
  ccAdminEmail: true,
  adminEmail: 'treasury.zasurmis@opec.aurumgems.org',
  lastRunTimestamp: '2026-10-12T08:00:00Z',
  nextRunTimestamp: '2026-10-13T08:00:00Z',
};

/**
 * Retrieves the current scheduler configuration
 */
export function getSchedulerConfig(): SchedulerConfig {
  try {
    const raw = localStorage.getItem(SCHEDULER_CONFIG_KEY);
    if (!raw) return DEFAULT_SCHEDULER_CONFIG;
    return { ...DEFAULT_SCHEDULER_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SCHEDULER_CONFIG;
  }
}

/**
 * Saves scheduler configuration
 */
export function saveSchedulerConfig(config: SchedulerConfig): void {
  try {
    localStorage.setItem(SCHEDULER_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save scheduler config:', err);
  }
}

/**
 * Retrieves sent alert records map (key: loanId_deductionDate)
 */
export function getSentAlertsRecord(): Record<string, { sentAt: string; messageId?: string; toEmail: string }> {
  try {
    const raw = localStorage.getItem(SENT_ALERTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Records an alert as sent
 */
export function recordAlertSent(loanId: string, deductionDate: string, toEmail: string, messageId?: string): void {
  try {
    const existing = getSentAlertsRecord();
    existing[`${loanId}_${deductionDate}`] = {
      sentAt: new Date().toISOString(),
      messageId,
      toEmail,
    };
    localStorage.setItem(SENT_ALERTS_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to record sent alert:', err);
  }
}

/**
 * Retrieves scheduler execution logs
 */
export function getSchedulerLogs(): SchedulerLogEntry[] {
  try {
    const raw = localStorage.getItem(SCHEDULER_LOGS_KEY);
    if (!raw) {
      // Return initial realistic seed log for Oct 12 run
      return [
        {
          id: 'log-seed-1',
          timestamp: '2026-10-12T08:00:00Z',
          triggerType: 'AUTOMATED_CRON',
          cutoffDate: '2026-10-15',
          eligibleCount: 2,
          sentCount: 2,
          skippedCount: 0,
          recipients: ['carlo.lim@opec.aurumgems.org', 'sarah.alcantara@opec.aurumgems.org'],
          status: 'SUCCESS',
          summary: 'Automated 3-day lead sweep dispatched 2 Upcoming Payment alerts for Oct 15 payroll cutoff.',
        },
        {
          id: 'log-seed-0',
          timestamp: '2026-09-27T08:00:00Z',
          triggerType: 'AUTOMATED_CRON',
          cutoffDate: '2026-09-30',
          eligibleCount: 3,
          sentCount: 3,
          skippedCount: 0,
          recipients: ['carlo.lim@opec.aurumgems.org', 'pedro.cruz@opec.aurumgems.org', 'sarah.alcantara@opec.aurumgems.org'],
          status: 'SUCCESS',
          summary: 'Automated 3-day lead sweep dispatched 3 Upcoming Payment alerts for Sep 30 payroll cutoff.',
        },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Appends a new scheduler execution log
 */
export function addSchedulerLog(entry: SchedulerLogEntry): void {
  try {
    const logs = getSchedulerLogs();
    const updated = [entry, ...logs].slice(0, 50);
    localStorage.setItem(SCHEDULER_LOGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to add scheduler log:', err);
  }
}

/**
 * Helper to compute date difference in days (dateStr - referenceDate)
 */
export function getDiffDays(targetDateStr: string, refDate: Date = new Date()): number {
  const target = new Date(targetDateStr + 'T00:00:00');
  const base = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const diffTime = target.getTime() - base.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Helper to format date offset by days
 */
export function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Builds the upcoming deduction alert queue by evaluating active loans and scheduled deductions
 */
export function evaluateUpcomingPaymentQueue(
  activeLoans: LoanAccount[],
  employees: Employee[],
  leadDays: number = 3,
  referenceDate: Date = new Date()
): UpcomingPaymentAlertItem[] {
  const sentMap = getSentAlertsRecord();
  const queue: UpcomingPaymentAlertItem[] = [];

  const employeeMap = new Map(employees.map(e => [e.id, e]));

  activeLoans.forEach(loan => {
    if (loan.status !== 'ACTIVE') return;

    const emp = employeeMap.get(loan.employeeId);
    if (!emp) return;

    // Look at scheduled amortization entries
    const pendingSchedules = (loan.schedules || []).filter(
      s => (s.status === 'SCHEDULED' || s.status === 'PARTIAL') && s.dueDate
    );

    pendingSchedules.forEach(schedule => {
      const deductionDate = schedule.dueDate;
      const daysUntil = getDiffDays(deductionDate, referenceDate);
      const alertTriggerDate = subtractDays(deductionDate, leadDays);
      const daysUntilTrigger = getDiffDays(alertTriggerDate, referenceDate);

      const alertKey = `${loan.id}_${deductionDate}`;
      const sentRecord = sentMap[alertKey];

      // Product label
      const prodName = loan.loanProductId.includes('commodity')
        ? 'Commodity Loan'
        : loan.loanProductId.includes('emergency')
        ? 'Emergency Assistance Loan'
        : loan.loanProductId.includes('petty')
        ? 'Petty Cash Loan'
        : loan.loanProductId.includes('calamity')
        ? 'Calamity Assistance'
        : 'Regular Multi-Purpose Loan';

      let alertStatus: UpcomingPaymentAlertItem['alertStatus'] = 'UPCOMING';
      if (sentRecord) {
        alertStatus = 'ALREADY_SENT';
      } else if (daysUntil <= leadDays && daysUntil >= 0) {
        alertStatus = 'READY_TO_SEND';
      } else if (daysUntil < 0) {
        alertStatus = 'OVERDUE';
      }

      queue.push({
        id: `alert-${loan.id}-${schedule.id}`,
        loanAccountId: loan.id,
        loanNumber: loan.loanNumber,
        employeeId: emp.id,
        employeeNumber: emp.employeeNumber,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        recipientEmail: emp.email || `${emp.username || 'member'}@opec.aurumgems.org`,
        branchName: emp.branchId || 'Region 20 Branch',
        loanProductName: prodName,
        scheduledAmount: schedule.amount,
        totalBalance: loan.balance,
        deductionDate,
        alertTriggerDate,
        daysUntilDeduction: daysUntil,
        isDueForAlertToday: daysUntilTrigger === 0 || (daysUntil <= leadDays && !sentRecord),
        alertStatus,
        lastSentAt: sentRecord?.sentAt,
        lastMessageId: sentRecord?.messageId,
      });
    });
  });

  // Sort: First items ready to send, then closest due date
  queue.sort((a, b) => {
    if (a.alertStatus === 'READY_TO_SEND' && b.alertStatus !== 'READY_TO_SEND') return -1;
    if (b.alertStatus === 'READY_TO_SEND' && a.alertStatus !== 'READY_TO_SEND') return 1;
    return a.daysUntilDeduction - b.daysUntilDeduction;
  });

  return queue;
}

/**
 * Generates official OPEC OA-GIMS Upcoming Payment Email HTML
 */
export function generateUpcomingPaymentEmailHtml({
  employeeName,
  employeeNumber,
  loanNumber,
  loanProductName,
  scheduledAmount,
  totalBalance,
  deductionDate,
  daysRemaining,
  branchName,
}: {
  employeeName: string;
  employeeNumber: string;
  loanNumber: string;
  loanProductName: string;
  scheduledAmount: number;
  totalBalance: number;
  deductionDate: string;
  daysRemaining: number;
  branchName: string;
}): { html: string; text: string; subject: string } {
  const formattedAmount = formatPHP(scheduledAmount);
  const formattedBalance = formatPHP(totalBalance);
  const cutoffText = deductionDate.endsWith('15') ? '15th Mid-Month Payroll' : '30th End-of-Month Payroll';

  const subject = `[OPEC OA-GIMS Alert] Upcoming Payroll Deduction Notice - ${formattedAmount} on ${deductionDate}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Upcoming Payroll Deduction Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px 12px; color: #0f172a; }
    .wrapper { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid #e2e8f0; }
    .banner { background: linear-gradient(135deg, #090d16 0%, #1e293b 100%); padding: 28px 32px; border-bottom: 4px solid #f59e0b; position: relative; }
    .banner-title { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0; }
    .banner-tag { display: inline-block; font-size: 11px; font-weight: 700; color: #f59e0b; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); padding: 3px 10px; border-radius: 6px; margin-top: 6px; }
    .content { padding: 32px; }
    .badge-alert { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 12px; border-radius: 999px; background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; margin-bottom: 16px; }
    .headline { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; }
    .lead-text { font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0; }
    .highlight-card { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center; }
    .highlight-label { font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; color: #64748b; margin-bottom: 4px; }
    .highlight-amount { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; color: #0f172a; margin: 4px 0; }
    .highlight-date { font-size: 13px; font-weight: 700; color: #d97706; }
    .table-box { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 24px; }
    .row { display: flex; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .row:nth-child(even) { background: #f8fafc; }
    .col-label { color: #64748b; font-weight: 600; }
    .col-val { color: #0f172a; font-weight: 700; text-align: right; }
    .policy-callout { background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 14px 18px; font-size: 12px; color: #1e40af; line-height: 1.6; margin-bottom: 24px; }
    .policy-title { font-weight: 800; color: #1e3a8a; margin-bottom: 4px; display: block; }
    .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="banner">
      <h1 class="banner-title">OPEC Aurum Gems Management System</h1>
      <div class="banner-tag">Region 20 ZASURMIS · Automated Deduction Alert</div>
    </div>
    <div class="content">
      <div class="badge-alert">⏱ 3-Day Prior Reminder · Upcoming Payroll Deduction</div>
      <h2 class="headline">Hello, ${employeeName}</h2>
      <p class="lead-text">
        This is an automated advisory from the <strong>OPEC Treasury & Loan Administration Desk</strong>. An upcoming loan amortization payment will be processed via payroll salary deduction in <strong>${daysRemaining} days</strong>.
      </p>

      <div class="highlight-card">
        <div class="highlight-label">Scheduled Salary Deduction Amount</div>
        <div class="highlight-amount">${formattedAmount}</div>
        <div class="highlight-date">Due on Payday: ${deductionDate} (${cutoffText})</div>
      </div>

      <div class="table-box">
        <div class="row">
          <span class="col-label">Employee Number:</span>
          <span class="col-val font-mono">${employeeNumber}</span>
        </div>
        <div class="row">
          <span class="col-label">Loan Account #:</span>
          <span class="col-val font-mono">${loanNumber}</span>
        </div>
        <div class="row">
          <span class="col-label">Loan Facility:</span>
          <span class="col-val">${loanProductName}</span>
        </div>
        <div class="row">
          <span class="col-label">Assigned Branch:</span>
          <span class="col-val">${branchName}</span>
        </div>
        <div class="row">
          <span class="col-label">Current Outstanding Balance:</span>
          <span class="col-val font-mono">${formattedBalance}</span>
        </div>
        <div class="row">
          <span class="col-label">Deduction Channel:</span>
          <span class="col-val">Automated Semi-Monthly Payroll (15th / 30th)</span>
        </div>
      </div>

      <div class="policy-callout">
        <span class="policy-title">📋 OPEC Lending Bylaws · Sections 18 & 19 Compliance</span>
        Salary deductions are automatically debited from your payroll disbursement. Please ensure adequate take-home balance after statutory contributions. If you notice any discrepancy or anticipate unpaid leave, please contact your Area Payroll Master or Loan Officer immediately.
      </div>
    </div>
    <div class="footer">
      OPEC Aurum Gems Integrated Management System (OA-GIMS)<br/>
      Region 20 ZASURMIS · Misamis Occidental & Zamboanga del Sur<br/>
      This automated alert was dispatched by the Admin Recurring Email Scheduler 3 days prior to cutoff.
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
OPEC AURUM GEMS MANAGEMENT SYSTEM (OA-GIMS)
Region 20 ZASURMIS · Automated Payroll Deduction Advisory

Hello ${employeeName} (${employeeNumber}),

This is an automated 3-day advance notice that a salary deduction of ${formattedAmount} for your ${loanProductName} (Loan #${loanNumber}) is scheduled on ${deductionDate} (${cutoffText}).

Outstanding Balance: ${formattedBalance}
Branch: ${branchName}

Please ensure your payroll net pay accommodates this installment per Sections 18 & 19 of OPEC Bylaws.
For questions, contact your Branch Loan Officer or Treasury Desk.
  `.trim();

  return { html, text, subject };
}

/**
 * Triggers the automated sweep:
 * Finds all deductions due in `leadDays` (default 3 days),
 * dispatches email notifications, logs to outbox, and adds in-app notifications.
 */
export async function runAutomatedUpcomingPaymentSweep({
  activeLoans,
  employees,
  triggerType = 'MANUAL_SWEEP',
  leadDays = 3,
  notifyInApp,
}: {
  activeLoans: LoanAccount[];
  employees: Employee[];
  triggerType?: 'AUTOMATED_CRON' | 'MANUAL_SWEEP' | 'TEST_RUN';
  leadDays?: number;
  notifyInApp?: (
    title: string,
    message: string,
    type: AppNotification['type'],
    targetRole?: any[],
    targetEmployeeId?: string,
    category?: any,
    linkAction?: string,
    relatedId?: string,
    actorName?: string
  ) => void;
}): Promise<{
  success: boolean;
  eligibleCount: number;
  sentCount: number;
  skippedCount: number;
  recipients: string[];
  summary: string;
}> {
  const queue = evaluateUpcomingPaymentQueue(activeLoans, employees, leadDays);
  // Eligible are items ready to send or due today
  const eligibleItems = queue.filter(item => item.alertStatus === 'READY_TO_SEND');

  let sentCount = 0;
  let skippedCount = 0;
  const dispatchedRecipients: string[] = [];

  for (const item of eligibleItems) {
    const { html, text, subject } = generateUpcomingPaymentEmailHtml({
      employeeName: item.employeeName,
      employeeNumber: item.employeeNumber,
      loanNumber: item.loanNumber,
      loanProductName: item.loanProductName,
      scheduledAmount: item.scheduledAmount,
      totalBalance: item.totalBalance,
      deductionDate: item.deductionDate,
      daysRemaining: item.daysUntilDeduction,
      branchName: item.branchName,
    });

    try {
      const result = await sendGmailNotification({
        toEmail: item.recipientEmail,
        recipientName: item.employeeName,
        title: `Upcoming Payday Loan Deduction Alert (${item.deductionDate})`,
        message: `Semi-monthly payroll deduction of ${formatPHP(item.scheduledAmount)} for ${item.loanProductName} (Loan #${item.loanNumber}) will be debited in ${item.daysUntilDeduction} days on ${item.deductionDate}. Remaining loan balance: ${formatPHP(item.totalBalance)}.`,
        category: 'UPCOMING_PAYMENT',
        referenceId: item.loanNumber,
        actorName: 'Admin Email Notification Scheduler',
      });

      // Record as sent in persistent storage
      recordAlertSent(item.loanAccountId, item.deductionDate, item.recipientEmail, result.messageId);

      // Also trigger in-app notification for the employee
      if (notifyInApp) {
        notifyInApp(
          'Upcoming Payday Loan Deduction Alert',
          `Semi-monthly installment of ${formatPHP(item.scheduledAmount)} for Loan #${item.loanNumber} is scheduled in ${item.daysUntilDeduction} days (${item.deductionDate}) via salary deduction.`,
          'PAYMENT',
          undefined,
          item.employeeId,
          'UPCOMING_PAYMENT',
          'emp-dashboard',
          item.loanNumber,
          'Admin Recurring Email Scheduler'
        );
      }

      sentCount++;
      dispatchedRecipients.push(`${item.employeeName} <${item.recipientEmail}>`);
    } catch (err) {
      console.error(`Failed to send upcoming payment email to ${item.recipientEmail}:`, err);
      skippedCount++;
    }
  }

  const cutoff = eligibleItems[0]?.deductionDate || '2026-10-15';
  const summary = `Recurring scheduler ${triggerType === 'AUTOMATED_CRON' ? 'automated cron job' : 'sweep'} processed ${eligibleItems.length} eligible employee deduction(s) due in ${leadDays} days (${cutoff}). Sent: ${sentCount}, Skipped: ${skippedCount}.`;

  // Log execution
  addSchedulerLog({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    triggerType,
    cutoffDate: cutoff,
    eligibleCount: eligibleItems.length,
    sentCount,
    skippedCount,
    recipients: dispatchedRecipients,
    status: sentCount > 0 || eligibleItems.length === 0 ? 'SUCCESS' : 'WARNING',
    summary,
  });

  // Update lastRunTimestamp in config
  const config = getSchedulerConfig();
  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + 1);
  saveSchedulerConfig({
    ...config,
    lastRunTimestamp: new Date().toISOString(),
    nextRunTimestamp: nextRun.toISOString(),
  });

  return {
    success: true,
    eligibleCount: eligibleItems.length,
    sentCount,
    skippedCount,
    recipients: dispatchedRecipients,
    summary,
  };
}
