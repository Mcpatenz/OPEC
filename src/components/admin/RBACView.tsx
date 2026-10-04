import React from 'react';
import { ShieldCheck, Check, Minus } from 'lucide-react';

export const RBACView: React.FC = () => {
  const rbacMatrix = [
    { module: 'Members Management', president: 'CRUD', treasurer: 'R', auditor: 'R', payroll: 'R', loanOfficer: 'R', member: 'Own' },
    { module: 'Loan Applications', president: 'Approve', treasurer: 'Manage', auditor: 'Audit', payroll: 'Deduct', loanOfficer: 'CRUD', member: 'Own' },
    { module: 'Co-Makers Verification', president: 'Approve', treasurer: 'R', auditor: 'R', payroll: 'R', loanOfficer: 'CRUD', member: 'Own' },
    { module: 'Loan Releases & Receipts', president: 'Approve', treasurer: 'CRUD', auditor: 'R', payroll: 'R', loanOfficer: 'Process', member: 'Own' },
    { module: 'Repayments & Cash', president: 'R', treasurer: 'CRUD', auditor: 'Audit', payroll: 'Import', loanOfficer: 'CRUD', member: 'Own' },
    { module: 'Payroll Deductions', president: 'R', treasurer: 'R', auditor: 'Audit', payroll: 'CRUD', loanOfficer: 'R', member: 'Own' },
    { module: 'Community CSR Projects', president: 'CRUD', treasurer: 'R', auditor: 'R', payroll: 'R', loanOfficer: 'R', member: 'Participate' },
    { module: 'Donations & Counterparts', president: 'R', treasurer: 'CRUD', auditor: 'Audit', payroll: 'R', loanOfficer: 'R', member: '—' },
    { module: 'Reports & Analytics', president: 'Full', treasurer: 'Financial', auditor: 'Audit', payroll: 'Payroll', loanOfficer: 'Loans', member: 'Own' },
    { module: 'Settings & Loan Policies', president: 'Limited', treasurer: 'Limited', auditor: '—', payroll: 'Payroll', loanOfficer: 'Loans', member: '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <h1 className="text-lg font-bold text-slate-900">Role-Based Access Control (RBAC) Matrix</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Section 4: Enforced permissions across organizational roles and functional modules.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">System Module</th>
                <th className="py-3 px-3">OPEC President</th>
                <th className="py-3 px-3">Treasurer</th>
                <th className="py-3 px-3">Auditor</th>
                <th className="py-3 px-3">Payroll Master</th>
                <th className="py-3 px-3">Loan Officer</th>
                <th className="py-3 px-4">Member Portal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rbacMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{row.module}</td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {row.president}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {row.treasurer}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {row.auditor}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {row.payroll}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {row.loanOfficer}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {row.member}
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
