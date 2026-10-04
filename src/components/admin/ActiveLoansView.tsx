import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LoanAccount } from '../../types';
import { formatPHP } from '../../lib/loans/calculator';
import {
  BadgeDollarSign,
  Search,
  Calendar,
  CreditCard,
  CheckCircle2,
  DollarSign,
  FileText,
  Printer,
  X,
  Award,
} from 'lucide-react';
import { LoanClearancePrint } from '../documents/LoanClearancePrint';

export const ActiveLoansView: React.FC = () => {
  const { activeLoans, employees, branches, loanProducts, recordManualPayment } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<LoanAccount | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(1000);
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentRemarks, setPaymentRemarks] = useState<string>('Direct cash payment at branch counter');
  const [showClearance, setShowClearance] = useState<LoanAccount | null>(null);

  const filteredLoans = activeLoans.filter(l => {
    const borrower = employees.find(e => e.id === l.employeeId);
    return (
      l.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${borrower?.firstName} ${borrower?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handlePostDirectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || paymentAmount <= 0) return;

    recordManualPayment(selectedLoan.id, paymentAmount, paymentRef || `OTC-${Date.now()}`, paymentRemarks);
    setShowPaymentModal(false);
    // Refresh selected loan from updated state
    setSelectedLoan(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Active Loan Accounts & Amortization</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {activeLoans.length} Active Accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 16 & 17: Amortization schedules, semi-monthly balances, repayments ledger, and loan clearance.
          </p>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Loan # or Borrower..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Loans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLoans.map(loan => {
          const borrower = employees.find(e => e.id === loan.employeeId);
          const branch = branches.find(b => b.id === borrower?.branchId);
          const prod = loanProducts.find(p => p.id === loan.loanProductId);
          const progressPercent = Math.min(100, Math.round((loan.amountPaid / loan.totalPayable) * 100));

          return (
            <div
              key={loan.id}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-400 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono text-xs font-bold text-slate-900">{loan.loanNumber}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    loan.status === 'FULLY_PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {loan.status}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-sm text-slate-900">
                    {borrower?.firstName} {borrower?.lastName}
                  </h3>
                  <p className="text-xs text-slate-500">{borrower?.position} · {branch?.name}</p>
                  <p className="text-xs text-amber-700 font-semibold mt-0.5">{prod?.name}</p>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500">Paid: {formatPHP(loan.amountPaid)}</span>
                    <span className="text-slate-900 font-mono">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remaining Balance:</span>
                    <span className="font-mono font-bold text-amber-700 text-sm">{formatPHP(loan.balance)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Maturity Date:</span>
                    <span>{loan.maturityDate}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {loan.balance === 0 ? (
                  <button
                    onClick={() => setShowClearance(loan)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                  >
                    <Award className="w-3.5 h-3.5" />
                    Loan Clearance
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedLoan(loan);
                      setShowPaymentModal(true);
                      setPaymentRef(`OTC-${Date.now().toString(36).toUpperCase()}`);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Pay OTC
                  </button>
                )}

                <button
                  onClick={() => setSelectedLoan(loan)}
                  className="px-4 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs"
                >
                  View Amortization
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Amortization Ledger Modal */}
      {selectedLoan && !showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {selectedLoan.loanNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Amortization Schedule & Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Principal: {formatPHP(selectedLoan.principal)} · Total Payable: {formatPHP(selectedLoan.totalPayable)} · Balance: {formatPHP(selectedLoan.balance)}
                </p>
              </div>
              <button onClick={() => setSelectedLoan(null)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Schedule Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Cutoff</th>
                    <th className="py-2.5 px-3 font-mono">Principal</th>
                    <th className="py-2.5 px-3 font-mono">Interest</th>
                    <th className="py-2.5 px-3 font-mono">Total Due</th>
                    <th className="py-2.5 px-3 font-mono">Balance After</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedLoan.schedules.map(sch => (
                    <tr key={sch.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold">{sch.installmentNo}</td>
                      <td className="py-2.5 px-3 font-mono">{sch.dueDate}</td>
                      <td className="py-2.5 px-3">{sch.cutoffPeriod}</td>
                      <td className="py-2.5 px-3 font-mono">{formatPHP(sch.principal)}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-700">+{formatPHP(sch.interest)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{formatPHP(sch.amount)}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{formatPHP(sch.balanceAfter)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          sch.status === 'POSTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sch.status === 'PARTIAL'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {sch.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedLoan(null)}
                className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Direct Payment Modal */}
      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form
            onSubmit={handlePostDirectPayment}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Record Direct OTC Payment</h3>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Loan Number:</span>
                <span className="font-mono font-bold text-slate-900">{selectedLoan.loanNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Balance:</span>
                <span className="font-mono font-bold text-amber-700">{formatPHP(selectedLoan.balance)}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Amount (PHP) *</label>
              <input
                type="number"
                step="0.01"
                required
                max={selectedLoan.balance}
                value={paymentAmount}
                onChange={e => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-base font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Receipt / Reference No. *</label>
              <input
                type="text"
                required
                value={paymentRef}
                onChange={e => setPaymentRef(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Remarks</label>
              <input
                type="text"
                value={paymentRemarks}
                onChange={e => setPaymentRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
              >
                Post Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loan Clearance Certificate Print */}
      {showClearance && (
        <LoanClearancePrint
          loanNumber={showClearance.loanNumber}
          borrowerName={employees.find(e => e.id === showClearance.employeeId)?.firstName + ' ' + employees.find(e => e.id === showClearance.employeeId)?.lastName}
          employeeNumber={employees.find(e => e.id === showClearance.employeeId)?.employeeNumber || ''}
          branchName={branches.find(b => b.id === employees.find(e => e.id === showClearance.employeeId)?.branchId)?.name || 'Main Branch'}
          principal={showClearance.principal}
          completionDate={new Date().toISOString().split('T')[0]}
          onClose={() => setShowClearance(null)}
        />
      )}
    </div>
  );
};
