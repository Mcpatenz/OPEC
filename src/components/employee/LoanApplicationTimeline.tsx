import React, { useState } from 'react';
import { LoanApplication } from '../../types';
import {
  Check,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
  Banknote,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building,
  Eye,
  X,
  FileCheck,
} from 'lucide-react';

interface TimelineProps {
  application: LoanApplication;
}

interface StepDefinition {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const TIMELINE_STEPS: StepDefinition[] = [
  {
    key: 'CO_MAKER',
    title: 'Co-Maker Guarantee',
    subtitle: 'Signed & Endorsed',
    icon: Users,
  },
  {
    key: 'AREA_MANAGER',
    title: 'Area Manager',
    subtitle: 'Jurisdiction Sign-off',
    icon: Building,
  },
  {
    key: 'OPEC_PRESIDENT',
    title: 'OPEC President',
    subtitle: 'Executive Review',
    icon: ShieldCheck,
  },
  {
    key: 'REGIONAL_MANAGER',
    title: 'Regional Manager',
    subtitle: 'ZASURMIS Clearance',
    icon: Award,
  },
  {
    key: 'TREASURER',
    title: 'Treasurer Release',
    subtitle: 'Proceeds Sign-off',
    icon: Banknote,
  },
  {
    key: 'DISBURSED',
    title: 'Disbursed',
    subtitle: 'Active Loan',
    icon: CheckCircle2,
  },
];

export const LoanApplicationTimeline: React.FC<TimelineProps> = ({ application }) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [viewingSignature, setViewingSignature] = useState<{
    url: string;
    title: string;
    signer: string;
    date: string;
  } | null>(null);

  const isRejected = application.status === 'REJECTED';

  // Map application.status to step index (0 to 5)
  const getStepIndex = (status: string): number => {
    switch (status) {
      case 'DRAFT':
      case 'SUBMITTED':
        return 0; // Waiting or verifying co-makers
      case 'AREA_MANAGER_REVIEW':
      case 'FOR_REVIEW':
        return 1; // Co-makers done, awaiting Area Manager
      case 'OPEC_PRESIDENT_REVIEW':
        return 2; // Area manager done, awaiting President
      case 'REGIONAL_MANAGER_REVIEW':
      case 'CREDIT_COMMITTEE':
        return 3; // President done, awaiting Regional Manager
      case 'FOR_RELEASE':
      case 'APPROVED':
        return 4; // Regional manager done, awaiting Treasurer
      case 'RELEASED':
      case 'ACTIVE':
      case 'DISBURSED':
      case 'PARTIALLY_PAID':
      case 'FULLY_PAID':
        return 5; // Treasurer released funds
      case 'REJECTED':
        return 1;
      default:
        return 1;
    }
  };

  const currentStepIndex = getStepIndex(application.status);
  const isFullyDisbursed = currentStepIndex === 5 && !isRejected;

  // Percentage for progress track (0% to 100%)
  const progressPercent = isRejected
    ? (currentStepIndex / (TIMELINE_STEPS.length - 1)) * 100
    : isFullyDisbursed
    ? 100
    : (currentStepIndex / (TIMELINE_STEPS.length - 1)) * 100;

  // Signatures present
  const coMakerSignedCount = application.coMakers?.filter(cm => Boolean(cm.signatureUrl)).length || 0;
  const approvalsWithSignature = application.approvals?.filter(a => a.decision === 'APPROVED' && Boolean(a.signatureUrl)).length || 0;

