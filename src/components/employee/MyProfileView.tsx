import React from 'react';
import { useApp } from '../../context/AppContext';
import { calculateYearsOfService } from '../../lib/loans/eligibility';
import { formatPHP } from '../../lib/loans/calculator';
import {
  User,
  Building,
  Calendar,
  ShieldCheck,
  CreditCard,
  FileText,
  Users2,
  CheckCircle2,
  Coins,
} from 'lucide-react';
import { evaluateEmployeeCbu } from '../../lib/cbu/cbuCalculator';

export const MyProfileView: React.FC = () => {
  const { currentUser, employees, branches, areas, regions, applications, activeLoans } = useApp();

  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const branch = branches.find(b => b.id === applicant.branchId);
  const area = areas.find(a => a.id === applicant.areaId);
  const region = regions.find(r => r.id === applicant.regionId);
  const service = calculateYearsOfService(applicant.dateHired);
  const cbu = evaluateEmployeeCbu(applicant);

  // Guarantees where applicant is co-maker
  const myGuarantees = applications.filter(a =>
    a.coMakers.some(cm => cm.employeeId === applicant.id)
  );

  return (
    <div className="space-y-6">
      {/* Profile Card Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-500 shadow-sm shrink-0">
              {applicant.avatarUrl ? (
                <img src={applicant.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-2xl">
                  {applicant.firstName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {applicant.firstName} {applicant.middleName || ''} {applicant.lastName}
                </h1>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {applicant.employeeNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{applicant.position}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  OPEC {applicant.opecPosition || 'Member'}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {applicant.employmentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Calculated Service Strip (Section 8 of specification) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 block">Date Hired</span>
            <span className="font-bold text-slate-800 text-sm">{applicant.dateHired}</span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-emerald-800 block font-medium">Computed Tenure</span>
            <span className="font-bold text-emerald-700 text-sm font-mono">{service.formatted}</span>
            <span className="block text-[10px] text-emerald-600 mt-0.5">({service.totalDecimalYears} years)</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 block">Branch Assignment</span>
            <span className="font-bold text-slate-800 text-sm">{branch?.name}</span>
            <span className="block text-[10px] text-slate-400">{area?.name}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 block">Monthly Salary</span>
            <span className="font-bold text-slate-900 text-sm font-mono">{formatPHP(applicant.monthlySalary)}</span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Contact and Station Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
            Organizational Station & Contacts
          </h2>
          <div className="space-y-2 text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Corporate Email:</span>
              <span className="font-mono text-slate-800">{applicant.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Contact Number:</span>
              <span className="text-slate-800">{applicant.contactNumber}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Residential Address:</span>
              <span className="text-slate-800 text-right max-w-xs">{applicant.address}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Region & Area:</span>
              <span className="text-slate-800">{region?.name} · {area?.name}</span>
            </div>
          </div>
        </div>

        {/* Co-Maker Commitments / Guarantees Active */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Guarantor Undertakings ({myGuarantees.length})</span>
            <span className="text-[10px] text-emerald-700 font-semibold">Eligible Co-Maker</span>
          </h2>

          {myGuarantees.length === 0 ? (
            <p className="text-slate-400 py-4 text-center">You are not currently co-maker for any active loans.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {myGuarantees.map(g => {
                const borrower = employees.find(e => e.id === g.employeeId);
                return (
                  <div key={g.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {borrower?.firstName} {borrower?.lastName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{g.applicationNo}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">{formatPHP(g.requestedAmount)}</span>
                      <span className="block text-[10px] text-amber-700 font-medium">{g.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Capital Build-Up (CBU) & 10% Retainers Fee Equity Box */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-amber-300/80 dark:border-amber-600/30 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                Capital Build-Up (CBU) & Separation Retainers Reserve
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Mandatory member equity at ₱100.00/payday (₱200/month)
              </p>
            </div>
          </div>
          <span className="text-xs font-bold font-mono px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            {cbu.paydaysCount} Paydays Logged
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-amber-50/70 dark:bg-slate-700/50 rounded-xl border border-amber-200/80 dark:border-slate-600">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">
              Total Accumulated CBU
            </span>
            <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
              {formatPHP(cbu.totalCbu)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
              ₱100/payday semi-monthly
            </span>
          </div>

          <div className="p-3 bg-rose-50/70 dark:bg-slate-700/50 rounded-xl border border-rose-200/80 dark:border-slate-600">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">
              10% Retainer's Fee (OPEC)
            </span>
            <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {formatPHP(cbu.retainersFee)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
              Given to OPEC upon resignation/AWOL/removal
            </span>
          </div>

          <div className="p-3 bg-emerald-50/70 dark:bg-slate-700/50 rounded-xl border border-emerald-200/80 dark:border-slate-600">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">
              90% Net Refundable Equity
            </span>
            <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {formatPHP(cbu.netRefundableCbu)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
              Refundable upon clearance
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
          <strong>Cooperative Separation Policy:</strong> Every employee contributes ₱100 per payday for CBU. Total CBU is subject to a 10% retainers fee given to OPEC if the employee resigns, is AWOL, or is removed from office or work. The remaining 90% is claimable upon complete clearance.
        </div>
      </div>
    </div>
  );
};
