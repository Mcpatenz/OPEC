import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../lib/loans/calculator';
import { LoanAccount, LoanApplication } from '../../types';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  BadgeDollarSign,
  ArrowRight,
  X,
  Award,
} from 'lucide-react';
import { LoanClearancePrint } from '../documents/LoanClearancePrint';

interface MyLoansProps {
  onOpenApply: () => void;
}

export const MyLoansView: React.FC<MyLoansProps> = ({ onOpenApply }) => {
  const { currentUser, employees, branches, loanProducts, applications, activeLoans } = useApp();

  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const branch = branches.find(b => b.id === applicant.branchId);

  const myApplications = applications.filter(a => a.employeeId === applicant.id);
  const myLoans = activeLoans.filter(l => l.employeeId === applicant.id);

  const [selectedLoan, setSelectedLoan] = useState<LoanAccount | null>(null);
  const [showClearance, setShowClearance] = useState<LoanAccount | null>(null);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">My OPEC Loans & Amortization</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your loan application approvals, active schedules, and semi-monthly payroll deductions.
          </p>
        </div>

        <button
          onClick={onOpenApply}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
        >
          <CreditCard className="w-4 h-4" />
          Apply New Loan
        </button>
      </div>

      {/* Applications Section */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Submitted Applications ({myApplications.length})
        </h2>

        {myApplications.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            No applications submitted. Click "Apply New Loan" to start.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myApplications.map(app => {
              const prod = loanProducts.find(p => p.id === app.loanProductId);

              return (
                <div key={app.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{app.applicationNo}</span>
                      <p className="text-[11px] text-slate-400">{app.submittedAt?.split('T')[0]}</p>
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

                  <div className="flex justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 text-sm block">{prod?.name}</span>
                      <p className="text-[11px] text-slate-500">{app.purpose}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 text-sm">{formatPHP(app.requestedAmount)}</span>
                      <p className="text-[10px] text-slate-400">{app.termMonths} Months</p>
                    </div>
                  </div>

                  {/* Sign-off progress */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Credit Committee Reviewers:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {app.approvals.map(apr => (
                        <div
                          key={apr.id}
                          className={`p-1.5 rounded border text-[10px] ${
                            apr.decision === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}
                        >
                          <span className="block truncate">{apr.title.split(' ')[0]}</span>
                          <span className="text-[9px] font-mono">{apr.decision}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Loans Section */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Active Loan Accounts & Amortization Schedules ({myLoans.length})
        </h2>

        {myLoans.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            No active disbursed loan accounts on record.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myLoans.map(loan => {
              const prod = loanProducts.find(p => p.id === loan.loanProductId);
              const progressPercent = Math.min(100, Math.round((loan.amountPaid / loan.totalPayable) * 100));

              return (
                <div key={loan.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-mono font-bold text-slate-900">{loan.loanNumber}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {loan.status}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 text-sm">{prod?.name}</span>
                    <p className="text-[11px] text-slate-500">Maturity Date: {loan.maturityDate}</p>
                  </div>

                  {/* Balance & progress */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Outstanding Balance:</span>
                      <span className="font-mono font-bold text-amber-700 text-sm">{formatPHP(loan.balance)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Total Paid: {formatPHP(loan.amountPaid)}</span>
                      <span className="font-mono font-semibold">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    {loan.balance === 0 ? (
                      <button
                        onClick={() => setShowClearance(loan)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Loan Clearance Certificate
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Automatic Payroll Deduction</span>
                    )}

                    <button
                      onClick={() => setSelectedLoan(loan)}
                      className="px-4 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs"
                    >
                      View Schedule
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Amortization Ledger Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="font-mono font-bold text-slate-900 text-sm">{selectedLoan.loanNumber}</span>
                <p className="text-[11px] text-slate-500">Semi-monthly payroll deduction schedule</p>
              </div>
              <button onClick={() => setSelectedLoan(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Payday Due</th>
                    <th className="py-2.5 px-3">Cutoff</th>
                    <th className="py-2.5 px-3 font-mono">Deduction</th>
                    <th className="py-2.5 px-3 font-mono">Balance After</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedLoan.schedules.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold">{s.installmentNo}</td>
                      <td className="py-2.5 px-3 font-mono">{s.dueDate}</td>
                      <td className="py-2.5 px-3">{s.cutoffPeriod}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{formatPHP(s.amount)}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{formatPHP(s.balanceAfter)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          s.status === 'POSTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLoan(null)}
                className="px-4 py-2 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clearance Certificate */}
      {showClearance && (
        <LoanClearancePrint
          loanNumber={showClearance.loanNumber}
          borrowerName={`${applicant.firstName} ${applicant.lastName}`}
          employeeNumber={applicant.employeeNumber}
          branchName={branch?.name || 'Main Branch'}
          principal={showClearance.principal}
          completionDate={new Date().toISOString().split('T')[0]}
          onClose={() => setShowClearance(null)}
        />
      )}
    </div>
  );
};
