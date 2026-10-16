import React from 'react';
import {
  ShieldCheck,
  Crown,
  FileCheck2,
  Coins,
  MapPin,
  Building2,
  User,
  Shield,
  Layers,
} from 'lucide-react';

export const RBACView: React.FC = () => {
  const rolesSummary = [
    {
      role: 'Admin',
      title: 'System Administrator',
      icon: Shield,
      badge: 'Full Access',
      color: 'slate',
      description: 'System configurations, user management, audit trails, database rules, and global overrides.',
    },
    {
      role: 'President',
      title: 'OPEC President',
      icon: Crown,
      badge: 'Executive Sign-Off',
      color: 'amber',
      description: 'Final loan approval, presidential sign-off, credit committee leadership, and policy direction.',
    },
    {
      role: 'Secretary',
      title: 'OPEC Corporate Secretary',
      icon: FileCheck2,
      badge: 'Records & Minutes',
      color: 'cyan',
      description: 'Meeting minutes, committee resolution certificates, co-maker notarizations, and membership registries.',
    },
    {
      role: 'Treasurer',
      title: 'OPEC Treasurer',
      icon: Coins,
      badge: 'Disbursement & CBU',
      color: 'emerald',
      description: 'Loan disbursement check releases, cash voucher approvals, CBU equity ledger & 10% retainer accounting.',
    },
    {
      role: 'Area Manager',
      title: 'Area Command Manager',
      icon: MapPin,
      badge: 'Area Endorsement',
      color: 'blue',
      description: 'Branch cluster oversight, initial loan review & endorsement (Step 1) for branch personnel in area.',
    },
    {
      role: 'Regional Manager',
      title: 'Regional Command Manager',
      icon: Building2,
      badge: 'Regional Endorsement',
      color: 'purple',
      description: 'Regional loan approval (Step 3), credit capacity verification across regional branch networks.',
    },
    {
      role: 'Member',
      title: 'Employee / Cooperative Member',
      icon: User,
      badge: 'Member Portal',
      color: 'teal',
      description: 'Loan applications, repayment schedules, CBU equity balance, co-maker guarantees, and paystub review.',
    },
  ];

  const rbacMatrix = [
    {
      module: 'Member & Profile Records',
      admin: 'Full CRUD',
      president: 'Read & Endorse',
      secretary: 'CRUD & Certify',
      treasurer: 'Read & CBU',
      areaManager: 'Area Staff',
      regionalManager: 'Region Staff',
      member: 'Own Profile',
    },
    {
      module: 'Loan Applications (Intake & Draft)',
      admin: 'Full Manage',
      president: 'Executive Review',
      secretary: 'Record & File',
      treasurer: 'Disbursement Pre-audit',
      areaManager: 'Review & Verify',
      regionalManager: 'Review & Verify',
      member: 'Submit Own Application',
    },
    {
      module: 'Credit Committee Approvals (Hierarchy)',
      admin: 'Override / Audit',
      president: 'President Approval (Step 2)',
      secretary: 'Attest & Log',
      treasurer: 'Final Fund Release (Step 4)',
      areaManager: 'Area Approval (Step 1)',
      regionalManager: 'Regional Approval (Step 3)',
      member: 'Track Application Status',
    },
    {
      module: 'Co-Maker Endorsements & Signatures',
      admin: 'Manage Registry',
      president: 'Review Eligibility',
      secretary: 'Verify Notarizations',
      treasurer: 'Read Eligibility',
      areaManager: 'Verify Co-Makers',
      regionalManager: 'Review Co-Makers',
      member: 'Sign & Accept Co-Maker Requests',
    },
    {
      module: 'Loan Releasing & Check Issuance',
      admin: 'Configure Methods',
      president: 'Authorize Release',
      secretary: 'Release Records',
      treasurer: 'Print Checks & Disburse',
      areaManager: 'Receive Handover',
      regionalManager: 'Read Status',
      member: 'Acknowledge Receipt Voucher',
    },
    {
      module: 'CBU Equity (₱100/payday & 10% Retainer)',
      admin: 'Manage Policy',
      president: 'Review Summary',
      secretary: 'Separation Audit',
      treasurer: 'Full Ledger & Retainer',
      areaManager: 'Area Ledger Read',
      regionalManager: 'Regional Ledger Read',
      member: 'View Equity & Retainer Forecast',
    },
    {
      module: 'Payroll Deductions & Amortization',
      admin: 'Import/Export',
      president: 'Summary Audit',
      secretary: 'Meeting Records',
      treasurer: 'Reconcile & Post',
      areaManager: 'Area Deduction Read',
      regionalManager: 'Region Deduction Read',
      member: 'View Paystub & Scheduled Payday',
    },
    {
      module: 'Community CSR Projects',
      admin: 'Manage Projects',
      president: 'Executive Lead',
      secretary: 'Minutes & Reports',
      treasurer: 'Budget & Counterparts',
      areaManager: 'Local Coordination',
      regionalManager: 'Regional Mobilization',
      member: 'Participate & QR Check-in',
    },
    {
      module: 'Reports Hub & Offline PDF Export',
      admin: 'Export All (PDF/CSV)',
      president: 'Executive Reports',
      secretary: 'Registry Reports',
      treasurer: 'Financial Ledger PDF',
      areaManager: 'Area Report PDF',
      regionalManager: 'Regional Report PDF',
      member: 'Personal Statement PDF',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              System Roles & RBAC Access Matrix
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official 7 organizational roles governing OPEC Aurum Gems governance, approvals, and loan lifecycle.
            </p>
          </div>
        </div>
      </div>

      {/* 7 Roles Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rolesSummary.map(r => {
          const Icon = r.icon;
          return (
            <div
              key={r.role}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60">
                    {r.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{r.role}</h3>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">{r.title}</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {r.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Matrix Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              7-Role Permission Enforcement Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Granular capabilities across functional modules according to OPEC policy.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 min-w-[180px]">Functional Module</th>
                <th className="py-3 px-3 min-w-[120px]">Admin</th>
                <th className="py-3 px-3 min-w-[130px]">President</th>
                <th className="py-3 px-3 min-w-[130px]">Secretary</th>
                <th className="py-3 px-3 min-w-[130px]">Treasurer</th>
                <th className="py-3 px-3 min-w-[130px]">Area Manager</th>
                <th className="py-3 px-3 min-w-[130px]">Regional Manager</th>
                <th className="py-3 px-4 min-w-[140px]">Member</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
              {rbacMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{row.module}</td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[11px]">
                      {row.admin}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-700 text-[11px]">
                      {row.president}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-cyan-900 dark:text-cyan-200 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-700 text-[11px]">
                      {row.secretary}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-700 text-[11px]">
                      {row.treasurer}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-700 text-[11px]">
                      {row.areaManager}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-purple-900 dark:text-purple-200 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-700 text-[11px]">
                      {row.regionalManager}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-teal-900 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-700 text-[11px]">
                      {row.member}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
