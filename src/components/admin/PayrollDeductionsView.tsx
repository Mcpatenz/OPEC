import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PayrollDeductionEntry } from '../../types';
import { formatPHP } from '../../lib/loans/calculator';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  DollarSign,
  TrendingDown,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

export const PayrollDeductionsView: React.FC = () => {
  const { payrollDeductions, postPayrollDeduction, batchPostPayroll } = useApp();

  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<PayrollDeductionEntry | null>(null);
  const [actualDeductionInput, setActualDeductionInput] = useState<number>(0);
  const [deductionRemarks, setDeductionRemarks] = useState<string>('');

  const uniquePeriods = Array.from(new Set(payrollDeductions.map(d => d.payrollPeriod)));

  const filteredDeductions = payrollDeductions.filter(d => {
    if (selectedPeriod === 'all') return true;
    return d.payrollPeriod === selectedPeriod;
  });

  const scheduledTotal = filteredDeductions.reduce((sum, d) => sum + d.scheduledAmount, 0);
  const actualTotal = filteredDeductions
    .filter(d => d.status === 'POSTED' || d.status === 'PARTIAL')
    .reduce((sum, d) => sum + d.deductedAmount, 0);

  const pendingCount = filteredDeductions.filter(d => d.status === 'SCHEDULED').length;

  const handleOpenDeductModal = (entry: PayrollDeductionEntry) => {
    setSelectedEntry(entry);
    setActualDeductionInput(entry.scheduledAmount);
    setDeductionRemarks(entry.remarks || '');
  };

  const handleConfirmDeduction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    postPayrollDeduction(selectedEntry.id, actualDeductionInput, deductionRemarks);
    setSelectedEntry(null);
  };

  const handleExportCSV = () => {
    const headers = ['Employee #', 'Employee Name', 'Branch', 'Payroll Period', 'Scheduled', 'Deducted', 'Difference', 'Status', 'Payroll Ref', 'Remarks'];
    const rows = filteredDeductions.map(d => [
      d.employeeNumber,
      `"${d.employeeName}"`,
      `"${d.branchName}"`,
      d.payrollPeriod,
      d.scheduledAmount,
      d.deductedAmount,
      d.difference,
      d.status,
      d.payrollReference,
      `"${d.remarks || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OPEC_Payroll_Deductions_${selectedPeriod || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Payroll Deduction Master Desk</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Payday Cutoffs: 15th & 30th
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 18 & 19: Automatic salary deduction reconciliation, partial deduction shortfall tracking, and posting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            Export Remittance CSV
          </button>
          {selectedPeriod !== 'all' && pendingCount > 0 && (
            <button
              onClick={() => batchPostPayroll(selectedPeriod)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Batch Post ({pendingCount})
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500">Filter Payroll Period:</span>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
          >
            <option value="all">All Payday Periods</option>
            {uniquePeriods.map(p => (
              <option key={p} value={p}>
                Payday: {p}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500">Scheduled Deductions</span>
          <p className="text-lg font-mono font-bold text-slate-900 mt-0.5">{formatPHP(scheduledTotal)}</p>
          <span className="text-[10px] text-slate-400">{filteredDeductions.length} installments scheduled</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500">Posted Recoveries</span>
          <p className="text-lg font-mono font-bold text-emerald-700 mt-0.5">{formatPHP(actualTotal)}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Credited to Loan Balances</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500">Pending Execution</span>
          <p className="text-lg font-bold text-amber-700 mt-0.5">{pendingCount}</p>
          <span className="text-[10px] text-slate-400">Awaiting Payroll Master sign-off</span>
        </div>
      </div>

      {/* Deductions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Branch</th>
                <th className="py-3 px-3">Period</th>
                <th className="py-3 px-3 font-mono">Scheduled</th>
                <th className="py-3 px-3 font-mono">Actual Deducted</th>
                <th className="py-3 px-3">Shortfall / Diff</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeductions.map(entry => {
                const hasShortfall = entry.difference < 0;

                return (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{entry.employeeName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{entry.employeeNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{entry.branchName}</td>
                    <td className="py-3 px-3 font-mono">{entry.payrollPeriod}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      {formatPHP(entry.scheduledAmount)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {formatPHP(entry.deductedAmount)}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {hasShortfall ? (
                        <span className="text-rose-600 font-bold">
                          {formatPHP(entry.difference)}
                        </span>
                      ) : (
                        <span className="text-slate-400">₱0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        entry.status === 'POSTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : entry.status === 'PARTIAL'
                          ? 'bg-rose-100 text-rose-800'
                          : entry.status === 'MISSED'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDeductModal(entry)}
                        className="px-3 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        {entry.status === 'SCHEDULED' ? 'Process Deduction' : 'Reconcile'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partial / Shortfall Adjustment Modal (Section 19 of specification) */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form
            onSubmit={handleConfirmDeduction}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  Payroll Deduction Reconciliation
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedEntry.employeeName} ({selectedEntry.employeeNumber})
                </h3>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Installment:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatPHP(selectedEntry.scheduledAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payroll Cutoff:</span>
                <span className="font-semibold text-slate-800">{selectedEntry.payrollPeriod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Branch:</span>
                <span className="text-slate-800">{selectedEntry.branchName}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Actual Amount Deducted from Salary *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={actualDeductionInput}
                onChange={e => setActualDeductionInput(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm font-bold text-slate-900"
              />
              {actualDeductionInput < selectedEntry.scheduledAmount && (
                <div className="mt-2 p-2.5 bg-rose-50 rounded border border-rose-200 text-rose-800 text-[11px] flex items-center justify-between">
                  <span>Partial payment detected: Shortfall</span>
                  <span className="font-mono font-bold">
                    {formatPHP(selectedEntry.scheduledAmount - actualDeductionInput)}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Payroll Master Remarks / Audit Note
              </label>
              <textarea
                rows={2}
                value={deductionRemarks}
                onChange={e => setDeductionRemarks(e.target.value)}
                placeholder="Reason for partial payment (e.g. tax adjustments, unpaid leaves)..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
              >
                Post Deduction to Loan Balance
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