  return (
    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/90 space-y-4">
      {/* Header of Timeline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            5-Stage Approval & Disbursement Tracker
          </span>
          {isRejected ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
              <AlertCircle className="w-3 h-3" />
              Application Rejected
            </span>
          ) : isFullyDisbursed ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Fully Disbursed & Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Current Stage: {TIMELINE_STEPS[currentStepIndex].title}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 transition-colors self-start sm:self-auto"
        >
          {showDetails ? (
            <>
              Hide Digital Signatures
              <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              View Digital Signatures & Audit Trail
              <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      </div>

      {/* Animated Visual Timeline Track */}
      <div className="relative pt-2 pb-1 overflow-x-auto">
        <div className="min-w-[540px]">
          {/* Background track */}
          <div className="absolute top-6 left-6 right-6 h-1.5 bg-slate-200 rounded-full" />

          {/* Animated Progress Bar fill */}
          <div
            className={`absolute top-6 left-6 h-1.5 rounded-full transition-all duration-700 ease-out ${
              isRejected
                ? 'bg-rose-500'
                : isFullyDisbursed
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-emerald-500 via-amber-500 to-amber-400'
            }`}
            style={{
              width: `calc(${progressPercent}% * (100% - 48px) / 100)`,
            }}
          />

          {/* Milestone Nodes */}
          <div className="relative flex justify-between items-start">
            {TIMELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx < currentStepIndex || (idx === currentStepIndex && isFullyDisbursed);
              const isCurrent = idx === currentStepIndex && !isFullyDisbursed;
              const isFailedAtThisStep = isRejected && idx === currentStepIndex;

              // Determine styling
              let nodeBg = 'bg-white border-slate-300 text-slate-400';
              let labelColor = 'text-slate-500';
              let subtitleColor = 'text-slate-400';

              if (isFailedAtThisStep) {
                nodeBg = 'bg-rose-600 border-rose-600 text-white shadow-md ring-4 ring-rose-200';
                labelColor = 'text-rose-700 font-bold';
                subtitleColor = 'text-rose-500';
              } else if (isCompleted) {
                nodeBg = 'bg-emerald-600 border-emerald-600 text-white shadow-xs';
                labelColor = 'text-slate-800 font-semibold';
                subtitleColor = 'text-emerald-700';
              } else if (isCurrent) {
                nodeBg = 'bg-amber-500 border-amber-600 text-slate-950 shadow-md ring-4 ring-amber-300/50 scale-110';
                labelColor = 'text-amber-900 font-bold';
                subtitleColor = 'text-amber-700 font-semibold';
              }

              return (
                <div
                  key={step.key}
                  className="flex flex-col items-center text-center w-20 sm:w-24 group relative"
                >
                  {/* Node icon circle */}
                  <div
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 ${nodeBg}`}
                  >
                    {isFailedAtThisStep ? (
                      <AlertCircle className="w-4 h-4 text-white" />
                    ) : isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3] text-white" />
                    ) : isCurrent ? (
                      <Icon className="w-4 h-4 text-slate-950 animate-pulse" />
                    ) : (
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>

                  {/* Node Labels */}
                  <span className={`text-[11px] mt-2 block transition-colors leading-tight ${labelColor}`}>
                    {step.title}
                  </span>
                  <span className={`text-[9px] block leading-tight ${subtitleColor}`}>
                    {isFailedAtThisStep
                      ? 'Declined'
                      : isCurrent
                      ? 'Awaiting Sign-off'
                      : isCompleted
                      ? 'Signed & Approved'
                      : step.subtitle}
                  </span>

                  {/* Pulse halo for active current step */}
                  {isCurrent && !isRejected && (
                    <span className="absolute -top-1 w-11 h-11 rounded-full bg-amber-400/30 animate-ping pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rejection Alert Box */}
      {isRejected && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Application Notice:</span>
            <p className="text-[11px] text-rose-700 mt-0.5">
              {application.rejectionReason || 'The loan application was not approved.'}
            </p>
          </div>
        </div>
      )}

      {/* Accordion: Digital Signatures & Audit Trail Details */}
      {showDetails && (
        <div className="pt-3 border-t border-slate-200 space-y-3 animate-in fade-in text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold uppercase tracking-wider text-slate-700">
              Attached Digital Signatures & Authorizations
            </span>
            <span className="font-mono text-slate-500">
              {coMakerSignedCount} Co-Makers Signed · {approvalsWithSignature} Officers Signed
            </span>
          </div>

          {/* 1. Co-Makers Section */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-amber-900 block flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-700" />
              Co-Maker Guarantor Endorsements (Step 3 Requirement)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {application.coMakers?.map((cm, i) => (
                <div
                  key={cm.employeeId || i}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 block truncate">
                      Co-Maker #{i + 1} ({cm.employeeId})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {cm.signatureDate ? `Signed: ${cm.signatureDate}` : 'Pending Signature'}
                    </span>
                  </div>

                  {cm.signatureUrl ? (
                    <div
                      onClick={() =>
                        setViewingSignature({
                          url: cm.signatureUrl!,
                          title: `Co-Maker #${i + 1} Guarantee`,
                          signer: cm.employeeId,
                          date: cm.signatureDate || 'Recorded',
                        })
                      }
                      className="h-9 w-20 bg-white border border-slate-200 rounded flex items-center justify-center p-1 cursor-pointer hover:border-amber-400 shadow-2xs shrink-0"
                      title="Click to view full signature"
                    >
                      <img src={cm.signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Official Approver Chain Section */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-amber-900 block flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              Administrative Approval Chain (Area Manager → President → Regional Manager → Treasurer)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {application.approvals?.map(apr => {
                const isApproved = apr.decision === 'APPROVED';
                return (
                  <div
                    key={apr.id}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                      isApproved ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate text-[11px]">
                        {apr.title}
                      </span>
                      <span className="text-[10px] text-slate-600 block truncate">
                        {apr.approverName}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono block">
                        {apr.signatureDate ? `Signed: ${apr.signatureDate}` : 'Pending Sign-off'}
                      </span>
                    </div>

                    {apr.signatureUrl ? (
                      <div
                        onClick={() =>
                          setViewingSignature({
                            url: apr.signatureUrl!,
                            title: apr.title,
                            signer: apr.approverName,
                            date: apr.signatureDate || 'Recorded',
                          })
                        }
                        className="h-9 w-20 bg-white border border-slate-200 rounded flex items-center justify-center p-1 cursor-pointer hover:border-emerald-500 shadow-2xs shrink-0"
                        title="Click to view full signature"
                      >
                        <img src={apr.signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600 uppercase">
                        Pending
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Signature Preview Modal */}
      {viewingSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Electronic Signature Certificate
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{viewingSignature.title}</h3>
                <p className="text-xs text-slate-500">Signer: {viewingSignature.signer}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingSignature(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center min-h-[160px]">
              <img
                src={viewingSignature.url}
                alt="Enlarged signature"
                className="max-h-36 max-w-full object-contain"
              />
            </div>

            <div className="p-2.5 bg-slate-100 rounded-lg text-[11px] text-slate-600 flex justify-between">
              <span>Date Recorded:</span>
              <span className="font-mono font-bold text-slate-900">{viewingSignature.date}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingSignature(null)}
                className="px-4 py-2 font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
