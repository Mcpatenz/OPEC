import React from 'react';
import { useApp } from '../../context/AppContext';
import { calculateYearsOfService } from '../../lib/loans/eligibility';
import { formatPHP } from '../../lib/loans/calculator';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  HeartHandshake,
  FilePlus,
  ShieldCheck,
  TrendingDown,
  Building,
  ArrowRight,
  Receipt,
} from 'lucide-react';

interface EmpDashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenApply: () => void;
}

export const EmployeeDashboard: React.FC<EmpDashboardProps> = ({ setActiveTab, onOpenApply }) => {
  const { currentUser, employees, branches, applications, activeLoans, payrollDeductions, csrProjects } = useApp();

  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const branch = branches.find(b => b.id === applicant.branchId);
  const service = calculateYearsOfService(applicant.dateHired);

  // Filter applicant's own applications and loans
  const myApplications = applications.filter(a => a.employeeId === applicant.id);
  const myLoans = activeLoans.filter(l => l.employeeId === applicant.id);
  const myTotalBalance = myLoans.reduce((sum, l) => sum + l.balance, 0);

  // Next deduction
  const myUpcomingDeduction = payrollDeductions.find(
    d => d.employeeId === applicant.id && d.status === 'SCHEDULED'
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 shrink-0">
              {applicant.avatarUrl ? (
                <img src={applicant.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center font-bold text-lg">
                  {applicant.firstName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  {applicant.employeeNumber}
                </span>
                <span className="text-xs font-semibold text-emerald-400">
                  OPEC {applicant.opecPosition || 'Member'}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white mt-1">
                Welcome, {applicant.firstName} {applicant.lastName}
              </h1>
              <p className="text-xs text-slate-300">
                {applicant.position} · {branch?.name || 'Main Branch'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenApply}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl shadow-md transition-all active:scale-95"
            >
              <FilePlus className="w-4 h-4" />
              Apply for OPEC Loan
            </button>
          </div>
        </div>

        {/* Tenure & Eligibility strip */}
        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Calculated Service Tenure:</span>
            <span className="font-bold text-amber-300 font-mono text-sm">{service.formatted}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Employment Status:</span>
            <span className="font-bold text-emerald-400">{applicant.employmentStatus}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Maximum Credit Capacity:</span>
            <span className="font-bold text-white font-mono">₱30,000.00</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Co-Maker Eligibility:</span>
            <span className="font-bold text-emerald-400">QUALIFIED (≥5 Yrs)</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Next Payday Salary Deduction */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Next Salary Deduction</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">
            {myUpcomingDeduction ? formatPHP(myUpcomingDeduction.scheduledAmount) : '₱0.00'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Cutoff Payday: <strong className="text-slate-800">{myUpcomingDeduction?.payrollPeriod || 'Oct 15, 2026'}</strong>
          </p>
        </div>

        {/* Total Outstanding Loan Balance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Loan Balance</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">
            {formatPHP(myTotalBalance)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {myLoans.length} active credit facility accounts
          </p>
        </div>

        {/* Applications in Pipeline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Applications Pipeline</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {myApplications.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {myApplications.filter(a => a.status === 'CREDIT_COMMITTEE').length} awaiting Credit Committee
          </p>
        </div>
      </div>

      {/* Applications & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* My Applications Progress Tracker */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">My Loan Applications</h2>
            <button
              onClick={() => setActiveTab('emp-applications')}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              View All ({myApplications.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {myApplications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                You have no active loan applications submitted.
              </div>
            ) : (
              myApplications.map(app => (
                <div key={app.id} className="py-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{app.applicationNo}</span>
                      <span className="text-slate-400 text-[11px] ml-2">{app.submittedAt?.split('T')[0]}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      app.status === 'FOR_RELEASE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.status === 'CREDIT_COMMITTEE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span className="truncate max-w-xs">{app.purpose}</span>
                    <span className="font-mono font-bold text-slate-900">{formatPHP(app.requestedAmount)}</span>
                  </div>

                  {/* Multi-role sign-off pills */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {app.approvals.map(apr => (
                      <span
                        key={apr.id}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          apr.decision === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {apr.title.split(' ')[0]}: {apr.decision}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming CSR Outreaches */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">OPEC Community Activities</h2>
            <button
              onClick={() => setActiveTab('emp-activities')}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              Volunteer Roster
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {csrProjects.slice(0, 2).map(proj => (
              <div key={proj.id} className="py-3.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{proj.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {proj.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{proj.location}</p>
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span>Coordinator: {proj.projectLeader}</span>
                  <span className="text-amber-700 font-semibold">{proj.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
