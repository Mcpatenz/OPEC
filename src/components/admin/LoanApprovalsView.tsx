import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LoanApplication, ApprovalDecision, LoanStatus } from '../../types';
import { formatPHP } from '../../lib/loans/calculator';
import { calculateYearsOfService } from '../../lib/loans/eligibility';
import { SignaturePadModal } from '../common/SignaturePadModal';
import { LoanApplicationTimeline } from '../employee/LoanApplicationTimeline';
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
  PenTool,
  Sparkles,
  ArrowRight,
  Eye,
  Award,
  Banknote,
  Users,
} from 'lucide-react';

export const LoanApprovalsView: React.FC = () => {
  const {
    currentUser,
    applications,
    employees,
    branches,
    loanProducts,
    approveByAreaManager,
    approveByOpecPresident,
    approveByRegionalManager,
    releaseLoanDisbursement,
    rejectApplication,
  } = useApp();

  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(
    applications[0] || null
  );
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Signature modal state for approvals
  const [signingModal, setSigningModal] = useState<{
    isOpen: boolean;
    stage: 'AREA_MANAGER' | 'OPEC_PRESIDENT' | 'REGIONAL_MANAGER' | 'TREASURER';
    title: string;
    signerName: string;
    signerRole: string;
  } | null>(null);

  // Quick signature presets
  const SAMPLE_SIGNATURE =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M12,45 Q45,8 80,40 T150,28 T208,48" fill="none" stroke="%231e3a8a" stroke-width="3" stroke-linecap="round"/><path d="M30,52 Q85,58 185,50" fill="none" stroke="%231e3a8a" stroke-width="2"/></svg>';

  // Filtered applications
  const filteredApps = applications.filter(app => {
    const borrower = employees.find(e => e.id === app.employeeId);
    const searchMatch =
      app.applicationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${borrower?.firstName} ${borrower?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (borrower?.areaName || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!searchMatch) return false;

    if (stageFilter === 'all') return true;
    if (stageFilter === 'AREA_MANAGER_REVIEW') {
      return app.status === 'AREA_MANAGER_REVIEW' || app.status === 'FOR_REVIEW' || app.status === 'SUBMITTED';
    }
    if (stageFilter === 'OPEC_PRESIDENT_REVIEW') {
      return app.status === 'OPEC_PRESIDENT_REVIEW';
    }
    if (stageFilter === 'REGIONAL_MANAGER_REVIEW') {
      return app.status === 'REGIONAL_MANAGER_REVIEW' || app.status === 'CREDIT_COMMITTEE';
    }
    if (stageFilter === 'FOR_RELEASE') {
      return app.status === 'FOR_RELEASE' || app.status === 'APPROVED';
    }
    if (stageFilter === 'RELEASED') {
      return app.status === 'RELEASED' || app.status === 'ACTIVE';
    }
    if (stageFilter === 'REJECTED') {
      return app.status === 'REJECTED';
    }
    return app.status === stageFilter;
  });

  // Determine current active approver needed for selected app
  const getApprovalRequirements = (app: LoanApplication) => {
    const borrower = employees.find(e => e.id === app.employeeId);
    const borrowerArea = borrower?.areaName || 'Area A';

    switch (app.status) {
      case 'SUBMITTED':
      case 'FOR_REVIEW':
      case 'AREA_MANAGER_REVIEW':
        return {
          stage: 'AREA_MANAGER' as const,
          label: `Area Manager Approval (${borrowerArea})`,
          description: `Application submitted with co-maker signatures. Requires jurisdictional approval and digital signature from the Area Manager of ${borrowerArea}.`,
          nextStage: 'OPEC President Review',
          approverRole: 'AREA_MANAGER',
          defaultApproverName: `Area Manager (${borrowerArea})`,
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'OPEC_PRESIDENT_REVIEW':
        return {
          stage: 'OPEC_PRESIDENT' as const,
          label: 'OPEC President Check & Review',
          description: 'Area Manager endorsed. Now forwarded to OPEC President Engr. Roberto Eduardo Tan for formal executive evaluation and digital signature.',
          nextStage: 'Regional Manager Approval',
          approverRole: 'OPEC_PRESIDENT',
          defaultApproverName: 'Engr. Roberto Eduardo Tan (OPEC President)',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 'CREDIT_COMMITTEE':
      case 'REGIONAL_MANAGER_REVIEW':
        return {
          stage: 'REGIONAL_MANAGER' as const,
          label: 'Regional Manager Approval (Region 20: ZASURMIS)',
          description: 'OPEC President approved. Now forwarded to Regional Manager Atty. Fernando Mendoza for final territorial authorization and signature before fund release.',
          nextStage: 'Treasurer Releasing Desk',
          approverRole: 'REGIONAL_MANAGER',
          defaultApproverName: 'Atty. Fernando Mendoza (Regional Manager)',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        };
      case 'FOR_RELEASE':
      case 'APPROVED':
        return {
          stage: 'TREASURER' as const,
          label: 'Treasurer Release & Disbursement',
          description: 'All 3 managerial clearances secured. Forwarded to Treasurer Elena Corazon Mendoza for voucher issuance and proceeds release with digital signature.',
          nextStage: 'Released / Disbursed',
          approverRole: 'TREASURER',
          defaultApproverName: 'Elena Corazon Mendoza (Treasurer)',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'RELEASED':
      case 'ACTIVE':
        return {
          stage: 'DISBURSED' as const,
          label: 'Fully Disbursed & Active Loan',
          description: 'All 5 approval and disbursement stages completed with recorded digital signatures.',
          nextStage: 'Completed',
          approverRole: 'TREASURER',
          defaultApproverName: 'Elena Corazon Mendoza',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      default:
        return null;
    }
  };

  // Execute approval with signature data
  const handleSignatureApproved = (data: { signatureUrl: string; signatureDate: string }) => {
    if (!selectedApp || !signingModal) return;

    if (signingModal.stage === 'AREA_MANAGER') {
      approveByAreaManager(selectedApp.id, {
        signatureUrl: data.signatureUrl,
        signatureDate: data.signatureDate,
        comments: comment || 'Area Manager approved and endorsed loan application.',
        approverName: signingModal.signerName,
      });
    } else if (signingModal.stage === 'OPEC_PRESIDENT') {
      approveByOpecPresident(selectedApp.id, {
        signatureUrl: data.signatureUrl,
        signatureDate: data.signatureDate,
        comments: comment || 'OPEC President checked, reviewed, and approved.',
        approverName: signingModal.signerName,
      });
    } else if (signingModal.stage === 'REGIONAL_MANAGER') {
      approveByRegionalManager(selectedApp.id, {
        signatureUrl: data.signatureUrl,
        signatureDate: data.signatureDate,
        comments: comment || 'Regional Manager authorized release.',
        approverName: signingModal.signerName,
      });
    } else if (signingModal.stage === 'TREASURER') {
      releaseLoanDisbursement(selectedApp.id, {
        method: selectedApp.releaseMethod || 'BANK_CHECK',
        grossAmount: selectedApp.approvedAmount || selectedApp.requestedAmount,
        processingFee: selectedApp.processingFee || 50,
        otherFees: 0,
        referenceNumber: `CHK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        disbursementAccount: selectedApp.releaseDetails || 'ML Branch Account',
        signatureUrl: data.signatureUrl,
        signatureDate: data.signatureDate,
      });
    }

    setSigningModal(null);
    setComment('');
  };

  // Quick Sign & Approve shortcut
  const handleQuickSignAndApprove = (stage: 'AREA_MANAGER' | 'OPEC_PRESIDENT' | 'REGIONAL_MANAGER' | 'TREASURER') => {
    if (!selectedApp) return;
    const today = new Date().toISOString().split('T')[0];

    if (stage === 'AREA_MANAGER') {
      const borrower = employees.find(e => e.id === selectedApp.employeeId);
      const borrowerArea = borrower?.areaName || 'Area A';
      approveByAreaManager(selectedApp.id, {
        signatureUrl: SAMPLE_SIGNATURE,
        signatureDate: today,
        comments: comment || `Area Manager (${borrowerArea}) approved.`,
        approverName: `Area Manager (${borrowerArea})`,
      });
    } else if (stage === 'OPEC_PRESIDENT') {
      approveByOpecPresident(selectedApp.id, {
        signatureUrl: SAMPLE_SIGNATURE,
        signatureDate: today,
        comments: comment || 'OPEC President reviewed and approved.',
        approverName: 'Engr. Roberto Eduardo Tan',
      });
    } else if (stage === 'REGIONAL_MANAGER') {
      approveByRegionalManager(selectedApp.id, {
        signatureUrl: SAMPLE_SIGNATURE,
        signatureDate: today,
        comments: comment || 'Regional Manager approved for release.',
        approverName: 'Atty. Fernando Mendoza',
      });
    } else if (stage === 'TREASURER') {
      releaseLoanDisbursement(selectedApp.id, {
        method: selectedApp.releaseMethod || 'BANK_CHECK',
        grossAmount: selectedApp.approvedAmount || selectedApp.requestedAmount,
        processingFee: selectedApp.processingFee || 50,
        otherFees: 0,
        referenceNumber: `CHK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        disbursementAccount: selectedApp.releaseDetails || 'ML Branch Account',
        signatureUrl: SAMPLE_SIGNATURE,
        signatureDate: today,
      });
    }

    setComment('');
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
  };

  const activeApp = selectedApp
    ? applications.find(a => a.id === selectedApp.id) || selectedApp
    : null;
  const currentReq = activeApp ? getApprovalRequirements(activeApp) : null;
  const borrower = activeApp ? employees.find(e => e.id === activeApp.employeeId) : null;
  const branch = activeApp ? branches.find(b => b.id === borrower?.branchId) : null;
  const prod = activeApp ? loanProducts.find(p => p.id === activeApp.loanProductId) : null;
  const borrowerService = borrower ? calculateYearsOfService(borrower.dateHired) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Sequential Loan Approval Board</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
              Region 20: ZASURMIS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory 4-tier approval flow with digital signatures: Co-Maker (Step 3) → Area Manager (Area A–E) → OPEC President → Regional Manager → Treasurer (Release).
          </p>
        </div>

        {/* Current Active Persona Info */}
        <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          <User className="w-4 h-4 text-amber-600" />
          <div>
            <span className="text-slate-400 block text-[10px]">Active Reviewer:</span>
            <span className="font-bold text-slate-800">{currentUser.name}</span>
            <span className="text-slate-500 ml-1 font-mono text-[11px]">({currentUser.role.replace(/_/g, ' ')})</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by App #, employee name, or Area (A–E)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </div>

        {/* Stage Filter */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { key: 'all', label: 'All Applications' },
            { key: 'AREA_MANAGER_REVIEW', label: '1. Area Manager' },
            { key: 'OPEC_PRESIDENT_REVIEW', label: '2. OPEC President' },
            { key: 'REGIONAL_MANAGER_REVIEW', label: '3. Regional Manager' },
            { key: 'FOR_RELEASE', label: '4. Treasurer Release' },
            { key: 'RELEASED', label: 'Disbursed' },
            { key: 'REJECTED', label: 'Rejected' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStageFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                stageFilter === tab.key
                  ? 'bg-amber-500 text-slate-950 shadow-2xs font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Application List + Detailed Approval Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Applications Queue */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            <span>Applications Queue ({filteredApps.length})</span>
            <span className="text-[10px] font-mono text-slate-400">Click to select</span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredApps.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                No loan applications match this stage.
              </div>
            ) : (
              filteredApps.map(app => {
                const emp = employees.find(e => e.id === app.employeeId);
                const isSelected = activeApp?.id === app.id;
                const p = loanProducts.find(prodItem => prodItem.id === app.loanProductId);
                const req = getApprovalRequirements(app);

                return (
                  <div
                    key={app.id}
                    onClick={() => {
                      setSelectedApp(app);
                      setComment('');
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {app.applicationNo}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          req?.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {emp?.firstName} {emp?.lastName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {emp?.areaName || 'Area A'} · {emp?.position || 'Associate'}
                        </p>
                        <p className="text-[11px] text-amber-700 font-medium mt-0.5">{p?.name}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-950 block">
                          {formatPHP(app.requestedAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400">{app.termMonths} mos</span>
                      </div>
                    </div>

                    {/* Pending Step Notification */}
                    {req && app.status !== 'RELEASED' && app.status !== 'REJECTED' && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-amber-800 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Awaiting: {req.stage.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {app.coMakers?.filter(c => Boolean(c.signatureUrl)).length || 0} co-makers signed
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Application Approval Details */}
        <div className="lg:col-span-8">
          {activeApp ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Header with Applicant, Area, and Status */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {activeApp.applicationNo}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      Region 20: ZASURMIS
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {borrower?.areaName || 'Area A'}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 mt-1.5">
                    {borrower?.firstName} {borrower?.middleName || ''} {borrower?.lastName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {borrower?.position} · {branch?.name || 'Main Branch'} · Employee ID: {borrower?.employeeNumber}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xl font-mono font-black text-slate-900 block">
                    {formatPHP(activeApp.requestedAmount)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {activeApp.termMonths} Months · 1.5% Interest Rate
                  </span>
                </div>
              </div>

              {/* Animated Progress Tracker */}
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Sequential Progression & Approval Lifecycle:
                </span>
                <LoanApplicationTimeline application={activeApp} />
              </div>

              {/* 4 Key Metrics Cards */}
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
                  <span className="text-slate-500">Jurisdiction Area</span>
                  <p className="font-bold text-amber-700">{borrower?.areaName || 'Area A'}</p>
                </div>
              </div>

              {/* Purpose & Disbursement Method */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-700">Declared Purpose:</span>
                <p className="text-slate-600">{activeApp.purpose}</p>
                <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Disbursement Method:</span>
                  <span>{activeApp.releaseMethod} ({activeApp.releaseDetails})</span>
                </div>
              </div>

              {/* Step 3 Co-Maker Signatures & Endorsement Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    Step 3: Co-Maker Endorsement & Signatures ({activeApp.coMakers.length})
                  </h3>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Max 5 commitments enforced
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                  {activeApp.coMakers.map((cm, idx) => {
                    const cmEmp = employees.find(e => e.id === cm.employeeId);
                    const cmSvc = cmEmp ? calculateYearsOfService(cmEmp.dateHired) : null;
                    return (
                      <div key={idx} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900">
                              {cmEmp?.firstName} {cmEmp?.lastName}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px] ml-1.5">
                              ({cmEmp?.employeeNumber || cm.employeeId})
                            </span>
                            <p className="text-[11px] text-slate-500">
                              {cmEmp?.position} · {cmSvc?.formatted}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {cm.signatureUrl ? (
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                Signed: {cm.signatureDate}
                              </span>
                              <div className="h-7 w-20 bg-slate-50 border border-slate-200 rounded mt-1 p-0.5 flex items-center justify-center">
                                <img src={cm.signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                              Pending Co-maker
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Box: Sequential Reviewer Sign-Off */}
              {currentReq && activeApp.status !== 'RELEASED' && activeApp.status !== 'REJECTED' && (
                <div className="p-5 bg-gradient-to-r from-amber-50/80 via-amber-50/40 to-slate-50 rounded-xl border-2 border-amber-300 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-amber-200/80 gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        Stage Action Required
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {currentReq.label}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {currentReq.description}
                      </p>
                    </div>

                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-200/80 text-amber-900 border border-amber-300 self-start sm:self-auto">
                      Next: {currentReq.nextStage}
                    </span>
                  </div>

                  {/* Remarks input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Reviewer Endorsement Remarks / Condition Notes
                    </label>
                    <input
                      type="text"
                      placeholder={`Remarks for ${currentReq.label} (e.g. Verified eligibility, recommended for approval)...`}
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Action Buttons: Draw/Attach Signature, Quick-Sign, Reject */}
                  {currentReq.stage !== 'DISBURSED' && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRejectModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Application
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Quick-Sign shortcut for testing */}
                        <button
                          type="button"
                          onClick={() => handleQuickSignAndApprove(currentReq.stage as 'AREA_MANAGER' | 'OPEC_PRESIDENT' | 'REGIONAL_MANAGER' | 'TREASURER')}
                          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg transition-colors"
                          title="Auto-sign and immediately advance to the next approval tier"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                          Quick-Sign & Approve
                        </button>

                        {/* Modal with Signature Canvas / Upload & Date */}
                        <button
                          type="button"
                          onClick={() =>
                            setSigningModal({
                              isOpen: true,
                              stage: currentReq.stage as 'AREA_MANAGER' | 'OPEC_PRESIDENT' | 'REGIONAL_MANAGER' | 'TREASURER',
                              title: `${currentReq.label} — Attach or Draw Signature`,
                              signerName: currentReq.defaultApproverName,
                              signerRole: currentReq.approverRole,
                            })
                          }
                          className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all active:scale-95"
                        >
                          <PenTool className="w-4 h-4" />
                          Attach / Draw Signature & Approve
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Notice for Released or Rejected */}
              {activeApp.status === 'RELEASED' && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="font-bold">Loan Fully Released & Active</span>
                      <p className="text-[11px] text-emerald-700">
                        Disbursed by Treasurer with digital voucher and official signature.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeApp.status === 'REJECTED' && (
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-300 text-xs text-rose-900 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold">Application Disapproved</span>
                    <p className="text-[11px] text-rose-700">
                      Reason: {activeApp.rejectionReason || 'Did not meet credit or guarantor requirements.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-600">Select an Application to Review</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Review employee applications, examine co-maker endorsements, and record sequential managerial approvals with digital signatures.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Signature Pad Modal for Approvers */}
      {signingModal && (
        <SignaturePadModal
          isOpen={signingModal.isOpen}
          onClose={() => setSigningModal(null)}
          onSave={handleSignatureApproved}
          title={signingModal.title}
          signerName={signingModal.signerName}
          signerRole={signingModal.signerRole}
        />
      )}

      {/* Mandatory Rejection Modal */}
      {showRejectModal && activeApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base">Mandatory Rejection Notice</h3>
            </div>
            <p className="text-xs text-slate-600">
              Per OPEC policy, rejecting application #{activeApp.applicationNo} requires a formal, recorded justification.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete supporting documentation, insufficient co-maker service tenure..."
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
