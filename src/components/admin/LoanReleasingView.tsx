import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LoanApplication, ReleaseMethod } from '../../types';
import { formatPHP } from '../../lib/loans/calculator';
import { LoanReleaseReceiptPrint } from '../documents/LoanReleaseReceiptPrint';
import {
  Receipt,
  CheckCircle2,
  DollarSign,
  Printer,
  Building,
  CreditCard,
  Search,
  Sparkles,
} from 'lucide-react';

export const LoanReleasingView: React.FC = () => {
  const { applications, employees, branches, loanProducts, releaseLoanDisbursement, activeLoans } = useApp();

  const forReleaseApps = applications.filter(a => a.status === 'FOR_RELEASE');
  const releasedApps = applications.filter(a => a.status === 'RELEASED');

  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [releaseMethod, setReleaseMethod] = useState<ReleaseMethod>('BANK_CHECK');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [disbursementAccount, setDisbursementAccount] = useState('');
  const [activeReceipt, setActiveReceipt] = useState<any>(null);

  const handleOpenReleaseModal = (app: LoanApplication) => {
    setSelectedApp(app);
    setReleaseMethod(app.releaseMethod || 'BANK_CHECK');
    setReferenceNumber(`CHK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setDisbursementAccount(app.releaseDetails || 'ML Ozamiz 1 Account');
  };

  const handleExecuteRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    const prod = loanProducts.find(p => p.id === selectedApp.loanProductId);
    const gross = selectedApp.approvedAmount || selectedApp.requestedAmount;
    const procFee = prod?.processingFee || 50;
    const net = gross - procFee;

    const res = releaseLoanDisbursement(selectedApp.id, {
      method: releaseMethod,
      grossAmount: gross,
      processingFee: procFee,
      otherFees: 0,
      referenceNumber,
      disbursementAccount,
    });

    if (res.success) {
      const borrower = employees.find(e => e.id === selectedApp.employeeId);
      const branch = branches.find(b => b.id === borrower?.branchId);

      setActiveReceipt({
        loanNumber: res.loanNumber,
        borrowerName: `${borrower?.firstName} ${borrower?.lastName}`,
        borrowerNumber: borrower?.employeeNumber || '',
        branchName: branch?.name || 'Main Branch',
        loanType: prod?.name || 'Commodity Loan',
        principal: gross,
        processingFee: procFee,
        netReleased: net,
        releaseDate: new Date().toISOString().split('T')[0],
        releaseMethod,
        referenceNumber,
        releasedBy: 'Elena Corazon Mendoza (Treasurer)',
      });

      setSelectedApp(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Loan Releasing Desk</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {forReleaseApps.length} Ready for Payout
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Execute final disbursement vouchers, apply ₱50 processing fee deduction, and issue official receipts.
          </p>
        </div>
      </div>

      {/* Grid of Ready for Release */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Approved & Ready for Release ({forReleaseApps.length})
        </h2>

        {forReleaseApps.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            No applications are currently awaiting disbursement.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forReleaseApps.map(app => {
              const borrower = employees.find(e => e.id === app.employeeId);
              const branch = branches.find(b => b.id === borrower?.branchId);
              const prod = loanProducts.find(p => p.id === app.loanProductId);
              const gross = app.approvedAmount || app.requestedAmount;
              const procFee = prod?.processingFee || 50;
              const net = gross - procFee;

              return (
                <div
                  key={app.id}
                  className="bg-white p-5 rounded-xl border-2 border-emerald-500/50 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-mono text-xs font-bold text-slate-900">{app.applicationNo}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        ALL SIGN-OFFS COMPLETE
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-bold text-slate-900">
                        {borrower?.firstName} {borrower?.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{borrower?.position} · {branch?.name}</p>
                      <p className="text-xs text-amber-700 font-semibold mt-1">{prod?.name}</p>
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Approved Principal:</span>
                        <span className="font-mono font-bold text-slate-800">{formatPHP(gross)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>OPEC Processing Fee:</span>
                        <span className="font-mono text-slate-600">-{formatPHP(procFee)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-emerald-700">
                        <span>Net Payout:</span>
                        <span className="font-mono text-sm">{formatPHP(net)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Method: {app.releaseMethod}</span>
                    <button
                      onClick={() => handleOpenReleaseModal(app)}
                      className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-all"
                    >
                      Disburse Loan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Disbursed History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Recent Active Disbursed Loans</h2>
        <p className="text-xs text-slate-500 mb-4">View issued loan accounts, net proceeds, and regenerate receipts</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Loan Account #</th>
                <th className="py-2.5 px-3">Borrower</th>
                <th className="py-2.5 px-3">Gross Principal</th>
                <th className="py-2.5 px-3">Net Disbursed</th>
                <th className="py-2.5 px-3">Method & Ref</th>
                <th className="py-2.5 px-3">Release Date</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeLoans.map(loan => {
                const borrower = employees.find(e => e.id === loan.employeeId);
                const branch = branches.find(b => b.id === borrower?.branchId);
                const prod = loanProducts.find(p => p.id === loan.loanProductId);

                return (
                  <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{loan.loanNumber}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{borrower?.firstName} {borrower?.lastName}</span>
                      <span className="block text-[11px] text-slate-400">{branch?.name}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold">{formatPHP(loan.principal)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      {formatPHP(loan.releaseInfo.netAmount)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{loan.releaseInfo.method}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{loan.releaseInfo.referenceNumber}</span>
                    </td>
                    <td className="py-3 px-3">{loan.releaseDate}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setActiveReceipt({
                            loanNumber: loan.loanNumber,
                            borrowerName: `${borrower?.firstName} ${borrower?.lastName}`,
                            borrowerNumber: borrower?.employeeNumber || '',
                            branchName: branch?.name || 'Main Branch',
                            loanType: prod?.name || 'Commodity Loan',
                            principal: loan.principal,
                            processingFee: loan.processingFee,
                            netReleased: loan.releaseInfo.netAmount,
                            releaseDate: loan.releaseDate,
                            releaseMethod: loan.releaseInfo.method,
                            referenceNumber: loan.releaseInfo.referenceNumber,
                            releasedBy: loan.releaseInfo.releasedBy,
                          });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Printer className="w-3 h-3" />
                        Print Receipt
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Release Execution Modal (Section 20 of specification) */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form
            onSubmit={handleExecuteRelease}
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  LOAN RELEASE DESK
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Disburse Loan: {selectedApp.applicationNo}
                </h3>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Approved Amount:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatPHP(selectedApp.approvedAmount || selectedApp.requestedAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>OPEC Processing Fee:</span>
                <span className="font-mono text-slate-700">-₱50.00</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Net Disbursement:</span>
                <span className="font-mono text-emerald-700">
                  {formatPHP((selectedApp.approvedAmount || selectedApp.requestedAmount) - 50)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Disbursement Method
              </label>
              <select
                value={releaseMethod}
                onChange={e => setReleaseMethod(e.target.value as ReleaseMethod)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="BANK_CHECK">ML Ozamiz 1 Bank Check</option>
                <option value="ML_KWARTA_PADALA">ML Kwarta Padala (Branch Payout)</option>
                <option value="BPI_ATM_DEPOSIT">BPI ATM Direct Deposit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reference / Check Number *
              </label>
              <input
                type="text"
                required
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="e.g. CHK-2026-00091"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Disbursement Account / Releasing Notes
              </label>
              <input
                type="text"
                value={disbursementAccount}
                onChange={e => setDisbursementAccount(e.target.value)}
                placeholder="Manager check payable to employee..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
              >
                Confirm Disbursement & Issue Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <LoanReleaseReceiptPrint
          {...activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
};
