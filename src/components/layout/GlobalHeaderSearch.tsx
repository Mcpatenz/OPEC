import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, LoanApplication, LoanAccount } from '../../types';
import { evaluateEmployeeCbu } from '../../lib/cbu/cbuCalculator';
import { formatPHP } from '../../lib/loans/calculator';
import { calculateYearsOfService } from '../../lib/loans/eligibility';
import {
  Search,
  X,
  User,
  CreditCard,
  BadgeDollarSign,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coins,
  Building,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface GlobalHeaderSearchProps {
  portalMode: 'admin' | 'employee';
  setPortalMode: (mode: 'admin' | 'employee') => void;
  setActiveTab: (tab: string) => void;
}

export const GlobalHeaderSearch: React.FC<GlobalHeaderSearchProps> = ({
  portalMode,
  setPortalMode,
  setActiveTab,
}) => {
  const { employees, applications, activeLoans, branches, loanProducts } = useApp();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'employees' | 'loans'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Inspector modal states
  const [inspectedEmployee, setInspectedEmployee] = useState<Employee | null>(null);
  const [inspectedApp, setInspectedApp] = useState<LoanApplication | null>(null);
  const [inspectedLoan, setInspectedLoan] = useState<LoanAccount | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: Cmd+K / Ctrl+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setInspectedEmployee(null);
        setInspectedApp(null);
        setInspectedLoan(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmed = query.trim().toLowerCase();

  // Search Results
  const matchingEmployees = employees.filter(emp => {
    if (!trimmed) return false;
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const empNo = emp.employeeNumber.toLowerCase();
    const id = emp.id.toLowerCase();
    const pos = emp.position.toLowerCase();
    const email = emp.email.toLowerCase();
    return (
      empNo.includes(trimmed) ||
      id.includes(trimmed) ||
      fullName.includes(trimmed) ||
      pos.includes(trimmed) ||
      email.includes(trimmed)
    );
  });

  const matchingApplications = applications.filter(app => {
    if (!trimmed) return false;
    const appNo = app.applicationNo.toLowerCase();
    const id = app.id.toLowerCase();
    const borrower = employees.find(e => e.id === app.employeeId);
    const borrowerName = borrower ? `${borrower.firstName} ${borrower.lastName}`.toLowerCase() : '';
    const borrowerNo = borrower ? borrower.employeeNumber.toLowerCase() : '';
    const product = loanProducts.find(p => p.id === app.loanProductId);
    const prodName = product ? product.name.toLowerCase() : '';

    return (
      appNo.includes(trimmed) ||
      id.includes(trimmed) ||
      borrowerName.includes(trimmed) ||
      borrowerNo.includes(trimmed) ||
      prodName.includes(trimmed)
    );
  });

  const matchingLoans = activeLoans.filter(loan => {
    if (!trimmed) return false;
    const loanNo = loan.loanNumber.toLowerCase();
    const borrower = employees.find(e => e.id === loan.employeeId);
    const borrowerName = borrower ? `${borrower.firstName} ${borrower.lastName}`.toLowerCase() : '';
    const borrowerNo = borrower ? borrower.employeeNumber.toLowerCase() : '';
    return loanNo.includes(trimmed) || borrowerName.includes(trimmed) || borrowerNo.includes(trimmed);
  });

  const totalResults =
    (filterType === 'all' || filterType === 'employees' ? matchingEmployees.length : 0) +
    (filterType === 'all' || filterType === 'loans' ? matchingApplications.length + matchingLoans.length : 0);

  const handleSelectEmployee = (emp: Employee) => {
    setInspectedEmployee(emp);
    setIsOpen(false);
  };

  const handleSelectApp = (app: LoanApplication) => {
    setInspectedApp(app);
    setIsOpen(false);
  };

  const handleSelectLoan = (loan: LoanAccount) => {
    setInspectedLoan(loan);
    setIsOpen(false);
  };

  const navigateToMembers = () => {
    setPortalMode('admin');
    setActiveTab('admin-members');
    setInspectedEmployee(null);
  };

  const navigateToApplications = () => {
    setPortalMode('admin');
    setActiveTab('admin-loan-applications');
    setInspectedApp(null);
  };

  const navigateToApprovals = () => {
    setPortalMode('admin');
    setActiveTab('admin-loan-approvals');
    setInspectedApp(null);
  };

  const navigateToActiveLoans = () => {
    setPortalMode('admin');
    setActiveTab('admin-active-loans');
    setInspectedLoan(null);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
      {/* Search Bar Input */}
      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search by ID, name, or loan ref #..."
          className="w-full pl-9 pr-16 py-1.5 text-xs rounded-xl bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-slate-100 placeholder-slate-400 transition-all focus:outline-hidden"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-700/60 rounded border border-slate-600/60">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-200 text-xs divide-y divide-slate-800/80 animate-in fade-in duration-100 max-h-[80vh] flex flex-col">
          {/* Top header & filter chips */}
          <div className="p-2.5 bg-slate-800/60 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              System Wide Search {query && `(${totalResults} found)`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  filterType === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('employees')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  filterType === 'employees' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Employees ({matchingEmployees.length})
              </button>
              <button
                onClick={() => setFilterType('loans')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  filterType === 'loans' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Loans ({matchingApplications.length + matchingLoans.length})
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto max-h-96 divide-y divide-slate-800/50">
            {/* If query is empty: helpful suggestions */}
            {!query && (
              <div className="p-4 space-y-3">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Quick Search Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['ML-0001', 'Juan', 'Maria', 'APP-2026-001', 'LN-2026-001', 'Area A'].map(term => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 font-mono text-[11px] transition-colors cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Type an employee number, member name, or loan application #</span>
                  <span className="font-mono text-[10px]">Esc to close</span>
                </div>
              </div>
            )}

            {/* No matches */}
            {query && totalResults === 0 && (
              <div className="p-6 text-center space-y-2">
                <Search className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-semibold">No results found for "{query}"</p>
                <p className="text-[11px] text-slate-500">
                  Try searching by Employee Number (e.g. ML-0001), first/last name, or Application reference # (e.g. APP-2026-001).
                </p>
              </div>
            )}

            {/* Employees Section */}
            {(filterType === 'all' || filterType === 'employees') && matchingEmployees.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  <span>Employees & Members ({matchingEmployees.length})</span>
                </div>
                <div className="divide-y divide-slate-800/40">
                  {matchingEmployees.map(emp => {
                    const empCbu = evaluateEmployeeCbu(emp);
                    const branch = branches.find(b => b.id === emp.branchId);
                    return (
                      <button
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp)}
                        className="w-full px-3 py-2.5 text-left hover:bg-slate-800/80 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 border border-amber-400/40 shrink-0 flex items-center justify-center font-bold text-xs text-amber-300">
                            {emp.avatarUrl ? (
                              <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              emp.firstName.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                                {emp.firstName} {emp.lastName}
                              </span>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {emp.employeeNumber}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                  emp.employmentStatus === 'PERMANENT'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : emp.employmentStatus === 'RESIGNED' || emp.employmentStatus === 'AWOL'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {emp.employmentStatus}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {emp.position} · {branch?.name || emp.areaName || 'ZASURMIS'}
                            </p>
                          </div>
                        </div>

                        {/* CBU quick preview pill */}
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-amber-400 text-xs block">
                            CBU: {formatPHP(empCbu.totalCbu)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            10% Retainer: {formatPHP(empCbu.retainersFee)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Loan Applications Section */}
            {(filterType === 'all' || filterType === 'loans') && matchingApplications.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" />
                  <span>Loan Applications ({matchingApplications.length})</span>
                </div>
                <div className="divide-y divide-slate-800/40">
                  {matchingApplications.map(app => {
                    const borrower = employees.find(e => e.id === app.employeeId);
                    const prod = loanProducts.find(p => p.id === app.loanProductId);
                    return (
                      <button
                        key={app.id}
                        onClick={() => handleSelectApp(app)}
                        className="w-full px-3 py-2.5 text-left hover:bg-slate-800/80 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-400 group-hover:underline">
                                {app.applicationNo}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                                {app.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              Borrower: <strong className="text-white">{borrower?.firstName} {borrower?.lastName}</strong> ({borrower?.employeeNumber}) · {prod?.name}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-white text-xs block">
                            {formatPHP(app.requestedAmount)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{app.termMonths} mos</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Loan Accounts Section */}
            {(filterType === 'all' || filterType === 'loans') && matchingLoans.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <BadgeDollarSign className="w-3 h-3" />
                  <span>Active Loan Accounts ({matchingLoans.length})</span>
                </div>
                <div className="divide-y divide-slate-800/40">
                  {matchingLoans.map(loan => {
                    const borrower = employees.find(e => e.id === loan.employeeId);
                    return (
                      <button
                        key={loan.id}
                        onClick={() => handleSelectLoan(loan)}
                        className="w-full px-3 py-2.5 text-left hover:bg-slate-800/80 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <BadgeDollarSign className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-emerald-400 group-hover:underline">
                                {loan.loanNumber}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                                {loan.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              Borrower: <strong className="text-white">{borrower?.firstName} {borrower?.lastName}</strong> ({borrower?.employeeNumber})
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-white text-xs block">
                            Bal: {formatPHP(loan.balance)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Mat: {loan.maturityDate}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-2 bg-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Press Esc to close · Click item for full inspector</span>
            <span className="text-amber-400 font-medium">Administrator Global Index</span>
          </div>
        </div>
      )}

      {/* Employee Quick Inspector Modal */}
      {inspectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto text-xs animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 shadow-sm shrink-0">
                  {inspectedEmployee.avatarUrl ? (
                    <img src={inspectedEmployee.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-base text-slate-800 dark:text-slate-100">
                      {inspectedEmployee.firstName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {inspectedEmployee.firstName} {inspectedEmployee.middleName || ''} {inspectedEmployee.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-700">
                      {inspectedEmployee.employeeNumber}
                    </span>
                    <span className="font-semibold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {inspectedEmployee.employmentStatus}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectedEmployee(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Station Details */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px]">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Position:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectedEmployee.position}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Station:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectedEmployee.areaName || 'Area A'} · Reg 20</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Service Tenure:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {calculateYearsOfService(inspectedEmployee.dateHired).formatted}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Monthly Salary:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatPHP(inspectedEmployee.monthlySalary)}
                </span>
              </div>
            </div>

            {/* CBU & Retainers Fee Analysis Box */}
            {(() => {
              const empCbu = evaluateEmployeeCbu(inspectedEmployee);
              return (
                <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-700/60 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-amber-200 dark:border-amber-700/40">
                    <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Capital Build-Up (₱100/payday) & 10% Retainer Fee
                    </span>
                    <span className="font-mono text-[10px] text-amber-800 dark:text-amber-300 font-bold">
                      {empCbu.paydaysCount} Paydays
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-amber-200/80 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Total CBU:</span>
                      <span className="font-bold font-mono text-amber-700 dark:text-amber-400">{formatPHP(empCbu.totalCbu)}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-rose-200/80 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] block">10% Retainer (OPEC):</span>
                      <span className="font-bold font-mono text-rose-600 dark:text-rose-400">{formatPHP(empCbu.retainersFee)}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200/80 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] block">90% Net Refund:</span>
                      <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">{formatPHP(empCbu.netRefundableCbu)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300">
                    {empCbu.statusPolicyNote}
                  </p>
                </div>
              );
            })()}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setInspectedEmployee(null)}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                Close
              </button>
              <button
                onClick={navigateToMembers}
                className="flex items-center gap-1.5 px-4 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
              >
                <span>Open in Members Registry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loan Application Quick Inspector Modal */}
      {inspectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto text-xs animate-in fade-in duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    {inspectedApp.applicationNo}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    Status: {inspectedApp.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectedApp(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Application Overview */}
            {(() => {
              const borrower = employees.find(e => e.id === inspectedApp.employeeId);
              const prod = loanProducts.find(p => p.id === inspectedApp.loanProductId);
              return (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Borrower:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {borrower?.firstName} {borrower?.lastName} ({borrower?.employeeNumber})
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Loan Facility:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{prod?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Requested Amount:</span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-sm">
                        {formatPHP(inspectedApp.requestedAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Term / Repayment:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {inspectedApp.termMonths} Months · 2x Monthly Payday
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Purpose:</span>
                      <span className="text-slate-700 dark:text-slate-300 italic">{inspectedApp.purpose}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-300">
                    <strong>Co-Makers:</strong> {inspectedApp.coMakers.length} co-maker(s) registered and evaluated under OPEC cross-guarantee limits.
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setInspectedApp(null)}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={navigateToApprovals}
                  className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Credit Committee
                </button>
                <button
                  onClick={navigateToApplications}
                  className="flex items-center gap-1.5 px-4 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
                >
                  <span>Open Pipeline View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Loan Quick Inspector Modal */}
      {inspectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto text-xs animate-in fade-in duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                  <BadgeDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    {inspectedLoan.loanNumber}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    Active Credit Account
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectedLoan(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const borrower = employees.find(e => e.id === inspectedLoan.employeeId);
              return (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Borrower:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {borrower?.firstName} {borrower?.lastName} ({borrower?.employeeNumber})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Principal Released:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formatPHP(inspectedLoan.principal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Outstanding Balance:</span>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-sm">{formatPHP(inspectedLoan.balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Amount Paid to Date:</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatPHP(inspectedLoan.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Maturity Date:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{inspectedLoan.maturityDate}</span>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setInspectedLoan(null)}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                Close
              </button>
              <button
                onClick={navigateToActiveLoans}
                className="flex items-center gap-1.5 px-4 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
              >
                <span>Open Active Loans Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
