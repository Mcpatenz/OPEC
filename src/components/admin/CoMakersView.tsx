import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateYearsOfService } from '../../lib/loans/eligibility';
import { formatPHP } from '../../lib/loans/calculator';
import {
  Users2,
  CheckCircle2,
  AlertCircle,
  Search,
  ShieldCheck,
  User,
} from 'lucide-react';

export const CoMakersView: React.FC = () => {
  const { employees, branches, applications, activeLoans } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate co-maker commitments for each employee
  const coMakerAnalysis = employees.map(emp => {
    const service = calculateYearsOfService(emp.dateHired);
    const branch = branches.find(b => b.id === emp.branchId);

    // Count commitments in pending applications
    const pendingCommitments = applications
      .filter(a => a.status === 'FOR_REVIEW' || a.status === 'CREDIT_COMMITTEE')
      .filter(a => a.coMakers.some(cm => cm.employeeId === emp.id));

    // Count commitments in active loans
    const activeCommitments = applications
      .filter(a => a.status === 'RELEASED')
      .filter(a => a.coMakers.some(cm => cm.employeeId === emp.id));

    const totalCommitments = pendingCommitments.length + activeCommitments.length;
    const isServiceEligible = service.totalDecimalYears >= 5;
    const isStatusEligible = emp.employmentStatus === 'PERMANENT';

    return {
      employee: emp,
      branchName: branch?.name || 'Main Branch',
      service,
      isServiceEligible,
      isStatusEligible,
      totalCommitments,
      pendingCommitments,
      activeCommitments,
      eligibleAsCoMaker: isServiceEligible && isStatusEligible,
    };
  });

  const filtered = coMakerAnalysis.filter(item => {
    return (
      `${item.employee.firstName} ${item.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.branchName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Co-Makers Registry & Commitment Tracker</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              OPEC Policy: ≥ 5 Years Service
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 13: Prevent guarantor over-leveraging, ensure strict 5-year tenure criteria, and monitor active exposure.
          </p>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search co-maker..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Branch</th>
                <th className="py-3 px-3">Tenure / Service</th>
                <th className="py-3 px-3">Eligibility Criteria</th>
                <th className="py-3 px-3 text-center">Active Guarantees</th>
                <th className="py-3 px-3 text-center">Pending Approvals</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(row => (
                <tr key={row.employee.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">{row.employee.firstName} {row.employee.lastName}</span>
                    <span className="block text-[11px] text-slate-400 font-mono">{row.employee.employeeNumber} · {row.employee.position}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{row.branchName}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-emerald-700">{row.service.formatted}</span>
                    <span className="block text-[10px] text-slate-400">Hired {row.employee.dateHired}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="space-y-0.5 text-[11px]">
                      <div className="flex items-center gap-1">
                        {row.isStatusEligible ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span>Permanent Status</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {row.isServiceEligible ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span>≥ 5 Years in Company</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                    {row.activeCommitments.length}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-amber-700">
                    {row.pendingCommitments.length}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded ${
                      row.eligibleAsCoMaker
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {row.eligibleAsCoMaker ? 'QUALIFIED CO-MAKER' : 'INELIGIBLE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
