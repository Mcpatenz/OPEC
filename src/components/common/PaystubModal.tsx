import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../lib/loans/calculator';
import {
  X,
  Printer,
  Download,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Receipt,
  AlertCircle,
  HelpCircle,
  Coins,
} from 'lucide-react';

interface PaystubModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab?: (tab: string) => void;
}

export const PaystubModal: React.FC<PaystubModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
}) => {
  const { currentUser, employees, branches, payrollDeductions, activeLoans, notify } = useApp();

  // Find applicant / employee
  const employee = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const branch = branches.find(b => b.id === employee.branchId);

  // Available pay periods
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-10-15');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter employee's scheduled or posted payroll deductions
  const employeeDeductions = payrollDeductions.filter(d => d.employeeId === employee.id);
  const currentDeduction = employeeDeductions.find(d => d.payrollPeriod.includes(selectedPeriod)) ||
    employeeDeductions[0];

  const employeeLoans = activeLoans.filter(l => l.employeeId === employee.id);
  const totalLoanBalance = employeeLoans.reduce((sum, l) => sum + l.balance, 0);

  // Realistic Philippine Semi-Monthly Payroll Figures based on employee position
  const baseSalaryMonthly = employee.position.toLowerCase().includes('manager')
    ? 42000
    : employee.position.toLowerCase().includes('officer') || employee.position.toLowerCase().includes('specialist')
    ? 28500
    : 21000;

  const basicPaySemiMonthly = baseSalaryMonthly / 2;
  const riceAllowance = 1250;
  const branchAllowance = 750;
  const opecHonorarium = employee.opecPosition ? 1000 : 0;
  const grossPay = basicPaySemiMonthly + riceAllowance + branchAllowance + opecHonorarium;

  // Deductions
  const opecLoanDeduction = currentDeduction ? currentDeduction.scheduledAmount : 1750;
  const opecCbuDeduction = 100; // Mandatory ₱100 per payday for OPEC Capital Build-Up (CBU)
  const sssContribution = Math.round(basicPaySemiMonthly * 0.045);
  const philHealth = Math.round(basicPaySemiMonthly * 0.025);
  const pagIbig = 100;
  const withholdingTax = Math.round((grossPay - (sssContribution + philHealth + pagIbig)) * 0.05);

  const totalDeductions =
    opecLoanDeduction + opecCbuDeduction + sssContribution + philHealth + pagIbig + withholdingTax;
  const netTakeHomePay = Math.max(0, grossPay - totalDeductions);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    setDownloadSuccess(true);
    notify(
      'Paystub Voucher Downloaded',
      `Official payslip for period ending ${selectedPeriod} has been generated as PDF.`,
      'INFO'
    );
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Official Payslip Voucher
                </span>
                <span className="text-xs text-slate-400">· Semi-Monthly Payroll</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Employee Compensation & Loan Deduction Statement
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Print Paystub"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pay Period Selector & Quick Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-700">Payroll Cutoff Period:</span>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1 font-semibold text-slate-900 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="2026-10-15">October 1 - 15, 2026 (Current Cutoff)</option>
              <option value="2026-09-30">September 16 - 30, 2026 (Posted)</option>
              <option value="2026-09-15">September 1 - 15, 2026 (Posted)</option>
              <option value="2026-08-31">August 16 - 31, 2026 (Archived)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {downloadSuccess ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Voucher PDF Saved
              </span>
            ) : (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-lg shadow-2xs transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Export PDF Voucher
              </button>
            )}
          </div>
        </div>

        {/* Paystub Printable Body */}
        <div className="p-6 space-y-6 text-xs" id="printable-paystub">
          
          {/* Header Info Block */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[11px] text-slate-500 block">Employee Name:</span>
              <span className="font-bold text-slate-900 text-sm">
                {employee.firstName} {employee.lastName}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                ID: {employee.employeeNumber}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Designation / Role:</span>
              <span className="font-semibold text-slate-800">{employee.position}</span>
              <span className="text-[10px] text-amber-700 font-medium block">
                OPEC {employee.opecPosition || 'Member'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Branch Assigned:</span>
              <span className="font-semibold text-slate-800">{branch?.name || 'Main Branch'}</span>
              <span className="text-[10px] text-slate-400 block">Ozamiz & Pagadian Division</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Disbursement Mode:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                BPI Payroll ATM Deposit
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">Ref: {currentDeduction?.payrollReference || 'PR-2026-10-A'}</span>
            </div>
          </div>

          {/* Earnings & Deductions Comparison Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Earnings Column */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-100/80 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between border-b border-slate-200">
                <span>GROSS EARNINGS</span>
                <span className="font-mono text-emerald-700 font-bold">{formatPHP(grossPay)}</span>
              </div>
              <div className="p-4 space-y-2.5 divide-y divide-slate-100">
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-600">Basic Semi-Monthly Salary</span>
                  <span className="font-mono font-semibold text-slate-900">{formatPHP(basicPaySemiMonthly)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-600">Rice Subsidy Allowance</span>
                  <span className="font-mono font-semibold text-slate-900">{formatPHP(riceAllowance)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-600">Branch Transportation Allowance</span>
                  <span className="font-mono font-semibold text-slate-900">{formatPHP(branchAllowance)}</span>
                </div>
                {opecHonorarium > 0 && (
                  <div className="flex justify-between items-center pt-2 text-amber-800">
                    <span className="flex items-center gap-1 font-medium">
                      OPEC Executive Committee Honorarium
                    </span>
                    <span className="font-mono font-semibold">{formatPHP(opecHonorarium)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 text-slate-400 text-[11px]">
                  <span>Special Overtime / Holiday Pay</span>
                  <span className="font-mono">₱0.00</span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-rose-50/60 px-4 py-2.5 font-bold text-rose-900 flex items-center justify-between border-b border-rose-100">
                <span>ITEMIZED DEDUCTIONS</span>
                <span className="font-mono text-rose-700 font-bold">{formatPHP(totalDeductions)}</span>
              </div>
              <div className="p-4 space-y-2.5 divide-y divide-slate-100">
                {/* Highlighted OPEC Loan Deduction */}
                <div className="flex justify-between items-center pt-1 bg-amber-50/80 -mx-2 px-2 py-1 rounded-md border border-amber-200/80">
                  <div>
                    <span className="font-bold text-amber-950 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                      OPEC Loan Payroll Deduction
                    </span>
                    <span className="text-[10px] text-amber-800 block">
                      Ref: {currentDeduction?.payrollReference || 'LN-AMORT-01'} · Semi-monthly
                    </span>
                  </div>
                  <span className="font-mono font-bold text-amber-900 text-sm">
                    {formatPHP(opecLoanDeduction)}
                  </span>
                </div>

                {/* Mandatory OPEC Capital Build-Up (CBU) */}
                <div className="flex justify-between items-center pt-2 bg-amber-50/40 -mx-2 px-2 py-1.5 rounded-md border border-amber-200/50">
                  <div>
                    <span className="font-bold text-amber-950 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      OPEC Capital Build-Up (CBU)
                    </span>
                    <span className="text-[10px] text-amber-800 block">
                      Mandatory Member Equity · ₱100.00 / payday (10% Retainer Policy)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-amber-900">
                    {formatPHP(opecCbuDeduction)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-600">Social Security System (SSS)</span>
                  <span className="font-mono font-semibold text-slate-900">{formatPHP(sssContribution)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-600">PhilHealth National Insurance</span>
                  <span className="font-mono font-semibold text-slate-900">{formatPHP(philHealth)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-600">Pag-IBIG Home Dev. Mutual Fund</span>
                  <span className="font-mono font-semibold text-slate-900">{formatPHP(pagIbig)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-600">Bureau of Internal Revenue (Withholding Tax)</span>
                  <span className="font-mono font-semibold text-slate-900">{formatPHP(withholdingTax)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Net Pay Callout Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-xl p-5 border border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Net Take-Home Pay (Credited to Payroll Account)
              </span>
              <div className="text-3xl font-black font-mono mt-0.5 tracking-tight text-white">
                {formatPHP(netTakeHomePay)}
              </div>
              <p className="text-[11px] text-emerald-200 mt-1">
                Amount credited on scheduled cutoff date via M Lhuillier ML Kwarta / BPI Corporate Link.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 text-[11px] space-y-1 text-slate-100 sm:max-w-xs border border-white/10">
              <div className="flex justify-between">
                <span>Gross Income:</span>
                <span className="font-mono font-bold">{formatPHP(grossPay)}</span>
              </div>
              <div className="flex justify-between text-rose-300">
                <span>Total Deductions:</span>
                <span className="font-mono font-bold">- {formatPHP(totalDeductions)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-white/20 text-emerald-300">
                <span>Net Ratio:</span>
                <span>{((netTakeHomePay / grossPay) * 100).toFixed(1)}% Take-Home</span>
              </div>
            </div>
          </div>

          {/* Active OPEC Credit Facility Balance & Repayment Status */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-xs">
                  OPEC Credit Facility Status Summary
                </h4>
              </div>
              {setActiveTab && (
                <button
                  onClick={() => {
                    onClose();
                    setActiveTab('emp-calendar');
                  }}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
                >
                  View Amortization Calendar
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Total Active Balance:</span>
                <span className="font-bold font-mono text-slate-900 text-sm">
                  {formatPHP(totalLoanBalance)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Across {employeeLoans.length} approved loans
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Next Scheduled Deduction:</span>
                <span className="font-bold font-mono text-amber-700 text-sm">
                  {formatPHP(opecLoanDeduction)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Cutoff: October 30, 2026
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Deduction Method:</span>
                <span className="font-bold text-emerald-700 text-xs block mt-0.5">
                  Automatic Payroll Slash
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Audited by OPEC Treasurer
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center italic border-t border-slate-100 pt-3">
            This voucher serves as an official electronic reproduction of your OPEC Aurum Gems salary deduction and payslip summary. For discrepancies, contact the Payroll Master or OPEC Auditor.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Document Voucher ID: OAG-PAY-2026-X812
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Official Voucher
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
