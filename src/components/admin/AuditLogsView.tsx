import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { History, Search, Filter, Shield, Clock } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');

  const filteredLogs = auditLogs.filter(log => {
    const searchMatch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const entityMatch = selectedEntity === 'all' || log.entityType === selectedEntity;
    return searchMatch && entityMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Immutable Audit Trail</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {auditLogs.length} Security Events
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 46: Real-time logging of credit approvals, loan releases, payroll deductions, and policy updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={selectedEntity}
            onChange={e => setSelectedEntity(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
          >
            <option value="all">All Entity Types</option>
            <option value="LOAN_APPLICATION">Loan Application</option>
            <option value="LOAN_ACCOUNT">Loan Account</option>
            <option value="PAYROLL">Payroll Deduction</option>
            <option value="POLICY">Policy & Settings</option>
            <option value="PROJECT">CSR Project</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Actor / Role</th>
                <th className="py-3 px-3">Action Event</th>
                <th className="py-3 px-3 font-mono">Reference / Target</th>
                <th className="py-3 px-4">Audit Details & Field Diffs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">{log.userName}</span>
                    <span className="font-mono text-[10px] text-amber-700 font-semibold">{log.userRole.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                      log.action.includes('APPROVE') || log.action.includes('RELEASE')
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.action.includes('REJECT')
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {log.entityId}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-700">
                    <div>{log.details}</div>
                    {log.changes && log.changes.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {log.changes.map((c, i) => (
                          <span key={i} className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {c.field}: {c.oldVal} → <strong className="text-slate-900">{c.newVal}</strong>
                          </span>
                        ))}
                      </div>
                    )}
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
