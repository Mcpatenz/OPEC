import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../lib/loans/calculator';
import { LoanDisbursementTrendChart } from './LoanDisbursementTrendChart';
import {
  getSchedulerConfig,
  evaluateUpcomingPaymentQueue,
  runAutomatedUpcomingPaymentSweep,
} from '../../lib/services/schedulerService';
import {
  Users,
  CreditCard,
  Clock,
  HeartHandshake,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowUpRight,
  ShieldAlert,
  Mail,
  RefreshCw,
  Sparkles,
  Send,
  Calendar,
  ChevronRight,
  BellRing,
  Megaphone,
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { employees, applications, activeLoans, csrProjects, payrollDeductions, announcements, notify } = useApp();

  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepToast, setSweepToast] = useState<{ message: string; count: number } | null>(null);

  const schedulerConfig = useMemo(() => getSchedulerConfig(), []);
  const upcomingQueue = useMemo(
    () => evaluateUpcomingPaymentQueue(activeLoans, employees, schedulerConfig.leadDays),
    [activeLoans, employees, schedulerConfig.leadDays]
  );
  const readyForAlertToday = upcomingQueue.filter(q => q.alertStatus === 'READY_TO_SEND');
  const nextCutoffDate = upcomingQueue[0]?.deductionDate || '2026-10-15';

  const handleRunQuickSweep = async () => {
    setIsSweeping(true);
    setSweepToast(null);
    try {
      const res = await runAutomatedUpcomingPaymentSweep({
        activeLoans,
        employees,
        triggerType: 'MANUAL_SWEEP',
        leadDays: schedulerConfig.leadDays,
        notifyInApp: notify,
      });
      setSweepToast({ message: res.summary, count: res.sentCount });
      notify(
        'Automated 3-Day Sweep Executed',
        `Dispatched ${res.sentCount} upcoming payment alerts for ${nextCutoffDate}.`,
        'PAYMENT',
        undefined,
        undefined,
        'UPCOMING_PAYMENT'
      );
      setTimeout(() => setSweepToast(null), 8000);
    } catch (err: any) {
      setSweepToast({ message: 'Sweep failed: ' + err.message, count: 0 });
    } finally {
      setIsSweeping(false);
    }
  };

  const totalMembers = employees.length;
  const pendingApps = applications.filter(
    a => a.status === 'FOR_REVIEW' || a.status === 'CREDIT_COMMITTEE'
  );
  const forReleaseApps = applications.filter(a => a.status === 'FOR_RELEASE');

  const totalOutstandingBalance = activeLoans.reduce((sum, l) => sum + l.balance, 0);
  const totalDisbursed = activeLoans.reduce((sum, l) => sum + l.principal, 0);
  const totalCollections = activeLoans.reduce((sum, l) => sum + l.amountPaid, 0);



  return (
    <div className="space-y-6">
      {/* Top Banner with Official OPEC Header Banner Background */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white border-2 border-amber-500/30 bg-slate-900 shadow-xl">
        {/* Background header banner image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/opec_header_banner_1791532764943.jpg"
            alt="OPEC Header Background"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-30 brightness-110 filter saturate-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950/70" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/src/assets/images/opec_logo_1791532750142.jpg"
              alt="OPEC Aurum Gems Crest Logo"
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-xl ring-2 ring-amber-500/30 shrink-0 hidden sm:block"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  OA-GIMS Executive Portal
                </span>
                <span className="text-xs font-semibold text-amber-400">
                  ZASURMIS Region
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  · M Lhuillier Tulay ng PaMLyang Pilipino
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mt-1">
                OPEC Aurum Gems Management System
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Consolidated command center for organization membership, credit committee approval pipeline, semi-monthly payroll deductions (15th & 30th), and CSR community initiatives.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('admin-loan-approvals')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              Credit Committee ({pendingApps.length})
            </button>
            <button
              onClick={() => setActiveTab('admin-payroll-deductions')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg border border-slate-700 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Payroll Deductions
            </button>
            <button
              onClick={() => setActiveTab('admin-announcements')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg border border-slate-700 shadow-sm transition-all cursor-pointer"
            >
              <Megaphone className="w-4 h-4 text-amber-400" />
              Announcements ({announcements.length})
            </button>
            <button
              onClick={() => setActiveTab('admin-csr-projects')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg border border-slate-700 shadow-sm transition-all cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4 text-rose-400" />
              OPEC Activities ({csrProjects.length})
            </button>
            <button
              onClick={() => setActiveTab('admin-email-scheduler')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/40 shadow-sm transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4 text-amber-400" />
              Email Scheduler
              {readyForAlertToday.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                  {readyForAlertToday.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards (Matches Section 6 of Specification) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Members */}
        <div
          onClick={() => setActiveTab('admin-members')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Members</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">1,250</span>
            <span className="text-xs font-bold text-emerald-600">+18 this mo</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across Region 10 & 9 · {totalMembers} recorded in registry
          </p>
        </div>

        {/* Active Loans */}
        <div
          onClick={() => setActiveTab('admin-active-loans')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Loans</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">183</span>
            <span className="text-xs font-mono font-semibold text-slate-500">accounts</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Outstanding: <span className="font-mono font-bold text-slate-800">{formatPHP(totalOutstandingBalance)}</span>
          </p>
        </div>

        {/* Pending Approval */}
        <div
          onClick={() => setActiveTab('admin-loan-approvals')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Committee</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{pendingApps.length}</span>
            <span className="text-xs font-semibold text-amber-700">action required</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {forReleaseApps.length} ready for releasing disbursement
          </p>
        </div>

        {/* CSR Projects */}
        <div
          onClick={() => setActiveTab('admin-csr-projects')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">CSR Projects</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">86</span>
            <span className="text-xs font-semibold text-rose-600">outreaches YTD</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Brigada Eskwela · Coastal Cleanup · Medical
          </p>
        </div>
      </div>

      {/* Main Charts & Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Loan Disbursement Trends Line Chart using Recharts */}
        <div className="lg:col-span-2">
          <LoanDisbursementTrendChart
            onViewDisbursements={() => setActiveTab('admin-loan-releasing')}
            onViewReports={() => setActiveTab('admin-reports')}
          />
        </div>

        {/* Collections vs Outstanding Balance */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Collections / Outstanding</h2>
                <p className="text-xs text-slate-500">Semi-monthly payroll recovery rate</p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="space-y-4 mt-5">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Total Disbursed:</span>
                  <span className="font-mono font-bold text-slate-800">{formatPHP(totalDisbursed)}</span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-800 font-semibold">Total Collections (Payroll):</span>
                  <span className="font-mono font-bold text-emerald-700">{formatPHP(totalCollections)}</span>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/50 rounded-lg border border-amber-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-800 font-semibold">Current Portfolio Balance:</span>
                  <span className="font-mono font-bold text-amber-700">{formatPHP(totalOutstandingBalance)}</span>
                </div>
              </div>

              {/* Recovery Rate Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Recovery Efficiency</span>
                  <span className="text-emerald-700 font-bold">98.4%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '98.4%' }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Automatic salary deduction ensures minimal past due</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('admin-reports')}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              View Full Aging & Audit Reports
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Executive Recurring Email Notification Scheduler Widget */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-2xl border-2 border-amber-500/30 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Recurring Email Scheduler
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active (Daily @ 08:00 AM PHT)
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-200 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                Rule: Automated Alerts 3 Days Before Cutoff
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-400" />
              Upcoming Payment Automated Email Scheduler
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Monitors active loan deduction schedules and triggers official email alerts to employees exactly <strong>3 days prior to their payroll deduction date</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={handleRunQuickSweep}
              disabled={isSweeping}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSweeping ? 'animate-spin' : ''}`} />
              {isSweeping ? 'Sweeping...' : 'Run Automated 3-Day Sweep Now'}
            </button>
            <button
              onClick={() => setActiveTab('admin-email-scheduler')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-750 text-white rounded-xl border border-slate-700 shadow-sm transition-all cursor-pointer"
            >
              Manage Scheduler
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sweep Feedback Banner */}
        {sweepToast && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{sweepToast.message}</span>
            </div>
            <button onClick={() => setSweepToast(null)} className="text-[11px] underline text-emerald-400 hover:text-emerald-300">
              Dismiss
            </button>
          </div>
        )}

        {/* 3-Day Queue Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Upcoming Payday Cutoff</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-amber-400 font-mono">{nextCutoffDate}</span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded">15th Cutoff</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Alert Trigger Date: <strong className="text-white font-mono">Today (Oct 12)</strong> = T-3 Days
            </p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Eligible Employees Due for 3-Day Alert Today ({readyForAlertToday.length})
              </span>
              <button
                onClick={() => setActiveTab('admin-email-scheduler')}
                className="text-[11px] font-bold text-amber-400 hover:underline"
              >
                View Full Queue →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {readyForAlertToday.slice(0, 2).map(item => (
                <div key={item.id} className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{item.employeeName}</div>
                    <div className="text-[10px] text-slate-400">{item.branchName} · {item.loanProductName}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-400">{formatPHP(item.scheduledAmount)}</span>
                    <div className="text-[9px] text-emerald-400 font-bold">Ready to dispatch</div>
                  </div>
                </div>
              ))}
              {readyForAlertToday.length === 0 && (
                <div className="col-span-2 text-xs text-slate-400 italic py-2">
                  All eligible alerts for cutoff {nextCutoffDate} have been dispatched or logged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Tables & Committee Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Committee Pipeline */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Urgent Committee Applications</h2>
            </div>
            <button
              onClick={() => setActiveTab('admin-loan-approvals')}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              View All ({applications.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {applications.slice(0, 3).map(app => {
              const borrower = employees.find(e => e.id === app.employeeId);
              return (
                <div key={app.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">{app.applicationNo}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-900">{borrower?.firstName} {borrower?.lastName}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">{app.purpose}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900">{formatPHP(app.requestedAmount)}</span>
                    <div className="mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        app.status === 'FOR_RELEASE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'CREDIT_COMMITTEE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Payroll Deduction Preview */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Upcoming Payday Deductions (Oct 15)</h2>
            </div>
            <button
              onClick={() => setActiveTab('admin-payroll-deductions')}
              className="text-xs font-bold text-blue-700 hover:underline"
            >
              Manage ({payrollDeductions.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {payrollDeductions.slice(0, 3).map(item => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{item.employeeName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({item.employeeNumber})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.branchName} · Payday: {item.payrollPeriod}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">{formatPHP(item.scheduledAmount)}</span>
                  <div className="mt-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.status === 'POSTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'PARTIAL'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
