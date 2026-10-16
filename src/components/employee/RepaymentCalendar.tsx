import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../lib/loans/calculator';
import { LoanAccount, LoanAmortizationSchedule } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  DollarSign,
  ArrowRight,
  Info,
  CalendarDays,
  Sparkles,
  FileSpreadsheet,
  X,
} from 'lucide-react';

interface RepaymentCalendarProps {
  setActiveTab?: (tab: string) => void;
  onSelectLoanForSchedule?: (loan: LoanAccount) => void;
  className?: string;
}

interface DayPaymentInfo {
  loan: LoanAccount;
  schedule: LoanAmortizationSchedule;
}

interface NextUpcomingPayment {
  dateStr: string;
  daysLeft: number;
  amount: number;
  loanNumber: string;
}

export const RepaymentCalendar: React.FC<RepaymentCalendarProps> = ({
  setActiveTab,
  onSelectLoanForSchedule,
  className = '',
}) => {
  const { currentUser, employees, activeLoans, loanProducts } = useApp();

  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const myLoans = useMemo(() => {
    return activeLoans.filter(l => l.employeeId === applicant.id && l.status === 'ACTIVE');
  }, [activeLoans, applicant]);

  // Reference today date in this environment: October 6, 2026
  const referenceToday = useMemo(() => new Date('2026-10-06T00:00:00'), []);

  // Calendar view state: Year and Month (0-indexed: 9 = October)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 9 = October
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-10-10');
  const [viewingScheduleModalLoan, setViewingScheduleModalLoan] = useState<LoanAccount | null>(null);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(referenceToday.getFullYear());
    setCurrentMonth(referenceToday.getMonth());
    setSelectedDateStr(referenceToday.toISOString().split('T')[0]);
  };

  // Build calendar matrix for currentYear and currentMonth
  const calendarData = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Map all schedules of myLoans for quick lookup by YYYY-MM-DD
    const paymentsByDate: Record<string, DayPaymentInfo[]> = {};
    let totalMonthScheduled = 0;
    let totalMonthPaid = 0;

    myLoans.forEach(loan => {
      loan.schedules.forEach(schedule => {
        const dateStr = schedule.dueDate;
        if (!paymentsByDate[dateStr]) {
          paymentsByDate[dateStr] = [];
        }
        paymentsByDate[dateStr].push({ loan, schedule });

        // If falls within this month
        const d = new Date(dateStr + 'T00:00:00');
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          if (schedule.status === 'POSTED') {
            totalMonthPaid += schedule.amount;
          } else {
            totalMonthScheduled += schedule.amount;
          }
        }
      });
    });

    const days: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      payments: DayPaymentInfo[];
    }> = [];

    // Previous month padding days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      days.push({
        dayNumber: prevDay,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === referenceToday.toISOString().split('T')[0],
        payments: paymentsByDate[dateStr] || [],
      });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === referenceToday.toISOString().split('T')[0],
        payments: paymentsByDate[dateStr] || [],
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNumber: i,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === referenceToday.toISOString().split('T')[0],
        payments: paymentsByDate[dateStr] || [],
      });
    }

    return {
      days,
      paymentsByDate,
      totalMonthScheduled,
      totalMonthPaid,
    };
  }, [currentYear, currentMonth, myLoans, referenceToday]);

  // Selected date payment details
  const selectedDatePayments = useMemo(() => {
    return calendarData.paymentsByDate[selectedDateStr] || [];
  }, [calendarData, selectedDateStr]);

  // Formatted selected date
  const selectedDateFormatted = useMemo(() => {
    const d = new Date(selectedDateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDateStr]);

  // Next upcoming payment relative to today
  const nextUpcoming = useMemo<NextUpcomingPayment | null>(() => {
    let nearest: NextUpcomingPayment | null = null;
    let minDays = Infinity;

    myLoans.forEach(loan => {
      loan.schedules.forEach(schedule => {
        if (schedule.status === 'SCHEDULED') {
          const d = new Date(schedule.dueDate + 'T00:00:00');
          const diff = Math.ceil((d.getTime() - referenceToday.getTime()) / (1000 * 60 * 60 * 24));
          if (diff >= 0 && diff < minDays) {
            minDays = diff;
            nearest = {
              dateStr: schedule.dueDate,
              daysLeft: diff,
              amount: schedule.amount,
              loanNumber: loan.loanNumber,
            };
          }
        }
      });
    });

    return nearest;
  }, [myLoans, referenceToday]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekDayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 text-white border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Repayment Calendar
                </span>
                <span className="text-xs text-slate-400">· Monthly Payday Deductions View</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">Loan Due Dates & Payroll Schedule</h2>
              <p className="text-xs text-slate-300">
                Track exact upcoming semi-monthly payroll deduction dates (15th & 30th) across all your active OPEC loan facilities.
              </p>
            </div>
          </div>

          {/* Quick Month Navigator Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleGoToToday}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              Current (Oct 2026)
            </button>
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-bold font-mono text-amber-300 whitespace-nowrap min-w-[130px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Summary Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Scheduled This Month:</span>
            <span className="font-bold text-amber-400 font-mono text-sm">
              {formatPHP(calendarData.totalMonthScheduled)}
            </span>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Already Paid This Month:</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              {formatPHP(calendarData.totalMonthPaid)}
            </span>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Active Loan Accounts:</span>
            <span className="font-bold text-white font-mono text-sm">
              {myLoans.length} Facility {myLoans.length === 1 ? '' : 'ies'}
            </span>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Next Payday Deduction:</span>
            <span className="font-bold text-amber-300 text-xs">
              {nextUpcoming ? (
                <>
                  <strong className="font-mono">{formatPHP(nextUpcoming.amount)}</strong>
                  <span className="text-slate-300 ml-1 font-normal">
                    ({nextUpcoming.daysLeft === 0 ? 'Today' : `in ${nextUpcoming.daysLeft}d`})
                  </span>
                </>
              ) : (
                'None scheduled'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar Grid on Left, Day Details Panel on Right */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Calendar Matrix (8 cols on large screens) */}
        <div className="lg:col-span-8 space-y-3">
          
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase text-slate-500 tracking-wider pb-1">
            {weekDayHeaders.map((header, idx) => (
              <div
                key={header}
                className={`py-1.5 rounded-lg ${
                  idx === 0 || idx === 6 ? 'text-slate-400' : 'text-slate-700'
                }`}
              >
                {header}
              </div>
            ))}
          </div>

          {/* Calendar Days Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarData.days.map((cell, idx) => {
              const hasPayments = cell.payments.length > 0;
              const isSelected = cell.dateStr === selectedDateStr;
              const hasScheduled = cell.payments.some(p => p.schedule.status === 'SCHEDULED');
              const hasPosted = cell.payments.some(p => p.schedule.status === 'POSTED');
              const totalAmountOnDay = cell.payments.reduce((sum, p) => sum + p.schedule.amount, 0);

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[82px] sm:min-h-[92px] p-1.5 sm:p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between relative group ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/60 border-slate-100 text-slate-400 opacity-60'
                      : isSelected
                      ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/40 shadow-xs'
                      : hasPayments
                      ? 'bg-white border-amber-300 hover:border-amber-400 hover:shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  {/* Day header: Day number and Today badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                        cell.isToday
                          ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                          : isSelected
                          ? 'bg-slate-900 text-white'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Today Pill */}
                    {cell.isToday && (
                      <span className="text-[9px] font-bold text-amber-700 font-sans uppercase tracking-wider hidden sm:inline">
                        Today
                      </span>
                    )}

                    {/* Status dot if has payment */}
                    {hasPayments && !cell.isToday && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          hasScheduled ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                        }`}
                        title={hasScheduled ? 'Scheduled Deduction' : 'Paid / Posted'}
                      />
                    )}
                  </div>

                  {/* Payment preview chips inside day cell */}
                  {hasPayments ? (
                    <div className="mt-1 space-y-1">
                      <div
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold truncate flex items-center justify-between gap-1 ${
                          hasScheduled
                            ? 'bg-amber-100/90 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        <span className="truncate">{formatPHP(totalAmountOnDay).replace('.00', '')}</span>
                        <span className="text-[8px] font-sans uppercase font-bold shrink-0">
                          {hasScheduled ? 'DUE' : 'PAID'}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 truncate hidden sm:block">
                        {cell.payments.length === 1
                          ? `${cell.payments[0].schedule.cutoffPeriod} Payday`
                          : `${cell.payments.length} Loans`}
                      </div>
                    </div>
                  ) : (
                    <div className="h-4" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-[11px]">Today (Oct 6, 2026)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-400" />
                <span className="text-[11px]">Upcoming Due Date</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400" />
                <span className="text-[11px]">Posted / Deducted</span>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              Click any date to inspect deduction details
            </span>
          </div>
        </div>

        {/* Selected Date Details Panel (4 cols on large screens) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 flex-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Deduction Schedule Details
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                {selectedDateStr}
              </span>
            </div>

            {/* Selected Date Title */}
            <div>
              <h4 className="text-sm font-bold text-slate-900">{selectedDateFormatted}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedDatePayments.length > 0
                  ? `${selectedDatePayments.length} loan payment installment(s) associated with this date.`
                  : 'No loan repayment deductions scheduled for this date.'}
              </p>
            </div>

            {/* Payment item cards */}
            {selectedDatePayments.length > 0 ? (
              <div className="space-y-3">
                {selectedDatePayments.map(({ loan, schedule }) => {
                  const prod = loanProducts.find(p => p.id === loan.loanProductId);
                  const isScheduled = schedule.status === 'SCHEDULED';

                  return (
                    <div
                      key={schedule.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-xs text-slate-900 block">
                            {loan.loanNumber}
                          </span>
                          <span className="text-[11px] text-slate-500">{prod?.name}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isScheduled
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isScheduled ? 'SCHEDULED' : 'POSTED'}
                        </span>
                      </div>

                      {/* Financial values */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Payday Deduction Amount:</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {formatPHP(schedule.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Principal Component:</span>
                          <span className="font-mono font-semibold text-emerald-700">
                            {formatPHP(schedule.principal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Interest Component:</span>
                          <span className="font-mono font-semibold text-amber-700">
                            {formatPHP(schedule.interest)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                          <span>Balance after this payment:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {formatPHP(schedule.balanceAfter)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>
                          Installment #{schedule.installmentNo} · {schedule.cutoffPeriod} cutoff
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectLoanForSchedule) {
                              onSelectLoanForSchedule(loan);
                            } else {
                              setViewingScheduleModalLoan(loan);
                            }
                          }}
                          className="font-bold text-amber-700 hover:text-amber-900 hover:underline"
                        >
                          View Schedule →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400 space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No payroll deductions on {selectedDateFormatted}.</p>
                <p className="text-[11px] text-slate-400">
                  OPEC deductions occur semi-monthly on 15th and 30th salary cutoffs.
                </p>
              </div>
            )}
          </div>

          {/* Quick link to active loans / document vault */}
          {setActiveTab && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div>
                <span className="font-bold block">Need Official Loan Documents?</span>
                <span className="text-[11px] text-amber-800">
                  Agreements, promissory notes, and clearance vouchers.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('emp-vault')}
                className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 shrink-0 shadow-2xs"
              >
                Document Vault →
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Modal for viewing schedule if triggered */}
      {viewingScheduleModalLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {viewingScheduleModalLoan.loanNumber}
                </span>
                <p className="text-[11px] text-slate-500">Semi-monthly payroll deduction schedule</p>
              </div>
              <button
                onClick={() => setViewingScheduleModalLoan(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
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
                    <th className="py-2.5 px-3 font-mono text-right">Deduction</th>
                    <th className="py-2.5 px-3 font-mono text-right">Balance After</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {viewingScheduleModalLoan.schedules.map(s => (
                    <tr
                      key={s.id}
                      className={s.dueDate === selectedDateStr ? 'bg-amber-100/70 font-semibold' : 'hover:bg-slate-50'}
                    >
                      <td className="py-2.5 px-3 font-bold">{s.installmentNo}</td>
                      <td className="py-2.5 px-3">{s.dueDate}</td>
                      <td className="py-2.5 px-3 font-sans">{s.cutoffPeriod}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 text-right">{formatPHP(s.amount)}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700 text-right">{formatPHP(s.balanceAfter)}</td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            s.status === 'POSTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
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
                onClick={() => setViewingScheduleModalLoan(null)}
                className="px-4 py-2 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs"
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
