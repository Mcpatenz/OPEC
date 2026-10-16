import React, { useState, useMemo } from 'react';
import { LoanAccount, LoanAmortizationSchedule } from '../../types';
import { formatPHP } from '../../lib/loans/calculator';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  CreditCard,
  TrendingDown,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Layers,
  FileSpreadsheet,
  X,
  ShieldCheck,
  Building,
  Info,
  DollarSign,
  PieChart,
} from 'lucide-react';

interface ActiveLoanAmortizationScheduleProps {
  loan: LoanAccount;
  onClose?: () => void;
}

export interface MonthlyBreakdownRow {
  monthIndex: number;
  monthLabel: string;
  dueDate: string;
  monthlyPrincipal: number;
  monthlyInterest: number;
  monthlyTotal: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
  remainingBalance: number;
  status: 'POSTED' | 'SCHEDULED' | 'PARTIAL';
  postedInstallments: number;
  totalInstallmentsInMonth: number;
}

export const ActiveLoanAmortizationSchedule: React.FC<ActiveLoanAmortizationScheduleProps> = ({
  loan,
  onClose,
}) => {
  const { loanProducts, employees, branches } = useApp();
  const [viewMode, setViewMode] = useState<'monthly' | 'semi-monthly'>('monthly');

  const product = loanProducts.find(p => p.id === loan.loanProductId);
  const employee = employees.find(e => e.id === loan.employeeId);
  const branch = employee ? branches.find(b => b.id === employee.branchId) : null;

  // Compute monthly breakdown from the loan's amortization schedules
  const monthlyData = useMemo(() => {
    const schedules = loan.schedules || [];
    if (schedules.length === 0) return [];

    // Group schedules by Year-Month
    const groups: { [key: string]: LoanAmortizationSchedule[] } = {};
    schedules.forEach(s => {
      const ym = s.dueDate ? s.dueDate.substring(0, 7) : 'Unknown';
      if (!groups[ym]) groups[ym] = [];
      groups[ym].push(s);
    });

    const rows: MonthlyBreakdownRow[] = [];
    let runningPrincipalCumulative = 0;
    let runningInterestCumulative = 0;
    let monthIdx = 1;

    // Sort year-months chronologically
    const sortedYMs = Object.keys(groups).sort();

    sortedYMs.forEach(ym => {
      const items = groups[ym];
      const monthlyPrincipal = items.reduce((sum, item) => sum + (item.principal || 0), 0);
      const monthlyInterest = items.reduce((sum, item) => sum + (item.interest || 0), 0);
      const monthlyTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
      
      const lastItemInMonth = items[items.length - 1];
      const remainingBalance = lastItemInMonth ? lastItemInMonth.balanceAfter : 0;
      
      const postedCount = items.filter(i => i.status === 'POSTED').length;
      let monthStatus: 'POSTED' | 'SCHEDULED' | 'PARTIAL' = 'SCHEDULED';
      if (postedCount === items.length) {
        monthStatus = 'POSTED';
      } else if (postedCount > 0) {
        monthStatus = 'PARTIAL';
      }

      if (monthStatus === 'POSTED') {
        runningPrincipalCumulative += monthlyPrincipal;
        runningInterestCumulative += monthlyInterest;
      }

      // Format month label (e.g. Month 1 · Oct 2026)
      let formattedMonth = `Month ${monthIdx}`;
      if (ym !== 'Unknown') {
        try {
          const [yr, mo] = ym.split('-');
          const dateObj = new Date(parseInt(yr, 10), parseInt(mo, 10) - 1, 1);
          formattedMonth = `Month ${monthIdx} (${dateObj.toLocaleString('default', { month: 'short', year: 'numeric' })})`;
        } catch {
          // fallback
        }
      }

      rows.push({
        monthIndex: monthIdx,
        monthLabel: formattedMonth,
        dueDate: lastItemInMonth ? lastItemInMonth.dueDate : ym,
        monthlyPrincipal: Math.round(monthlyPrincipal * 100) / 100,
        monthlyInterest: Math.round(monthlyInterest * 100) / 100,
        monthlyTotal: Math.round(monthlyTotal * 100) / 100,
        cumulativePrincipal: Math.round(runningPrincipalCumulative * 100) / 100,
        cumulativeInterest: Math.round(runningInterestCumulative * 100) / 100,
        remainingBalance: Math.round(remainingBalance * 100) / 100,
        status: monthStatus,
        postedInstallments: postedCount,
        totalInstallmentsInMonth: items.length,
      });

      monthIdx++;
    });

    return rows;
  }, [loan]);

  // Totals
  const totalPrincipal = loan.principal || 0;
  const totalInterest = loan.interestTotal || 0;
  const totalPayable = loan.totalPayable || 0;
  const balance = loan.balance || 0;
  const amountPaid = loan.amountPaid || 0;
  const progressPercent = totalPayable > 0 ? Math.min(100, Math.round((amountPaid / totalPayable) * 100)) : 0;

  // Average monthly figures
  const totalMonths = monthlyData.length || 12;
  const avgMonthlyPrincipal = totalMonths > 0 ? Math.round((totalPrincipal / totalMonths) * 100) / 100 : 0;
  const avgMonthlyInterest = totalMonths > 0 ? Math.round((totalInterest / totalMonths) * 100) / 100 : 0;
  const avgMonthlyTotal = Math.round((avgMonthlyPrincipal + avgMonthlyInterest) * 100) / 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-xs">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 text-white border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {loan.loanNumber}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {loan.status}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            {product?.name || 'OPEC Loan Facility'} — Detailed Amortization Schedule
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Borrower: <strong className="text-white">{employee?.firstName} {employee?.lastName}</strong> ({employee?.employeeNumber}) · {branch?.name || 'Main Branch'} · Released {loan.releaseDate} · Maturity {loan.maturityDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            Print Schedule
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Gross Principal
            </span>
            <span className="text-base font-mono font-bold text-slate-900 block mt-0.5">
              {formatPHP(totalPrincipal)}
            </span>
            <span className="text-[10px] text-slate-400">Borrowed Capital</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Total Interest
            </span>
            <span className="text-base font-mono font-bold text-amber-700 block mt-0.5">
              {formatPHP(totalInterest)}
            </span>
            <span className="text-[10px] text-slate-400">1.50% / month flat</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Total Payable
            </span>
            <span className="text-base font-mono font-bold text-slate-900 block mt-0.5">
              {formatPHP(totalPayable)}
            </span>
            <span className="text-[10px] text-slate-400">Principal + Interest</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Outstanding Balance
            </span>
            <span className="text-base font-mono font-bold text-rose-700 block mt-0.5">
              {formatPHP(balance)}
            </span>
            <span className="text-[10px] text-slate-400">Remaining Obligation</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Monthly Principal
            </span>
            <span className="text-base font-mono font-bold text-emerald-700 block mt-0.5">
              {formatPHP(avgMonthlyPrincipal)}
            </span>
            <span className="text-[10px] text-slate-400">Principal per Month</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Monthly Interest
            </span>
            <span className="text-base font-mono font-bold text-amber-800 block mt-0.5">
              {formatPHP(avgMonthlyInterest)}
            </span>
            <span className="text-[10px] text-slate-400">Interest per Month</span>
          </div>
        </div>

        {/* Repayment Progress Gauge */}
        <div className="p-4 bg-gradient-to-r from-amber-50/70 via-slate-50 to-emerald-50/70 rounded-xl border border-slate-200 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Loan Amortization Repayment Progress
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-slate-600 text-xs">
                {formatPHP(amountPaid)} settled of {formatPHP(totalPayable)}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono font-bold text-sm">
              <span className="text-emerald-700">{progressPercent}% Settled</span>
              <span className="text-slate-400">·</span>
              <span className="text-amber-800">{formatPHP(balance)} Balance</span>
            </div>
          </div>

          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner p-0.5">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Disbursed: <strong className="text-slate-800">{loan.releaseDate}</strong></span>
            <span>Maturity Date: <strong className="text-slate-800">{loan.maturityDate}</strong></span>
            <span>Payroll Period: <strong className="text-slate-800">Semi-monthly (15th & 30th)</strong></span>
          </div>
        </div>

        {/* View Mode Toggle: Monthly Breakdown vs Semi-Monthly Cutoffs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'monthly'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              Monthly Principal & Interest Breakdown ({monthlyData.length} Months)
            </button>
            <button
              onClick={() => setViewMode('semi-monthly')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'semi-monthly'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Semi-Monthly Payroll Deduction Ledger ({loan.schedules?.length || 0} Cutoffs)
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              POSTED (Paid)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
              SCHEDULED (Upcoming)
            </span>
          </div>
        </div>

        {/* View 1: Detailed Monthly Principal and Interest Breakdown */}
        {viewMode === 'monthly' && (
          <div className="space-y-4">
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Monthly Amortization Schedule Formulation:</strong>
                Each month aggregates two semi-monthly cutoff deductions (15th and 30th) separating the fixed capital repayment (Principal) from the financial service charge (Interest at 1.5%/month).
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 shadow-2xs">
                    <tr>
                      <th className="py-3 px-3.5">Month</th>
                      <th className="py-3 px-3.5">Payment Period / Due</th>
                      <th className="py-3 px-3.5 font-mono text-right text-emerald-800">Monthly Principal</th>
                      <th className="py-3 px-3.5 font-mono text-right text-amber-800">Monthly Interest</th>
                      <th className="py-3 px-3.5 font-mono text-right text-slate-900">Total Monthly Amortization</th>
                      <th className="py-3 px-3.5 font-mono text-right text-slate-700">Remaining Balance</th>
                      <th className="py-3 px-3.5 text-center">Settlement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyData.map(row => (
                      <tr
                        key={row.monthIndex}
                        className={`hover:bg-slate-50 transition-colors ${
                          row.status === 'POSTED' ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3.5 font-bold text-slate-900">
                          {row.monthLabel}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-slate-600">
                          {row.dueDate}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-right text-emerald-700">
                          {formatPHP(row.monthlyPrincipal)}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-right text-amber-700">
                          {formatPHP(row.monthlyInterest)}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-black text-right text-slate-950">
                          {formatPHP(row.monthlyTotal)}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-semibold text-right text-slate-700">
                          {formatPHP(row.remainingBalance)}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {row.status === 'POSTED' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              PAID (POSTED)
                            </span>
                          ) : row.status === 'PARTIAL' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {row.postedInstallments}/{row.totalInstallmentsInMonth} CUTOFFS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              <Clock className="w-3 h-3 text-slate-400" />
                              SCHEDULED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="sticky bottom-0 bg-slate-50 font-bold text-xs border-t-2 border-slate-200 text-slate-900 shadow-inner">
                    <tr>
                      <td colSpan={2} className="py-3 px-3.5 uppercase tracking-wider text-slate-600">
                        Total Sum:
                      </td>
                      <td className="py-3 px-3.5 font-mono text-right text-emerald-700">
                        {formatPHP(totalPrincipal)}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-right text-amber-700">
                        {formatPHP(totalInterest)}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-right text-slate-950 text-sm">
                        {formatPHP(totalPayable)}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-right text-rose-700">
                        Bal: {formatPHP(balance)}
                      </td>
                      <td className="py-3 px-3.5 text-center text-[10px] text-slate-500">
                        {monthlyData.filter(m => m.status === 'POSTED').length} of {monthlyData.length} Mos Settled
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Semi-Monthly Payroll Cutoff Ledger */}
        {viewMode === 'semi-monthly' && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-3">Payday Due</th>
                      <th className="py-3 px-3">Payroll Cutoff</th>
                      <th className="py-3 px-3 font-mono text-right text-emerald-700">Principal Portion</th>
                      <th className="py-3 px-3 font-mono text-right text-amber-700">Interest Portion</th>
                      <th className="py-3 px-3 font-mono text-right text-slate-900">Semi-Monthly Deduction</th>
                      <th className="py-3 px-3 font-mono text-right text-slate-700">Balance After</th>
                      <th className="py-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(loan.schedules || []).map(s => (
                      <tr
                        key={s.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          s.status === 'POSTED' ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {s.installmentNo}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">
                          {s.dueDate}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <span className="font-semibold text-slate-800">{s.cutoffPeriod}</span> Cutoff Payday
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-right text-emerald-700">
                          {formatPHP(s.principal)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-right text-amber-700">
                          {formatPHP(s.interest)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-slate-950">
                          {formatPHP(s.amount)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-slate-700">
                          {formatPHP(s.balanceAfter)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {s.status === 'POSTED' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              POSTED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              <Clock className="w-3 h-3 text-slate-400" />
                              SCHEDULED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Legal Footer Note */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Certified OPEC Amortization Ledger. Automatic salary deduction authorized under OPEC Article 4 By-Laws.
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
            >
              Close Ledger View
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
