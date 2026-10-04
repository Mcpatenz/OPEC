import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../lib/loans/calculator';
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
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { employees, applications, activeLoans, csrProjects, payrollDeductions } = useApp();

  const totalMembers = employees.length;
  const pendingApps = applications.filter(
    a => a.status === 'FOR_REVIEW' || a.status === 'CREDIT_COMMITTEE'
  );
  const forReleaseApps = applications.filter(a => a.status === 'FOR_RELEASE');

  const totalOutstandingBalance = activeLoans.reduce((sum, l) => sum + l.balance, 0);
  const totalDisbursed = activeLoans.reduce((sum, l) => sum + l.principal, 0);
  const totalCollections = activeLoans.reduce((sum, l) => sum + l.amountPaid, 0);

  // Monthly loan releases mock data
  const monthlyReleases = [
    { month: 'May 2026', amount: 280000, count: 14 },
    { month: 'Jun 2026', amount: 350000, count: 18 },
    { month: 'Jul 2026', amount: 410000, count: 22 },
    { month: 'Aug 2026', amount: 390000, count: 19 },
    { month: 'Sep 2026', amount: 480000, count: 26 },
    { month: 'Oct 2026 (Est)', amount: 520000, count: 28 },
  ];

  const maxMonthAmt = Math.max(...monthlyReleases.map(m => m.amount));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                OA-GIMS Executive Portal
              </span>
              <span className="text-xs text-slate-400">Ozamiz & Pagadian Chapters</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              OPEC Aurum Gems Management System
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Consolidated command center for organization membership, credit committee approval pipeline, semi-monthly payroll deductions, and CSR community projects.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('admin-loan-approvals')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
            >
              <Clock className="w-4 h-4" />
              Credit Committee ({pendingApps.length})
            </button>
            <button
              onClick={() => setActiveTab('admin-payroll-deductions')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Payroll Deductions
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
        {/* Monthly Releases Bar Visualizer */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Loan Releases by Month</h2>
              <p className="text-xs text-slate-500">Historical monthly disbursements across all loan facilities</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-amber-700">₱2,430,000</span>
              <p className="text-[10px] text-slate-400">Total H2 Volume</p>
            </div>
          </div>

          <div className="pt-6 pb-2">
            <div className="grid grid-cols-6 gap-3 items-end h-48">
              {monthlyReleases.map(m => {
                const heightPercent = Math.round((m.amount / maxMonthAmt) * 100);
                return (
                  <div key={m.month} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatPHP(m.amount).replace('.00', '')}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-slate-800 to-amber-500 rounded-t-md group-hover:from-amber-600 group-hover:to-amber-400 transition-all shadow-xs"
                    />
                    <div className="text-center">
                      <span className="text-[11px] font-bold text-slate-700 block truncate w-16">
                        {m.month.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {m.count} loans
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Interest rate standard: 1.5% flat / month</span>
            <span>Terms: 6 to 24 months semi-monthly</span>
          </div>
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
