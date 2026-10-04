import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ReleaseMethod } from '../../types';
import { calculateYearsOfService, evaluateLoanEligibility, validateCoMaker } from '../../lib/loans/eligibility';
import { calculateLoanFinancials, formatPHP } from '../../lib/loans/calculator';
import {
  FileText,
  User,
  Calculator,
  Users2,
  Send,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowRight,
  ArrowLeft,
  Info,
  DollarSign,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface WizardProps {
  onSuccess: (appNo: string) => void;
  onCancel?: () => void;
}

export const LoanApplicationWizard: React.FC<WizardProps> = ({ onSuccess, onCancel }) => {
  const { currentUser, employees, loanProducts, activeLoans, applyForLoan } = useApp();

  // Find applicant record
  const applicant = useMemo(() => {
    return employees.find(e => e.id === currentUser.employeeId) || employees[0];
  }, [employees, currentUser]);

  const applicantService = useMemo(() => {
    return calculateYearsOfService(applicant.dateHired);
  }, [applicant]);

  // Existing debt for applicant
  const existingBalance = useMemo(() => {
    return activeLoans
      .filter(l => l.employeeId === applicant.id && l.status === 'ACTIVE')
      .reduce((sum, l) => sum + l.balance, 0);
  }, [activeLoans, applicant]);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState(loanProducts[0]?.id || '');
  const selectedProduct = useMemo(() => {
    return loanProducts.find(p => p.id === selectedProductId) || loanProducts[0];
  }, [loanProducts, selectedProductId]);

  // Eligibility evaluation
  const eligibility = useMemo(() => {
    return evaluateLoanEligibility(applicant, selectedProduct, existingBalance);
  }, [applicant, selectedProduct, existingBalance]);

  // Loan parameters
  const [requestedAmount, setRequestedAmount] = useState<number>(20000);
  const [termMonths, setTermMonths] = useState<number>(18);
  const [purpose, setPurpose] = useState<string>('Commodity purchase for household & education');
  const [releaseMethod, setReleaseMethod] = useState<ReleaseMethod>('BANK_CHECK');
  const [releaseDetails, setReleaseDetails] = useState<string>('ML Ozamiz 1 Branch Manager Check');

  // Co-makers
  const [selectedCoMakers, setSelectedCoMakers] = useState<string[]>([]);

  // Agreements
  const [agreeDeduction, setAgreeDeduction] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeCorrect, setAgreeCorrect] = useState(false);

  // Simulated documents
  const [payslipUploaded, setPayslipUploaded] = useState(true);
  const [quotationUploaded, setQuotationUploaded] = useState(true);

  // Financial preview calculation
  const financials = useMemo(() => {
    return calculateLoanFinancials(requestedAmount, termMonths, selectedProduct);
  }, [requestedAmount, termMonths, selectedProduct]);

  // Available co-maker candidates (excluding applicant)
  const candidateCoMakers = useMemo(() => {
    return employees.filter(e => e.id !== applicant.id);
  }, [employees, applicant]);

  const handleSelectCoMaker = (index: number, empId: string) => {
    const updated = [...selectedCoMakers];
    updated[index] = empId;
    setSelectedCoMakers(updated.filter(Boolean));
  };

  const handleRemoveCoMaker = (empId: string) => {
    setSelectedCoMakers(prev => prev.filter(id => id !== empId));
  };

  const isCoMakerValid = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return { valid: false, reason: 'Not found' };
    return validateCoMaker(
      emp,
      applicant,
      selectedCoMakers.filter(id => id !== empId),
      selectedProduct.minServiceYearsCoMaker
    );
  };

  const canProceedStep2 = eligibility.eligible;
  const canProceedStep3 = requestedAmount > 0 && requestedAmount <= selectedProduct.maxAmount && purpose.trim().length > 3;
  const canProceedStep4 =
    selectedCoMakers.length >= selectedProduct.requiredCoMakers &&
    selectedCoMakers.every(id => isCoMakerValid(id).valid);
  const canProceedStep5 = releaseDetails.trim().length > 2;
  const canSubmit = agreeDeduction && agreeTerms && agreeCorrect;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyForLoan({
      employeeId: applicant.id,
      loanProductId: selectedProduct.id,
      requestedAmount,
      termMonths,
      purpose,
      coMakers: selectedCoMakers,
      releaseMethod,
      releaseDetails,
    });

    if (res.success && res.applicationNo) {
      onSuccess(res.applicationNo);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-amber-400 text-xs font-bold tracking-wider uppercase">
              OPEC Aurum Gems · May 2025 Form
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1">
              Employee Loan Application
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Strict compliance with OPEC credit rules, co-maker service checks, and semi-monthly payroll deductions.
            </p>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-xs text-slate-400">Applicant:</span>
            <div className="text-sm font-bold text-amber-400">{applicant.firstName} {applicant.lastName}</div>
            <div className="text-xs text-slate-400 font-mono">{applicant.employeeNumber}</div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-6 gap-2 mt-6 pt-4 border-t border-slate-700/60">
          {[
            { step: 1, label: 'Applicant' },
            { step: 2, label: 'Loan Details' },
            { step: 3, label: 'Co-Makers' },
            { step: 4, label: 'Release' },
            { step: 5, label: 'Documents' },
            { step: 6, label: 'Agreement' },
          ].map(s => (
            <div
              key={s.step}
              className={`text-center py-1.5 px-1 rounded transition-colors ${
                currentStep === s.step
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : currentStep > s.step
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-500'
              }`}
            >
              <div className="text-[10px] font-mono leading-none">Step {s.step}</div>
              <div className="text-xs truncate font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Step 1: Applicant Profile (Auto-populated & Computed) */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <User className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Step 1 — Applicant Verification</h3>
                <p className="text-xs text-slate-500">Automatically pulled from employee records & years of service calculator.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500">Employee Name</span>
                <p className="text-sm font-bold text-slate-900">{applicant.firstName} {applicant.middleName || ''} {applicant.lastName}</p>
                <p className="text-xs text-slate-600 font-mono">{applicant.employeeNumber}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Position</span>
                <p className="text-sm font-semibold text-slate-800">{applicant.position}</p>
                <p className="text-xs text-amber-700 font-medium">OPEC Member ({applicant.opecPosition || 'Member'})</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Branch & Area</span>
                <p className="text-sm font-semibold text-slate-800">ML Ozamiz 1</p>
                <p className="text-xs text-slate-600">Ozamiz Area · Region 10</p>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <span className="text-xs text-slate-500">Date Hired</span>
                <p className="text-sm font-semibold text-slate-800">{applicant.dateHired}</p>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <span className="text-xs text-slate-500">Years of Service (Computed)</span>
                <p className="text-sm font-bold text-emerald-700">{applicantService.formatted}</p>
                <p className="text-[11px] text-slate-500">({applicantService.totalDecimalYears} years)</p>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <span className="text-xs text-slate-500">Employment Status</span>
                <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${
                  applicant.employmentStatus === 'PERMANENT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {applicant.employmentStatus}
                </span>
              </div>
            </div>

            {/* Eligibility Banner */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              eligibility.eligible
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {eligibility.eligible ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold text-sm">
                  {eligibility.eligible ? 'Applicant Is Fully Eligible' : 'Eligibility Restriction Detected'}
                </span>
                <p className="text-xs mt-0.5 leading-relaxed">
                  {eligibility.eligible
                    ? `Permanent employee with over 5 years of service. Maximum loan capacity up to ${formatPHP(eligibility.maximumLoanAmount)} with up to ${eligibility.maximumTermMonths} months term.`
                    : eligibility.disqualificationReasons.join(' ')}
                </p>
                {existingBalance > 0 && (
                  <p className="text-xs mt-1 text-slate-700">
                    Existing active debt: <span className="font-mono font-bold">{formatPHP(existingBalance)}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                disabled={!canProceedStep2}
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Proceed to Loan Selection
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Loan Selection, Amount & Calculator */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <Calculator className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Step 2 — Loan Product & Financial Terms</h3>
                <p className="text-xs text-slate-500">Live calculation with 1.5% interest and semi-monthly payday deductions.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product selector & fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Loan Facility
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={e => {
                      setSelectedProductId(e.target.value);
                      const prod = loanProducts.find(p => p.id === e.target.value);
                      if (prod && requestedAmount > prod.maxAmount) {
                        setRequestedAmount(prod.maxAmount);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {loanProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Max {formatPHP(p.maxAmount)} · {p.interestRate}% int)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">{selectedProduct.description}</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Requested Loan Amount
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-700">
                      {formatPHP(requestedAmount)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={selectedProduct.minAmount}
                    max={selectedProduct.maxAmount}
                    step={1000}
                    value={requestedAmount}
                    onChange={e => setRequestedAmount(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>Min: {formatPHP(selectedProduct.minAmount)}</span>
                    <span>Max: {formatPHP(selectedProduct.maxAmount)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Repayment Term (Months)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[6, 12, 18, 24].map(months => {
                      if (months < selectedProduct.minTermMonths || months > selectedProduct.maxTermMonths) return null;
                      return (
                        <button
                          key={months}
                          type="button"
                          onClick={() => setTermMonths(months)}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                            termMonths === months
                              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {months} mos
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Semi-monthly payroll deductions: {termMonths * 2} paydays total
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Loan Purpose / Description
                  </label>
                  <textarea
                    rows={2}
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    placeholder="Specify commodity purchase, schooling, home repairs..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Financial Computation Box */}
              <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Amortization Estimate
                    </span>
                    <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                      May 2025 Standard
                    </span>
                  </div>

                  <div className="space-y-2.5 mt-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Principal Amount:</span>
                      <span className="font-mono font-semibold">{formatPHP(financials.principal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Interest ({financials.interestRate}%):</span>
                      <span className="font-mono text-amber-400">+{formatPHP(financials.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Processing Fee:</span>
                      <span className="font-mono text-slate-400">{formatPHP(financials.processingFee)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-800">
                      <span className="text-slate-300 font-semibold">Total Repayable:</span>
                      <span className="font-mono font-bold text-white text-sm">{formatPHP(financials.totalPayable)}</span>
                    </div>
                  </div>

                  {/* Payday Deduction Highlight */}
                  <div className="mt-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">
                        Payday Salary Deduction (15th & 30th):
                      </span>
                      <span className="text-base font-bold font-mono text-amber-400">
                        {formatPHP(financials.semiMonthlyDeduction)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Deducted automatically from semi-monthly payroll over {financials.totalInstallments} paydays.
                    </p>
                  </div>

                  {/* Net Releasing */}
                  <div className="mt-3 p-3 bg-slate-800/80 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-slate-400">Net Loan Release:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {formatPHP(financials.netDisbursement)}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 mt-4 border-t border-slate-800 pt-2">
                  * Net release equals Gross Principal minus ₱{financials.processingFee} processing fee.
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                disabled={!canProceedStep3}
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm disabled:opacity-50 transition-all"
              >
                Proceed to Co-Makers
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Co-Makers Selection & Validation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Step 3 — Co-Maker Selection & Verification</h3>
                  <p className="text-xs text-slate-500">
                    OPEC Rule: Requires {selectedProduct.requiredCoMakers} co-makers with {selectedProduct.minServiceYearsCoMaker}+ years of service.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                Selected: {selectedCoMakers.length} / {selectedProduct.requiredCoMakers}
              </span>
            </div>

            {selectedProduct.requiredCoMakers === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 text-xs">
                Petty Cash loans are exempt from co-maker requirements. You can proceed directly to the next step.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: selectedProduct.requiredCoMakers }).map((_, idx) => {
                    const selectedId = selectedCoMakers[idx];
                    const selectedEmp = employees.find(e => e.id === selectedId);
                    const validation = selectedId ? isCoMakerValid(selectedId) : null;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          selectedEmp
                            ? validation?.valid
                              ? 'bg-emerald-50/50 border-emerald-300'
                              : 'bg-rose-50/50 border-rose-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">
                            Co-Maker #{idx + 1}
                          </span>
                          {selectedEmp && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCoMaker(selectedEmp.id)}
                              className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <select
                          value={selectedId || ''}
                          onChange={e => handleSelectCoMaker(idx, e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">-- Choose Eligible Co-Maker --</option>
                          {candidateCoMakers.map(cand => {
                            const svc = calculateYearsOfService(cand.dateHired);
                            return (
                              <option key={cand.id} value={cand.id}>
                                {cand.firstName} {cand.lastName} ({cand.employeeNumber} · {svc.formatted} · {cand.employmentStatus})
                              </option>
                            );
                          })}
                        </select>

                        {selectedEmp && (
                          <div className="mt-2 text-xs">
                            {validation?.valid ? (
                              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verified: {calculateYearsOfService(selectedEmp.dateHired).formatted} service · Permanent</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-rose-700 font-medium">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{validation?.reason}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                  <span>
                    <strong>OPEC Guarantee Policy:</strong> Co-makers jointly and severally guarantee payment through salary deduction in case of borrower separation or default.
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                disabled={!canProceedStep4}
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm disabled:opacity-50 transition-all"
              >
                Proceed to Release Method
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Release Method */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <Building className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Step 4 — Loan Disbursement Method</h3>
                <p className="text-xs text-slate-500">Choose how the net loan proceeds will be released upon approval.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'BANK_CHECK' as ReleaseMethod, title: 'ML Ozamiz 1 Bank Check', desc: 'Manager Check issued at branch accounting' },
                { id: 'ML_KWARTA_PADALA' as ReleaseMethod, title: 'ML Kwarta Padala', desc: 'Direct payout pin claimable at any ML branch' },
                { id: 'BPI_ATM_DEPOSIT' as ReleaseMethod, title: 'BPI Payroll ATM Deposit', desc: 'Direct credit to employee bank account' },
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setReleaseMethod(opt.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    releaseMethod === opt.id
                      ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{opt.title}</span>
                    <input
                      type="radio"
                      checked={releaseMethod === opt.id}
                      onChange={() => setReleaseMethod(opt.id)}
                      className="accent-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">{opt.desc}</p>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Release Specifics / Account Information
              </label>
              <input
                type="text"
                value={releaseDetails}
                onChange={e => setReleaseDetails(e.target.value)}
                placeholder="e.g. Account No., Branch release location, contact verification..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                disabled={!canProceedStep5}
                onClick={() => setCurrentStep(5)}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm disabled:opacity-50 transition-all"
              >
                Proceed to Documents
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Document Attachments */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <Upload className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Step 5 — Supporting Documents</h3>
                <p className="text-xs text-slate-500">Attach latest verified payslip and commodity quotation.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Latest Payslip (Mandatory)</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Attached
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                  <FileText className="w-6 h-6 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      Payslip_Sep2026_{applicant.lastName}.pdf
                    </p>
                    <p className="text-[10px] text-slate-500">1.2 MB · Verified by Payroll Master</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Purpose Quotation / Receipts</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Attached
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                  <FileText className="w-6 h-6 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      Commodity_Price_Quotation.pdf
                    </p>
                    <p className="text-[10px] text-slate-500">890 KB · Official Store Quotation</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
              >
                Proceed to Promissory Agreement
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Agreements & Final Submit */}
        {currentStep === 6 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Step 6 — Promissory Agreement & Sign-Off</h3>
                <p className="text-xs text-slate-500">Legal undertaking authorizing semi-monthly payroll deduction.</p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-slate-500">Borrower:</span>
                <p className="font-bold text-slate-900">{applicant.firstName} {applicant.lastName}</p>
              </div>
              <div>
                <span className="text-slate-500">Requested Principal:</span>
                <p className="font-bold font-mono text-slate-900">{formatPHP(financials.principal)}</p>
              </div>
              <div>
                <span className="text-slate-500">Total Repayable:</span>
                <p className="font-bold font-mono text-amber-700">{formatPHP(financials.totalPayable)}</p>
              </div>
              <div>
                <span className="text-slate-500">Payday Deduction:</span>
                <p className="font-bold font-mono text-emerald-700">{formatPHP(financials.semiMonthlyDeduction)}</p>
              </div>
            </div>

            {/* Legal Declarations */}
            <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-200/80">
              <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={agreeDeduction}
                  onChange={e => setAgreeDeduction(e.target.checked)}
                  className="mt-0.5 accent-amber-600 w-4 h-4"
                />
                <span>
                  <strong>I hereby authorize salary deduction</strong> every payday (15th and 30th of each month) until the full principal, interest, and applicable fees are fully liquidated.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 accent-amber-600 w-4 h-4"
                />
                <span>
                  <strong>I agree to the OPEC Aurum Gems Loan Policy</strong> (May 2025 Standard) and agree that in the event of resignation, retirement, or termination, any outstanding balance shall be deducted from my final pay or co-maker guarantees.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={agreeCorrect}
                  onChange={e => setAgreeCorrect(e.target.checked)}
                  className="mt-0.5 accent-amber-600 w-4 h-4"
                />
                <span>
                  <strong>I confirm that the information provided is true and correct</strong> and all named co-makers have voluntarily consented to act as guarantors.
                </span>
              </label>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg shadow-md disabled:opacity-50 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                Submit Application to Credit Committee
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
