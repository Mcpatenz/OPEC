import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Building,
  CreditCard,
  CheckSquare,
  Users2,
  Receipt,
  FileSpreadsheet,
  Settings,
  HeartHandshake,
  BarChart3,
  History,
  ShieldCheck,
  UserCheck,
  CalendarCheck,
  QrCode,
  FilePlus,
  BadgeDollarSign,
  Briefcase,
  Layers,
  Calculator,
  CalendarDays,
  Mail,
  Megaphone,
} from 'lucide-react';
import { evaluateReLoanEligibility } from '../../lib/loans/eligibility';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  badge?: number;
  badgeText?: string;
  badgeColor?: string;
  highlight?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

interface SidebarProps {
  portalMode: 'admin' | 'employee';
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  portalMode,
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const { currentUser, employees, applications, activeLoans, payrollDeductions, announcements, csrProjects } = useApp();
  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const reLoanEval = evaluateReLoanEligibility(applicant, activeLoans, applications);

  const pendingApprovalsCount = applications.filter(
    a => a.status === 'FOR_REVIEW' || a.status === 'CREDIT_COMMITTEE'
  ).length;

  const forReleaseCount = applications.filter(a => a.status === 'FOR_RELEASE').length;
  const scheduledDeductionsCount = payrollDeductions.filter(d => d.status === 'SCHEDULED').length;
  const pinnedAnnouncementsCount = announcements.filter(a => a.isPinned).length;

  const handleNav = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpenMobile(false);
  };

  const adminNav: NavGroup[] = [
    {
      group: 'Overview',
      items: [
        { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'Organization',
      items: [
        { id: 'admin-members', label: 'Members & Employees', icon: Users },
        { id: 'admin-branches', label: 'Regions & Branches', icon: Building },
        { id: 'admin-officers', label: 'Officers & Hierarchy', icon: Layers },
      ],
    },
    {
      group: 'Loan Management',
      items: [
        { id: 'admin-loan-applications', label: 'Loan Applications', icon: CreditCard, count: applications.length },
        { id: 'admin-loan-approvals', label: 'Credit Committee', icon: CheckSquare, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined, badgeColor: 'bg-amber-500' },
        { id: 'admin-co-makers', label: 'Co-Makers Registry', icon: Users2 },
        { id: 'admin-active-loans', label: 'Active Loan Accounts', icon: BadgeDollarSign, count: activeLoans.length },
        { id: 'admin-loan-releasing', label: 'Loan Releasing Desk', icon: Receipt, badge: forReleaseCount > 0 ? forReleaseCount : undefined, badgeColor: 'bg-emerald-500' },
        { id: 'admin-payroll-deductions', label: 'Payroll Deductions', icon: FileSpreadsheet, badge: scheduledDeductionsCount > 0 ? scheduledDeductionsCount : undefined, badgeColor: 'bg-blue-500' },
        { id: 'admin-email-scheduler', label: 'Payment Alert Scheduler', icon: Mail, badge: 2, badgeColor: 'bg-amber-500' },
        { id: 'admin-loan-products', label: 'Loan Policies & Products', icon: Settings },
      ],
    },
    {
      group: 'OPEC & Community',
      items: [
        { id: 'admin-announcements', label: 'Announcements Board', icon: Megaphone, badge: pinnedAnnouncementsCount > 0 ? pinnedAnnouncementsCount : undefined, badgeColor: 'bg-amber-500' },
        { id: 'admin-csr-projects', label: 'OPEC Activities & CSR', icon: HeartHandshake, count: csrProjects.length },
      ],
    },
    {
      group: 'Analytics & Audit',
      items: [
        { id: 'admin-reports', label: 'Reports Hub', icon: BarChart3 },
        { id: 'admin-audit-logs', label: 'Audit Trail', icon: History },
        { id: 'admin-rbac', label: 'Roles & RBAC Matrix', icon: ShieldCheck },
      ],
    },
  ];

  const employeeNav: NavGroup[] = [
    {
      group: 'My Portal',
      items: [
        { id: 'emp-dashboard', label: 'Employee Dashboard', icon: LayoutDashboard },
        { id: 'emp-profile', label: 'My Profile & Service', icon: UserCheck },
      ],
    },
    {
      group: 'My Loans',
      items: [
        { id: 'emp-calendar', label: 'Repayment Calendar', icon: CalendarDays },
        { id: 'emp-calculator', label: 'Repayment Simulator', icon: Calculator },
        { id: 'emp-vault', label: 'Secure Document Vault', icon: ShieldCheck },
        {
          id: 'emp-apply-loan',
          label: reLoanEval.hasActiveRegularMpl && reLoanEval.canReLoanRegularMpl
            ? 'Apply for Re-Loan'
            : (reLoanEval.hasActiveRegularMpl ? 'Apply Loan (Allowed)' : 'Apply for Loan'),
          icon: FilePlus,
          highlight: true,
          badge: reLoanEval.hasActiveRegularMpl
            ? (reLoanEval.canReLoanRegularMpl ? 'Re-Loan' : 'Allowed')
            : undefined,
          badgeColor: reLoanEval.canReLoanRegularMpl ? 'bg-emerald-400' : 'bg-amber-400',
        },
        { id: 'emp-applications', label: 'My Applications', icon: CreditCard },
        { id: 'emp-active-loans', label: 'Active Loans & Ledger', icon: BadgeDollarSign },
      ],
    },
    {
      group: 'OPEC Activities',
      items: [
        { id: 'emp-announcements', label: 'Bulletins & Notices', icon: Megaphone, badge: pinnedAnnouncementsCount > 0 ? pinnedAnnouncementsCount : undefined, badgeColor: 'bg-amber-500' },
        { id: 'emp-activities', label: 'Community & OPEC Activities', icon: HeartHandshake },
        { id: 'emp-qr-attendance', label: 'Field QR Check-in', icon: QrCode },
      ],
    },
  ];

  const currentNav = portalMode === 'admin' ? adminNav : employeeNav;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-200 ease-in-out flex flex-col justify-between overflow-y-auto ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Organization Brand Header in Sidebar */}
        <div className="p-3.5 border-b border-slate-800/90 bg-slate-950/60 flex items-center gap-3">
          <img
            src="/src/assets/images/opec_logo_1791532750142.jpg"
            alt="OPEC Aurum Gems Crest"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shrink-0 shadow-md ring-1 ring-amber-500/30"
          />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white tracking-tight truncate">
              OPEC AURUM GEMS
            </div>
            <div className="text-[10px] text-amber-400 font-semibold truncate">
              ZASURMIS REGION
            </div>
            <div className="text-[9px] text-slate-400 truncate">
              M Lhuillier Cooperative
            </div>
          </div>
        </div>

        <div className="py-4 px-3 space-y-6">
          {currentNav.map(section => (
            <div key={section.group}>
              <div className="px-3 mb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
                {section.group}
              </div>
              <div className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all text-left ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-slate-950 ${
                            item.badgeColor || 'bg-amber-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.count !== undefined && !item.badge && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>OPEC System v2.6</span>
            <span className="text-amber-400">May 2025 Rules</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            Payroll cutoff: 15th & 30th monthly
          </p>
        </div>
      </aside>
    </>
  );
};
