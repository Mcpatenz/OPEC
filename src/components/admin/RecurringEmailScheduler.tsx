import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getSchedulerConfig,
  saveSchedulerConfig,
  getSchedulerLogs,
  evaluateUpcomingPaymentQueue,
  generateUpcomingPaymentEmailHtml,
  runAutomatedUpcomingPaymentSweep,
  SchedulerConfig,
  SchedulerLogEntry,
  UpcomingPaymentAlertItem,
} from '../../lib/services/schedulerService';
import { sendGmailNotification } from '../../lib/services/gmailService';
import { formatPHP } from '../../lib/loans/calculator';
import {
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Send,
  Eye,
  Sliders,
  History,
  FileText,
  Smartphone,
  Monitor,
  ChevronRight,
  ShieldCheck,
  Building,
  DollarSign,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface RecurringEmailSchedulerProps {
  onBackToDashboard?: () => void;
}

export const RecurringEmailScheduler: React.FC<RecurringEmailSchedulerProps> = ({
  onBackToDashboard,
}) => {
  const {
    activeLoans,
    employees,
    notify,
    isGoogleConnected,
    googleUser,
    registeredGmail,
    openGmailOtpModal,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'QUEUE' | 'PREVIEW' | 'SETTINGS' | 'LOGS'>('QUEUE');
  const [config, setConfig] = useState<SchedulerConfig>(getSchedulerConfig);
  const [logs, setLogs] = useState<SchedulerLogEntry[]>(getSchedulerLogs);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY_TO_SEND' | 'ALREADY_SENT' | 'UPCOMING'>('ALL');
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState<{
    show: boolean;
    count: number;
    message: string;
    success: boolean;
  } | null>(null);

  // Test email state
  const [testEmailInput, setTestEmailInput] = useState(registeredGmail || googleUser?.email || 'admin@opec.aurumgems.org');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSendFeedback, setTestSendFeedback] = useState<string | null>(null);

  // Selected item for previewing template
  const [selectedAlertForPreview, setSelectedAlertForPreview] = useState<UpcomingPaymentAlertItem | null>(null);

  // Evaluate the live queue based on current active loans and config leadDays
  const queue = useMemo(() => {
    return evaluateUpcomingPaymentQueue(activeLoans, employees, config.leadDays);
  }, [activeLoans, employees, config.leadDays]);

  // Set default selected alert for preview
  useEffect(() => {
    if (queue.length > 0 && !selectedAlertForPreview) {
      setSelectedAlertForPreview(queue[0]);
    }
  }, [queue, selectedAlertForPreview]);

  // Filtered queue items
  const filteredQueue = useMemo(() => {
    return queue.filter(item => {
      const matchSearch =
        item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.loanNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.branchName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || item.alertStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [queue, searchQuery, statusFilter]);

  // Counts
  const readyToSendCount = queue.filter(q => q.alertStatus === 'READY_TO_SEND').length;
  const alreadySentCount = queue.filter(q => q.alertStatus === 'ALREADY_SENT').length;
  const upcomingCount = queue.filter(q => q.alertStatus === 'UPCOMING').length;

  // Next cutoff date
  const nextCutoff = queue[0]?.deductionDate || '2026-10-15';

  // Toggle scheduler enabled
  const handleToggleScheduler = () => {
    const updated = { ...config, enabled: !config.enabled };
    setConfig(updated);
    saveSchedulerConfig(updated);
    notify(
      updated.enabled ? 'Email Scheduler Activated' : 'Email Scheduler Paused',
      updated.enabled
        ? `Automated recurring emails will trigger 3 days before payroll deduction dates.`
        : 'Automated recurring payment alerts paused by administrator.',
      'INFO',
      undefined,
      undefined,
      'SYSTEM'
    );
  };

  // Save settings form
  const handleUpdateConfig = (newConfig: Partial<SchedulerConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    saveSchedulerConfig(updated);
  };

  // Run automated 3-day sweep now
  const handleTriggerSweep = async () => {
    setIsSweeping(true);
    setSweepResult(null);

    try {
      const res = await runAutomatedUpcomingPaymentSweep({
        activeLoans,
        employees,
        triggerType: 'MANUAL_SWEEP',
        leadDays: config.leadDays,
        notifyInApp: notify,
      });

      setLogs(getSchedulerLogs());
      setSweepResult({
        show: true,
        count: res.sentCount,
        message: res.summary,
        success: res.success,
      });

      notify(
        'Automated Payment Sweep Executed',
        `Dispatched ${res.sentCount} upcoming payment email alerts for deduction date ${nextCutoff}.`,
        'PAYMENT',
        undefined,
        undefined,
        'UPCOMING_PAYMENT'
      );
    } catch (err: any) {
      setSweepResult({
        show: true,
        count: 0,
        message: err?.message || 'Sweep failed to process.',
        success: false,
      });
    } finally {
      setIsSweeping(false);
    }
  };

  // Send single alert to a specific recipient in queue
  const handleSendSingleAlert = async (item: UpcomingPaymentAlertItem) => {
    try {
      await sendGmailNotification({
        toEmail: item.recipientEmail,
        recipientName: item.employeeName,
        title: `Upcoming Payday Loan Deduction Alert (${item.deductionDate})`,
        message: `Semi-monthly payroll deduction of ${formatPHP(item.scheduledAmount)} for ${item.loanProductName} (Loan #${item.loanNumber}) is scheduled in ${item.daysUntilDeduction} days on ${item.deductionDate}. Remaining balance: ${formatPHP(item.totalBalance)}.`,
        category: 'UPCOMING_PAYMENT',
        referenceId: item.loanNumber,
        actorName: 'Admin Email Notification Scheduler',
      });

      // Update in-app notification
      notify(
        'Upcoming Payday Loan Deduction Alert',
        `Semi-monthly installment of ${formatPHP(item.scheduledAmount)} for Loan #${item.loanNumber} is due in ${item.daysUntilDeduction} days (${item.deductionDate}).`,
        'PAYMENT',
        undefined,
        item.employeeId,
        'UPCOMING_PAYMENT',
        'emp-dashboard',
        item.loanNumber,
        'Admin Email Scheduler'
      );

      // Refresh state
      runAutomatedUpcomingPaymentSweep({
        activeLoans,
        employees,
        triggerType: 'MANUAL_SWEEP',
        leadDays: config.leadDays,
      }).then(() => {
        setLogs(getSchedulerLogs());
      });

      notify(
        'Upcoming Payment Alert Dispatched',
        `Successfully sent 3-day reminder email to ${item.employeeName} (${item.recipientEmail}).`,
        'INFO',
        undefined,
        undefined,
        'UPCOMING_PAYMENT'
      );
    } catch (err: any) {
      alert('Failed to send notification: ' + err.message);
    }
  };

  // Send test email preview to admin's inbox
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailInput) return;

    setIsSendingTest(true);
    setTestSendFeedback(null);

    const activeSample = selectedAlertForPreview || queue[0];
    const previewData = generateUpcomingPaymentEmailHtml({
      employeeName: activeSample?.employeeName || 'Juan Dela Cruz',
      employeeNumber: activeSample?.employeeNumber || 'ML-0001',
      loanNumber: activeSample?.loanNumber || 'OPEC-LN-2026-0018',
      loanProductName: activeSample?.loanProductName || 'Commodity Loan',
      scheduledAmount: activeSample?.scheduledAmount || 819.44,
      totalBalance: activeSample?.totalBalance || 19666.72,
      deductionDate: activeSample?.deductionDate || nextCutoff,
      daysRemaining: activeSample?.daysUntilDeduction || 3,
      branchName: activeSample?.branchName || 'ML Molave Branch',
    });

    try {
      const res = await sendGmailNotification({
        toEmail: testEmailInput,
        recipientName: 'Administrator (Preview Mode)',
        title: `[TEST PREVIEW] Upcoming Payday Loan Deduction Notice (${activeSample?.deductionDate || nextCutoff})`,
        message: `[TEST EMAIL] This is a verification preview of the automated upcoming payment advisory sent 3 days prior to payday cutoffs. Scheduled Amount: ${formatPHP(activeSample?.scheduledAmount || 819.44)}. Due Date: ${activeSample?.deductionDate || nextCutoff}.`,
        category: 'UPCOMING_PAYMENT',
        referenceId: activeSample?.loanNumber,
        actorName: 'Admin Scheduler Preview',
      });

      setTestSendFeedback(
        res.success
          ? `Test email dispatched to ${testEmailInput}! Check your inbox or outbox.`
          : `Note: Dispatched to local outbox log (${res.error || 'Simulated delivery'}). Connect Google account for direct live Gmail transmission.`
      );
    } catch (err: any) {
      setTestSendFeedback(`Delivery error: ${err.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Reset sent records so admin can test triggering again
  const handleResetSentStatus = () => {
    if (confirm('Reset sent records for testing? This will set all matching items back to READY_TO_SEND.')) {
      localStorage.removeItem('oagims_sent_payment_alerts');
      notify('Scheduler Cache Cleared', 'Sent status reset. All items in the 3-day window are now ready to trigger.', 'INFO');
      window.location.reload();
    }
  };

  // Live preview HTML content
  const previewItem = selectedAlertForPreview || queue[0];
  const previewEmailContent = useMemo(() => {
    if (!previewItem) return { html: '', text: '', subject: '' };
    return generateUpcomingPaymentEmailHtml({
      employeeName: previewItem.employeeName,
      employeeNumber: previewItem.employeeNumber,
      loanNumber: previewItem.loanNumber,
      loanProductName: previewItem.loanProductName,
      scheduledAmount: previewItem.scheduledAmount,
      totalBalance: previewItem.totalBalance,
      deductionDate: previewItem.deductionDate,
      daysRemaining: previewItem.daysUntilDeduction,
      branchName: previewItem.branchName,
    });
  }, [previewItem]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                OA-GIMS Automated Communications
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                config.enabled
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {config.enabled ? 'Recurring Scheduler: Active' : 'Recurring Scheduler: Paused'}
              </span>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                Lead Time: {config.leadDays} Days Before Cutoff
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
              <Mail className="w-6 h-6 text-amber-500" />
              Upcoming Payment Email Scheduler
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Automated recurring notification engine that scans active loan accounts and triggers official email alerts to employees exactly <strong>{config.leadDays} days prior to their semi-monthly payroll deduction date</strong> (15th & 30th).
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleToggleScheduler}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                config.enabled
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {config.enabled ? (
                <>
                  <Pause className="w-4 h-4 text-amber-600" />
                  Pause Automated Job
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Resume Automated Job
                </>
              )}
            </button>

            <button
              onClick={handleTriggerSweep}
              disabled={isSweeping}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSweeping ? 'animate-spin' : ''}`} />
              {isSweeping ? 'Sweeping Queue...' : 'Run Automated 3-Day Sweep Now'}
            </button>
          </div>
        </div>

        {/* Sweep Feedback Banner */}
        {sweepResult?.show && (
          <div className={`mt-5 p-4 rounded-xl text-xs flex items-center justify-between border ${
            sweepResult.success
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}>
            <div className="flex items-center gap-3">
              {sweepResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <strong className="font-bold text-sm block">
                  {sweepResult.success ? 'Sweep Completed Successfully' : 'Sweep Completed with Warnings'}
                </strong>
                <p className="mt-0.5">{sweepResult.message}</p>
              </div>
            </div>
            <button
              onClick={() => setSweepResult(null)}
              className="text-xs font-bold px-2 py-1 rounded hover:bg-black/5"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Target 3-Day Cutoff</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-slate-900 font-mono">{nextCutoff}</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">15th Cutoff</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Today (Oct 12) = Exactly 3 days before cutoff</p>
          </div>

          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Due for 3-Day Alert</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-amber-950 font-mono">{readyToSendCount}</span>
              <span className="text-[10px] font-bold text-amber-700">Eligible Employees</span>
            </div>
            <p className="text-[10px] text-amber-700 mt-1">Ready to dispatch via Gmail API</p>
          </div>

          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Dispatched This Cycle</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-emerald-950 font-mono">{alreadySentCount}</span>
              <span className="text-[10px] font-bold text-emerald-700">Sent & Logged</span>
            </div>
            <p className="text-[10px] text-emerald-700 mt-1">Recorded in outbox & audit log</p>
          </div>

          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Recurrence Cron Schedule</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-black text-blue-950 font-mono">Daily @ 08:00 AM</span>
            </div>
            <p className="text-[10px] text-blue-700 mt-1">Automated background ticker active</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('QUEUE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeSubTab === 'QUEUE'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Deduction Queue & Alerts
          {readyToSendCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
              {readyToSendCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('PREVIEW')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeSubTab === 'PREVIEW'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-4 h-4" />
          Email Template Preview & Test
        </button>

        <button
          onClick={() => setActiveSubTab('SETTINGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeSubTab === 'SETTINGS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Scheduler Configuration
        </button>

        <button
          onClick={() => setActiveSubTab('LOGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeSubTab === 'LOGS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          Execution Logs & Outbox ({logs.length})
        </button>
      </div>

      {/* SUB-TAB 1: QUEUE & DISPATCH */}
      {activeSubTab === 'QUEUE' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, employee #, loan #, branch..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    statusFilter === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                  }`}
                >
                  All ({queue.length})
                </button>
                <button
                  onClick={() => setStatusFilter('READY_TO_SEND')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    statusFilter === 'READY_TO_SEND' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Ready / T-3 ({readyToSendCount})
                </button>
                <button
                  onClick={() => setStatusFilter('ALREADY_SENT')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    statusFilter === 'ALREADY_SENT' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Sent ({alreadySentCount})
                </button>
                <button
                  onClick={() => setStatusFilter('UPCOMING')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    statusFilter === 'UPCOMING' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                  }`}
                >
                  Upcoming ({upcomingCount})
                </button>
              </div>

              <button
                onClick={handleResetSentStatus}
                title="Reset sent flags to test firing alerts again"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Queue Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Upcoming Semi-Monthly Payroll Deductions Queue
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Employees with upcoming scheduled deductions evaluated against the <strong>3-day alert window</strong>.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                Showing {filteredQueue.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Employee / Recipient</th>
                    <th className="py-3 px-4">Loan Account</th>
                    <th className="py-3 px-4">Deduction Amount</th>
                    <th className="py-3 px-4">Cutoff Payday</th>
                    <th className="py-3 px-4">3-Day Trigger Date</th>
                    <th className="py-3 px-4">Alert Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.map(item => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.alertStatus === 'READY_TO_SEND' ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{item.employeeName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-600">{item.employeeNumber}</span>
                          <span>·</span>
                          <span className="font-mono text-blue-700">{item.recipientEmail}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.branchName}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{item.loanNumber}</div>
                        <div className="text-[11px] text-amber-700 font-medium">{item.loanProductName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Balance: {formatPHP(item.totalBalance)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {formatPHP(item.scheduledAmount)}
                        </div>
                        <div className="text-[10px] text-slate-500">Scheduled deduction</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{item.deductionDate}</div>
                        <div className="text-[11px] font-semibold text-blue-700">
                          {item.daysUntilDeduction === 0
                            ? 'Due today!'
                            : `Due in ${item.daysUntilDeduction} day${item.daysUntilDeduction > 1 ? 's' : ''}`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-700 font-bold">{item.alertTriggerDate}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.daysUntilDeduction <= config.leadDays ? (
                            <span className="text-amber-700 font-bold">Within 3-Day Window</span>
                          ) : (
                            <span>Scheduled</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.alertStatus === 'READY_TO_SEND' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            Ready (T-3 Days)
                          </span>
                        ) : item.alertStatus === 'ALREADY_SENT' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            Alert Dispatched
                          </span>
                        ) : item.alertStatus === 'OVERDUE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                            Cutoff Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            Upcoming Cycle
                          </span>
                        )}
                        {item.lastSentAt && (
                          <div className="text-[9px] text-slate-400 mt-1 font-mono">
                            Sent: {new Date(item.lastSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedAlertForPreview(item);
                              setActiveSubTab('PREVIEW');
                            }}
                            title="Preview formatted email"
                            className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleSendSingleAlert(item)}
                            title="Dispatch alert email now"
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            Send Alert
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredQueue.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        No deduction alerts found matching your search filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EMAIL TEMPLATE PREVIEW & TEST */}
      {activeSubTab === 'PREVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Preview Settings & Live Test Sender */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-500" />
                Dispatch Live Test Alert
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Verify the automated template by dispatching a test Upcoming Payment email to any registered address.
              </p>

              <form onSubmit={handleSendTestEmail} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Recipient Gmail / Email
                  </label>
                  <input
                    type="email"
                    required
                    value={testEmailInput}
                    onChange={e => setTestEmailInput(e.target.value)}
                    placeholder="treasury@opec.aurumgems.org"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Pre-filled with your registered session email.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSendingTest}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-spin' : ''}`} />
                    {isSendingTest ? 'Dispatching...' : 'Send Test Advisory Email'}
                  </button>
                </div>

                {testSendFeedback && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 mt-3">
                    {testSendFeedback}
                  </div>
                )}
              </form>
            </div>

            {/* Select Recipient to Preview */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Select Employee Data for Preview</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {queue.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAlertForPreview(item)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedAlertForPreview?.id === item.id
                        ? 'bg-amber-50/80 border-amber-400 font-medium'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{item.employeeName}</span>
                      <span className="font-mono text-[10px] text-slate-500">{item.loanNumber}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                      <span>{item.loanProductName}</span>
                      <span className="font-bold text-amber-900">{formatPHP(item.scheduledAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Live Responsive Preview of HTML Email */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Device Frame:</span>
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        previewDevice === 'desktop' ? 'bg-slate-900 text-white' : 'text-slate-600'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      Desktop
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        previewDevice === 'mobile' ? 'bg-slate-900 text-white' : 'text-slate-600'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Mobile
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    Subject: {previewEmailContent.subject}
                  </span>
                </div>
              </div>

              {/* Rendered HTML Container */}
              <div className="p-6 bg-slate-950 flex justify-center overflow-x-auto min-h-[500px]">
                <div
                  className={`w-full transition-all duration-300 ${
                    previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-xl'
                  }`}
                >
                  <iframe
                    title="Upcoming Payment Email Preview"
                    srcDoc={previewEmailContent.html}
                    className="w-full h-[620px] rounded-xl border border-slate-800 bg-white shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SCHEDULER SETTINGS */}
      {activeSubTab === 'SETTINGS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                Automated Trigger Rules
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure when and how automated alerts are dispatched to borrowers.
              </p>
            </div>

            {/* Advance Lead Days Setting */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Notification Advance Lead Time
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 5].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleUpdateConfig({ leadDays: days })}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                      config.leadDays === days
                        ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-400/40 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {days} Day{days > 1 ? 's' : ''}
                    {days === 3 && <span className="block text-[9px] font-black uppercase text-amber-950">Recommended</span>}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Current rule: Alerts trigger <strong>{config.leadDays} days before payroll deduction dates</strong> (e.g., Oct 12 alert for Oct 15 payday cutoff).
              </p>
            </div>

            {/* Scheduled Execution Time */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Automated Sweep Time (PHT)
              </label>
              <select
                value={config.scheduledTime}
                onChange={e => handleUpdateConfig({ scheduledTime: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
              >
                <option value="08:00 AM PHT">08:00 AM PHT (Morning Payroll Sweep - Standard)</option>
                <option value="12:00 PM PHT">12:00 PM PHT (Mid-day Sweep)</option>
                <option value="05:00 PM PHT">05:00 PM PHT (End-of-day Reconciliation)</option>
              </select>
            </div>

            {/* Cron Frequency */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Sweep Frequency
              </label>
              <select
                value={config.cronFrequency}
                onChange={e => handleUpdateConfig({ cronFrequency: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
              >
                <option value="DAILY">Daily Recurring Scan (Recommended)</option>
                <option value="TWICE_DAILY">Twice Daily (Morning & Afternoon)</option>
                <option value="HOURLY">Hourly Background Scan (Testing & Demo)</option>
              </select>
            </div>

            {/* CC Admin Email */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.ccAdminEmail}
                  onChange={e => handleUpdateConfig({ ccAdminEmail: e.target.checked })}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  CC Treasury / Payroll Administrator on all automated alerts
                </span>
              </label>
            </div>
          </div>

          {/* Right: Integration & Compliance Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Delivery Channels & Verification
            </h3>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Google Workspace Gmail API:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  isGoogleConnected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {isGoogleConnected ? 'Connected & Verified' : 'Simulated SMTP / Outbox'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Admin Dispatch Email:</span>
                <span className="font-mono text-slate-900">
                  {registeredGmail || googleUser?.email || config.adminEmail}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Deduplication Protection:</span>
                <span className="font-bold text-emerald-700">Active (Max 1 alert per cutoff cycle)</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-2">
              <strong className="block font-bold">📋 Policy Enforcement (Bylaws Sec. 18 & 19):</strong>
              <p className="leading-relaxed text-[11px]">
                Under OPEC lending guidelines, members are entitled to advance notice prior to automatic salary deductions to ensure awareness of their net disposable income and prevent unexpected take-home pay shortfalls.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => openGmailOtpModal({ defaultTab: 'LOGS' })}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-slate-600" />
                View Master Gmail Outbox & Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: EXECUTION LOGS & OUTBOX */}
      {activeSubTab === 'LOGS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                Scheduler Execution Audit Trail
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanent records of every automated sweep and email alert dispatch.
              </p>
            </div>
            <button
              onClick={() => setLogs(getSchedulerLogs())}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh Logs
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {logs.map(log => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {log.status}
                    </span>
                    <span className="font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className="font-semibold text-slate-800">
                      [{log.triggerType === 'AUTOMATED_CRON' ? 'Automated Cron Job' : 'Manual Admin Sweep'}]
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-slate-500">
                      Cutoff: <strong className="font-mono text-slate-800">{log.cutoffDate}</strong>
                    </span>
                    <span className="text-slate-500">
                      Sent: <strong className="font-mono text-emerald-700">{log.sentCount}</strong>
                    </span>
                    <span className="text-slate-500">
                      Skipped: <strong className="font-mono text-slate-600">{log.skippedCount}</strong>
                    </span>
                  </div>
                </div>

                <p className="text-slate-700 mt-1.5">{log.summary}</p>

                {log.recipients.length > 0 && (
                  <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                    <span className="font-bold">Recipients:</span>
                    {log.recipients.map((r, i) => (
                      <span
                        key={i}
                        className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px]"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {logs.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                No execution logs recorded yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
