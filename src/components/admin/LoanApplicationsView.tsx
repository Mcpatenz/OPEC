import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LoanApplication } from '../../types';
import { formatPHP } from '../../lib/loans/calculator';
import { calculateYearsOfService } from '../../lib/loans/eligibility';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  User,
  ArrowRight,
  Eye,
} from 'lucide-react';

interface ApplicationsViewProps {
  onOpenCreditCommittee: () => void;
}

export const LoanApplicationsView: React.FC<ApplicationsViewProps> = ({ onOpenCreditCommittee }) => {
  const { applications, employees, branches, loanProducts } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);

  const filtered = applications.filter(app => {
    const borrower = employees.find(e => e.id === app.employeeId);
    const searchMatch =
      app.applicationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${borrower?.firstName} ${borrower?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = statusFilter === 'all' || app.status === statusFilter;
    return searchMatch && statusMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Loan Applications Pipeline</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              {applications.length} Total Submissions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 11 & 12: Comprehensive loan application intake, validation status, co-maker attachments, and decision states.
          </p>
        </div>

        <button
          onClick={onOpenCreditCommittee}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
        >
          <Clock className="w-4 h-4" />
          Open Committee Review Board
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Application # or Applicant Name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
        >
          <option value="all">All Statuses</option>
          <option value="FOR_REVIEW">FOR_REVIEW</option>
          <option value="CREDIT_COMMITTEE">CREDIT_COMMITTEE</option>
          <option value="FOR_RELEASE">FOR_RELEASE</option>
          <option value="RELEASED">RELEASED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Application #</th>
                <th className="py-3 px-3">Applicant</th>
                <th className="py-3 px-3">Branch</th>
                <th className="py-3 px-3">Facility</th>
                <th className="py-3 px-3 font-mono">Amount</th>
                <th className="py-3 px-3">Term</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(app => {
                const borrower = employees.find(e => e.id === app.employeeId);
                const branch = branches.find(b => b.id === borrower?.branchId);
                const prod = loanProducts.find(p => p.id === app.loanProductId);

                return (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{app.applicationNo}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900">{borrower?.firstName} {borrower?.lastName}</span>
                      <span className="block text-[11px] text-slate-400 font-mono">{borrower?.employeeNumber}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{branch?.name}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{prod?.name}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{formatPHP(app.requestedAmount)}</td>
                    <td className="py-3 px-3">{app.termMonths} mos</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        app.status === 'RELEASED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'FOR_RELEASE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : app.status === 'CREDIT_COMMITTEE'
                          ? 'bg-amber-100 text-amber-800'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={onOpenCreditCommittee}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Dossier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
