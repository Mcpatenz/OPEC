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
} from 'lucide-react';

export const MyProfileView: React.FC = () => {
  const { currentUser, employees, branches, areas, regions, applications, activeLoans } = useApp();

  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const branch = branches.find(b => b.id === applicant.branchId);
  const area = areas.find(a => a.id === applicant.areaId);
  const region = regions.find(r => r.id === applicant.regionId);
  const service = calculateYearsOfService(applicant.dateHired);

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
    </div>
  );
};
