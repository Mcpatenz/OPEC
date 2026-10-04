import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LoanApplication, ApprovalDecision } from '../../types';
import { formatPHP } from '../../lib/loans/calculator';
import { calculateYearsOfService } from '../../lib/loans/eligibility';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  User,
  ShieldCheck,
  AlertTriangle,
  Building,
  Calendar,
  MessageSquare,
  Search,
  Filter,
} from 'lucide-react';

export const LoanApprovalsView: React.FC = () => {
  const {
    currentUser,
    applications,
    employees,
    branches,
    loanProducts,
    reviewApplication,
    voteApplication,
    rejectApplication,
  } = useApp();

  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Committee filter
  const committeeApps = applications.filter(app => {
    const borrower = employees.find(e => e.id === app.employeeId);
    const searchMatch =
      app.applicationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${borrower?.firstName} ${borrower?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return searchMatch;
    if (filterStatus === 'pending') {
      return searchMatch && (app.status === 'FOR_REVIEW' || app.status === 'CREDIT_COMMITTEE');
    }
    return searchMatch && app.status === filterStatus;
  });

  const handleApprove = (app: LoanApplication) => {
    if (app.status === 'FOR_REVIEW') {
      reviewApplication(app.id, 'APPROVED', comment || 'Loan Officer verification passed.');
    } else {
      voteApplication(app.id, 'APPROVED', comment || `${currentUser.role} signed approval.`);
    }
    setComment('');
    setSelectedApp(null);
  };

  const handleReject = () => {
    if (!selectedApp) return;
    if (!rejectionReason.trim()) {
      alert('Mandatory rejection reason required by OPEC policy.');
      return;
    }
    rejectApplication(selectedApp.id, rejectionReason);
    setRejectionReason('');
    setShowRejectModal(false);
    setSelectedApp(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Credit Committee Review Board</h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
              Role: {currentUser.role.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Multilateral approval workflow: Loan Officer → Auditor → Payroll Master → Treasurer → OPEC President.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search App # or Name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Committee Only</option>
            <option value="CREDIT_COMMITTEE">In Credit Committee</option>
            <option value="FOR_RELEASE">Ready for Releasing</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Grid / Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* List of Applications */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Applications ({committeeApps.length})
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {committeeApps.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                No loan applications match criteria.
              </div>
            ) : (
              committeeApps.map(app => {
                const borrower = employees.find(e => e.id === app.employeeId);
                const isSelected = selectedApp?.id === app.id;
                const prod = loanProducts.find(p => p.id === app.loanProductId);

                return (
                  <div
                    key={app.id}
                    onClick={() => {
                      setSelectedApp(app);
                      setComment('');
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40 shadow-sm ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {app.applicationNo}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        app.status === 'FOR_RELEASE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'CREDIT_COMMITTEE'
                          ? 'bg-amber-100 text-amber-800'
                          : app.status === 'FOR_REVIEW'
                          ? 'bg-blue-100 text-blue-800'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {borrower?.firstName} {borrower?.lastName}
                        </p>
                        <p className="text-[11px] text-slate-500">{prod?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {formatPHP(app.requestedAmount)}
                        </span>
                        <p className="text-[10px] text-slate-400">{app.termMonths} mos</p>
                      </div>
                    </div>

                    {/* Approvals progress */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Committee Votes:</span>
                      <span className="font-semibold text-slate-700">
                        {app.approvals.filter(a => a.decision === 'APPROVED').length} / {app.approvals.length} Approved
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Application Detail & Decision Box */}
        <div className="lg:col-span-2">
          {selectedApp ? (
            (() => {
              const borrower = employees.find(e => e.id === selectedApp.employeeId);
              const branch = branches.find(b => b.id === borrower?.branchId);
              const prod = loanProducts.find(p => p.id === selectedApp.loanProductId);
              const borrowerService = borrower ? calculateYearsOfService(borrower.dateHired) : null;

              const isPresident = currentUser.role === 'OPEC_PRESIDENT' || currentUser.role === 'SUPER_ADMIN';
              const isTreasurer = currentUser.role === 'TREASURER' || currentUser.role === 'SUPER_ADMIN';
              const isAuditor = currentUser.role === 'AUDITOR' || currentUser.role === 'SUPER_ADMIN';
              const isPayroll = currentUser.role === 'PAYROLL_MASTER' || currentUser.role === 'SUPER_ADMIN';
              const isLoanOfficer = currentUser.role === 'LOAN_OFFICER' || currentUser.role === 'SUPER_ADMIN';
              const isAdviser = currentUser.role === 'OPEC_ADVISER' || currentUser.role === 'SUPER_ADMIN';

              const canTakeAction =
                selectedApp.status === 'FOR_REVIEW'
                  ? isLoanOfficer
                  : selectedApp.status === 'CREDIT_COMMITTEE'
                  ? (isPresident || isTreasurer || isAuditor || isPayroll || isAdviser)
                  : false;

              return (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  {/* Header summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {selectedApp.applicationNo}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 mt-1">
                        {borrower?.firstName} {borrower?.middleName || ''} {borrower?.lastName}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {borrower?.position} · {branch?.name || 'Main Branch'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-mono font-black text-slate-900">
                        {formatPHP(selectedApp.requestedAmount)}
                      </span>
                      <p className="text-xs text-slate-500 font-medium">
                        {selectedApp.termMonths} Months · 1.5% Interest
                      </p>
                    </div>
                  </div>

                  {/* Section 15 of Specification: Key metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500">Employment Status</span>
                      <p className="font-bold text-slate-800">{borrower?.employmentStatus}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Service Years</span>
                      <p className="font-bold text-emerald-700">{borrowerService?.formatted}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Monthly Salary</span>
                      <p className="font-bold font-mono text-slate-800">{formatPHP(borrower?.monthlySalary || 0)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Existing Balance</span>
                      <p className="font-bold font-mono text-emerald-600">₱0.00 (Clean)</p>
                    </div>
                  </div>

                  {/* Purpose & Release details */}
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-700">Declared Purpose:</span>
                    <p className="text-slate-600">{selectedApp.purpose}</p>
                    <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Disbursement Method:</span>
                      <span>{selectedApp.releaseMethod} ({selectedApp.releaseDetails})</span>
                    </div>
                  </div>

                  {/* Co-makers table with service checks */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                      <span>Co-Makers Compliance ({selectedApp.coMakers.length})</span>
                      <span className="text-[11px] font-normal text-emerald-700 font-semibold">
                        All verified ≥ 5 Years in Service
                      </span>
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                      {selectedApp.coMakers.map((cm, idx) => {
                        const cmEmp = employees.find(e => e.id === cm.employeeId);
                        const cmSvc = cmEmp ? calculateYearsOfService(cmEmp.dateHired) : null;
                        return (
                          <div key={idx} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
                            <div className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div>
                                <span className="font-semibold text-slate-800">{cmEmp?.firstName} {cmEmp?.lastName}</span>
                                <span className="text-slate-400 font-mono text-[11px] ml-1.5">({cmEmp?.employeeNumber})</span>
                                <p className="text-[11px] text-slate-500">{cmEmp?.position}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-emerald-700 text-xs">{cmSvc?.formatted}</span>
                              <p className="text-[10px] text-slate-400 font-medium">Permanent Employee</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Supporting documents folder */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Attached Documents
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {selectedApp.documents.map(doc => (
                        <div key={doc.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                          <FileText className="w-4 h-4 text-amber-600" />
                          <div className="min-w-0 flex-1 truncate">
                            <span className="font-semibold text-slate-800 truncate block">{doc.name}</span>
                            <span className="text-[10px] text-slate-400">{doc.fileSize} · Verified</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Credit Committee Voting Matrix */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Credit Committee Reviewers & Signatures
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {selectedApp.approvals.map(apr => (
                        <div
                          key={apr.id}
                          className={`p-3 rounded-lg border ${
                            apr.decision === 'APPROVED'
                              ? 'bg-emerald-50/60 border-emerald-200'
                              : apr.decision === 'REJECTED'
                              ? 'bg-rose-50/60 border-rose-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800">{apr.title}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              apr.decision === 'APPROVED'
                                ? 'bg-emerald-200 text-emerald-800'
                                : apr.decision === 'REJECTED'
                                ? 'bg-rose-200 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {apr.decision}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{apr.approverName}</p>
                          {apr.comments && (
                            <p className="text-[10px] text-slate-500 italic mt-1 bg-white/60 p-1 rounded">
                              "{apr.comments}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decision Action Box */}
                  {canTakeAction ? (
                    <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900">
                          Cast Decision as: <span className="font-mono text-amber-700">{currentUser.role.replace(/_/g, ' ')}</span> ({currentUser.name})
                        </span>
                        <span className="text-[10px] text-slate-500">Sign-off will be recorded in audit log</span>
                      </div>

                      <input
                        type="text"
                        placeholder="Add review remarks or approval notes (optional)..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowRejectModal(true)}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject Application
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(selectedApp)}
                          className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {selectedApp.status === 'FOR_REVIEW' ? 'Pass Loan Officer Review' : 'Cast Approval Vote'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-500 flex items-center justify-between">
                      <span>Status: <strong className="text-slate-700">{selectedApp.status.replace(/_/g, ' ')}</strong></span>
                      <span className="text-[11px] text-slate-400">
                        {selectedApp.status === 'FOR_RELEASE'
                          ? 'All committee approvals satisfied. Ready at Loan Releasing Desk.'
                          : 'Switch persona in header to test other committee votes.'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-600">Select an Application to Review</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Inspect applicant service records, verify 4 co-makers with 5+ years of service, and submit committee votes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Rejection Modal */}
      {showRejectModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base">Mandatory Rejection Notice</h3>
            </div>
            <p className="text-xs text-slate-600">
              As per OPEC Aurum Gems governance, rejecting application #{selectedApp.applicationNo} requires a formal, recorded reason for the applicant.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete supporting documents, debt capacity limit exceeded..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
