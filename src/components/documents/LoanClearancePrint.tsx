import React from 'react';
import { formatPHP } from '../../lib/loans/calculator';
import { Printer, X, Award, ShieldCheck } from 'lucide-react';

interface ClearanceProps {
  loanNumber: string;
  borrowerName: string;
  employeeNumber: string;
  branchName: string;
  principal: number;
  completionDate: string;
  onClose: () => void;
}

export const LoanClearancePrint: React.FC<ClearanceProps> = ({
  loanNumber,
  borrowerName,
  employeeNumber,
  branchName,
  principal,
  completionDate,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full p-8 shadow-2xl border border-slate-300 relative text-slate-900">
        
        {/* Controls */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            Official Certificate of Loan Clearance
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Certificate
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Section 49 of specification) */}
        <div className="border-4 border-amber-500/80 p-10 space-y-6 text-center bg-gradient-to-b from-amber-50/20 to-white">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center border-2 border-amber-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">
              OPEC AURUM GEMS
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mt-1">
              Credit Committee & Treasury Directorate · Region 10 & 9
            </p>
          </div>

          <div className="py-2">
            <span className="text-lg font-serif italic text-slate-700">
              Certificate of Full Loan Satisfaction & Clearance
            </span>
          </div>

          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            This certifies that employee <strong>{borrowerName}</strong> ({employeeNumber}), stationed at <strong>{branchName}</strong>, has completely and faithfully satisfied all financial obligations under Loan Account:
          </p>

          <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg max-w-md mx-auto text-xs grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block">Loan Account Number</span>
              <span className="font-mono font-bold text-slate-900">{loanNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Settled Principal</span>
              <span className="font-mono font-bold text-emerald-800">{formatPHP(principal)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Remaining Balance</span>
              <span className="font-mono font-bold text-emerald-700">₱0.00 (Zero)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Date Fully Liquidated</span>
              <span className="font-semibold text-slate-900">{completionDate}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 max-w-md mx-auto italic">
            All co-makers on record are hereby discharged and released from their joint and solidary liabilities for this account. The borrower is cleared for future OPEC credit facilities.
          </p>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-300 text-xs">
            <div className="text-center">
              <div className="border-b border-slate-800 pb-1 mb-1 font-bold text-slate-900">
                Elena Corazon Mendoza
              </div>
              <p className="text-[11px] text-slate-500">OPEC Treasurer</p>
            </div>
            <div className="text-center">
              <div className="border-b border-slate-800 pb-1 mb-1 font-bold text-slate-900">
                Engr. Roberto Eduardo Tan
              </div>
              <p className="text-[11px] text-slate-500">OPEC President</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
