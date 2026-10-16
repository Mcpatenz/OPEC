import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { evaluateEmployeeCbu, CBU_PER_PAYDAY, CBU_RETAINER_FEE_RATE, CBU_REFUNDABLE_RATE } from '../../lib/cbu/cbuCalculator';
import { formatPHP } from '../../lib/loans/calculator';
import {
  Coins,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Info,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Calculator,
  UserX,
  X,
  Sparkles,
  Building,
} from 'lucide-react';

interface CbuEquityCardProps {
  onOpenPaystub?: () => void;
}

export const CbuEquityCard: React.FC<CbuEquityCardProps> = ({ onOpenPaystub }) => {
  const { currentUser, employees } = useApp();
  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];

  const cbu = evaluateEmployeeCbu(applicant);

  const [showLedgerModal, setShowLedgerModal] = useState<boolean>(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState<boolean>(false);
  const [simulatedStatus, setSimulatedStatus] = useState<'RESIGNED' | 'AWOL' | 'REMOVED' | 'NORMAL_RETIREMENT'>('RESIGNED');

  // Simulated calculation
  const simRetainerFee =
    simulatedStatus === 'NORMAL_RETIREMENT' ? 0 : Math.round(cbu.totalCbu * CBU_RETAINER_FEE_RATE * 100) / 100;
  const simRefundable = Math.round((cbu.totalCbu - simRetainerFee) * 100) / 100;

  return (
    <>
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30 dark:via-slate-900/40 dark:to-transparent rounded-2xl border border-amber-300/80 dark:border-amber-600/30 p-6 shadow-sm relative overflow-hidden transition-all">
        {/* Decorative background watermark */}
        <div className="absolute -right-6 -bottom-6 w-36 h-36 opacity-[0.06] dark:opacity-[0.08] pointer-events-none text-amber-600">
          <Coins className="w-full h-full" />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-200/80 dark:border-amber-700/30">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  Mandatory OPEC Capital Build-Up (CBU)
                </span>
                <span className="text-xs text-amber-800 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  ₱{CBU_PER_PAYDAY}/payday
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Capital Build-Up Equity & Retainers Fee Reserve
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Accumulated cooperative member equity with 10% separation retainers fee policy.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowLedgerModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
              <span>View CBU Ledger</span>
            </button>
            <button
              onClick={() => setShowSimulatorModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-colors cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Separation Rules</span>
            </button>
          </div>
        </div>

        {/* Key Metrics 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Total Accumulated CBU */}
          <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl p-4 border border-amber-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Total Accumulated CBU</span>
              <Coins className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">
              {formatPHP(cbu.totalCbu)}
            </div>
            <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>{cbu.paydaysCount} paydays contributed</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">₱{cbu.monthlyContribution}/mo</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.round((cbu.totalCbu / 30000) * 100))}%` }}
              />
            </div>
          </div>

          {/* Card 2: 10% Retainer's Fee */}
          <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl p-4 border border-amber-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>10% Retainer's Fee</span>
              <ShieldCheck className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {formatPHP(cbu.retainersFee)}
            </div>
            <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
              Given to OPEC if employee <strong className="text-rose-600 dark:text-rose-400">resigns</strong>, is <strong className="text-rose-600 dark:text-rose-400">AWOL</strong>, or is <strong className="text-rose-600 dark:text-rose-400">removed</strong>.
            </p>
          </div>

          {/* Card 3: 90% Net Refundable Equity */}
          <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl p-4 border border-amber-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>90% Net Refundable</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {formatPHP(cbu.netRefundableCbu)}
            </div>
            <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
              Net equity release claimable by employee upon separation clearance.
            </p>
          </div>

          {/* Card 4: Payday Deduction Schedule */}
          <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl p-4 border border-amber-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Deduction Rate</span>
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                ₱{CBU_PER_PAYDAY}.00
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Per semi-monthly payday (15th & 30th)
              </span>
            </div>
            {onOpenPaystub && (
              <button
                onClick={onOpenPaystub}
                className="mt-3 flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline pt-2 border-t border-slate-100 dark:border-slate-700 cursor-pointer"
              >
                <span>View on Paystub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Policy Explanation Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/40 flex items-start gap-3 text-xs">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-amber-900 dark:text-amber-300">
                OPEC Cooperative CBU & Retainers Policy:
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-amber-200/80 dark:bg-amber-800/60 text-amber-900 dark:text-amber-200">
                100 / Payday · 10% Retainer Fee · 90% Net Release
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
              Every employee has <strong>₱100 deducted per payday</strong> for Capital Build-Up (CBU). Under cooperative bylaws, total CBU is subject to a <strong>10% retainers fee given to OPEC</strong> if the employee resigns, AWOL (absence without official leave), or is removed from office or work. The remaining <strong>90% is refundable</strong> to the employee upon full administrative clearance.
            </p>
          </div>
        </div>
      </div>

      {/* CBU Ledger History Modal */}
      {showLedgerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Capital Build-Up (CBU) Contributions Ledger
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Employee: {cbu.employeeName} ({cbu.employeeNumber}) · Date Hired: {cbu.dateHired}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLedgerModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Highlights */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">
                  Total Accumulated
                </span>
                <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                  {formatPHP(cbu.totalCbu)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">
                  10% Retainer (OPEC)
                </span>
                <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
                  {formatPHP(cbu.retainersFee)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">
                  90% Net Refundable
                </span>
                <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatPHP(cbu.netRefundableCbu)}
                </span>
              </div>
            </div>

            {/* Ledger Table */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                Recent Semi-Monthly CBU Deductions (₱100/payday)
              </h4>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Payroll Cutoff</th>
                      <th className="p-2.5 text-right">CBU Contribution</th>
                      <th className="p-2.5 text-right">Cumulative Balance</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cbu.recentLedger.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                          {row.periodLabel}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          {formatPHP(row.contribution)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          {formatPHP(row.cumulativeTotal)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.status === 'POSTED'
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic text-center">
                Showing recent pay periods across {cbu.paydaysCount} total paydays logged since hire date ({cbu.dateHired}).
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowLedgerModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Separation Rules & Calculator Simulator Modal */}
      {showSimulatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Separation Retainers Fee Calculator
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rule: Total CBU is 10% for retainers fee given to OPEC if employee resigns, AWOL, or is removed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSimulatorModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scenario Selector */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Simulate Separation Scenario:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'RESIGNED', label: 'Voluntary Resignation', sub: '10% Retainer Fee to OPEC' },
                  { id: 'AWOL', label: 'AWOL (Absence w/o Leave)', sub: '10% Retainer Fee to OPEC' },
                  { id: 'REMOVED', label: 'Removed / Terminated', sub: '10% Retainer Fee to OPEC' },
                  { id: 'NORMAL_RETIREMENT', label: 'Mandatory Retirement', sub: '100% Full Payout' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSimulatedStatus(opt.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      simulatedStatus === opt.id
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-bold block text-xs">{opt.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Outcome */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-bold text-slate-900 dark:text-white block text-xs">
                Separation Financial Settlement Breakdown:
              </span>
              <div className="space-y-1.5 divide-y divide-slate-200 dark:divide-slate-700/60">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600 dark:text-slate-400">Total Accumulated CBU:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatPHP(cbu.totalCbu)}</span>
                </div>
                <div className="flex justify-between pt-1 text-rose-600 dark:text-rose-400 font-semibold">
                  <span>
                    Less: 10% Retainers Fee (Allocated to OPEC):
                  </span>
                  <span className="font-mono">
                    - {formatPHP(simRetainerFee)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  <span>Net Refundable Equity Released to Employee:</span>
                  <span className="font-mono">{formatPHP(simRefundable)}</span>
                </div>
              </div>
            </div>

            {/* Policy Notes */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/40 rounded-xl text-amber-900 dark:text-amber-300 text-[11px] space-y-1">
              <p className="font-bold">OPEC Financial Policy Directive:</p>
              <p>
                When an employee resigns, is AWOL, or is removed from office or work, the 10% retainers fee remains with OPEC to cover administrative retention and mutual fund reserves. The 90% balance is paid directly via check or bank transfer after signing the OPEC clearance document.
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowSimulatorModal(false)}
                className="px-5 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
