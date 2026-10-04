import React from 'react';
import { formatPHP } from '../../lib/loans/calculator';
import { Printer, X } from 'lucide-react';

interface ReceiptProps {
  loanNumber: string;
  borrowerName: string;
  borrowerNumber: string;
  branchName: string;
  loanType: string;
  principal: number;
  processingFee: number;
  netReleased: number;
  releaseDate: string;
  releaseMethod: string;
  referenceNumber: string;
  releasedBy: string;
  onClose: () => void;
}

export const LoanReleaseReceiptPrint: React.FC<ReceiptProps> = ({
  loanNumber,
  borrowerName,
  borrowerNumber,
  branchName,
  loanType,
  principal,
  processingFee,
  netReleased,
  releaseDate,
  releaseMethod,
  referenceNumber,
  releasedBy,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full p-8 shadow-2xl border border-slate-300 relative text-slate-900">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
            Official Loan Disbursement Voucher
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body (Strict OPEC Aurum Gems Format) */}
        <div className="border-4 border-double border-slate-800 p-8 space-y-6">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-800 pb-4">
            <h1 className="text-xl font-black tracking-tight uppercase text-slate-900">
              OPEC AURUM GEMS
            </h1>
            <p className="text-xs font-semibold text-slate-600">
              M Lhuillier Employees Credit & Cooperative Management
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Region 10 & 9 Operations · Ozamiz City, Misamis Occidental
            </p>
            <div className="inline-block mt-3 px-4 py-1 bg-slate-100 border border-slate-800 text-xs font-bold tracking-widest uppercase">
              LOAN RELEASE RECEIPT
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Loan Account Number:</span>
              <span className="font-mono font-bold text-sm text-slate-900">{loanNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Release Date:</span>
              <span className="font-semibold text-slate-900">{releaseDate}</span>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 block">Borrower Name:</span>
                  <span className="font-bold text-sm text-slate-900">{borrowerName}</span>
                  <span className="text-[11px] text-slate-500 font-mono block">{borrowerNumber} · {branchName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Facility / Type:</span>
                  <span className="font-bold text-slate-800">{loanType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-slate-50 border border-slate-300 rounded p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Principal Approved Amount:</span>
              <span className="font-mono font-bold text-slate-900">{formatPHP(principal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Less: OPEC Processing Fee:</span>
              <span className="font-mono text-slate-700">-{formatPHP(processingFee)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-slate-400 text-sm font-bold text-slate-900">
              <span>NET AMOUNT RELEASED:</span>
              <span className="font-mono text-base text-emerald-800">{formatPHP(netReleased)}</span>
            </div>
          </div>

          {/* Disbursement specs */}
          <div className="text-xs text-slate-600 space-y-1">
            <p><strong>Disbursement Method:</strong> {releaseMethod}</p>
            <p><strong>Reference / Check No.:</strong> <span className="font-mono font-bold text-slate-800">{referenceNumber}</span></p>
            <p className="text-[11px] text-slate-500 italic mt-2">
              Note: This loan is subject to automatic semi-monthly salary deduction every 15th and 30th of each month until full satisfaction.
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-xs">
            <div className="text-center">
              <div className="border-b border-slate-800 pb-1 mb-1 font-bold text-slate-900">
                {releasedBy}
              </div>
              <p className="text-slate-500 text-[11px]">Authorized Releasing Officer</p>
              <p className="text-[10px] text-slate-400">OPEC Treasury</p>
            </div>
            <div className="text-center">
              <div className="border-b border-slate-800 pb-1 mb-1 font-bold text-slate-900">
                {borrowerName}
              </div>
              <p className="text-slate-500 text-[11px]">Borrower / Received By</p>
              <p className="text-[10px] text-slate-400">Signature Over Printed Name</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
