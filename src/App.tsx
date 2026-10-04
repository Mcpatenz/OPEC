import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MembersView } from './components/admin/MembersView';
import { OrganizationView } from './components/admin/OrganizationView';
import { LoanApplicationsView } from './components/admin/LoanApplicationsView';
import { LoanApprovalsView } from './components/admin/LoanApprovalsView';
import { CoMakersView } from './components/admin/CoMakersView';
import { ActiveLoansView } from './components/admin/ActiveLoansView';
import { LoanReleasingView } from './components/admin/LoanReleasingView';
import { PayrollDeductionsView } from './components/admin/PayrollDeductionsView';
import { LoanProductsView } from './components/admin/LoanProductsView';
import { CommunityProjectsView } from './components/admin/CommunityProjectsView';
import { ReportsView } from './components/admin/ReportsView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { RBACView } from './components/admin/RBACView';
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';
import { LoanApplicationWizard } from './components/employee/LoanApplicationWizard';
import { MyLoansView } from './components/employee/MyLoansView';
import { MyProfileView } from './components/employee/MyProfileView';
import { MyCommunityActivitiesView } from './components/employee/MyCommunityActivitiesView';
import { Menu, X, CheckCircle2 } from 'lucide-react';

function MainApp() {
  const [portalMode, setPortalMode] = useState<'admin' | 'employee'>('admin');
  const [activeTab, setActiveTab] = useState<string>('admin-dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [successAppNo, setSuccessAppNo] = useState<string | null>(null);

  const handleApplySuccess = (appNo: string) => {
    setShowApplyModal(false);
    setSuccessAppNo(appNo);
    if (portalMode === 'employee') {
      setActiveTab('emp-applications');
    } else {
      setActiveTab('admin-loan-approvals');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        portalMode={portalMode}
        setPortalMode={setPortalMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApplyModal={() => setShowApplyModal(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          portalMode={portalMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpenMobile={isOpenMobile}
          setIsOpenMobile={setIsOpenMobile}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 lg:pl-64 p-4 sm:p-6 lg:p-8">
          {/* Mobile hamburger button */}
          <div className="lg:hidden mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
            <button
              onClick={() => setIsOpenMobile(!isOpenMobile)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center gap-2 text-xs font-bold"
            >
              {isOpenMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              <span>Menu</span>
            </button>
            <span className="text-xs font-bold text-amber-700 capitalize">
              {portalMode} Portal
            </span>
          </div>

          {/* Submission Success Banner */}
          {successAppNo && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Loan Application Submitted Successfully!</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Application <strong className="font-mono">{successAppNo}</strong> has been forwarded to the Credit Committee and Loan Officer review queue.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuccessAppNo(null)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-950 px-2 py-1 rounded"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Render Active View based on portalMode and activeTab */}
          {portalMode === 'admin' ? (
            <>
              {activeTab === 'admin-dashboard' && (
                <AdminDashboard setActiveTab={setActiveTab} />
              )}
              {activeTab === 'admin-members' && <MembersView />}
              {activeTab === 'admin-branches' && <OrganizationView />}
              {activeTab === 'admin-officers' && <OrganizationView />}
              {activeTab === 'admin-loan-applications' && (
                <LoanApplicationsView onOpenCreditCommittee={() => setActiveTab('admin-loan-approvals')} />
              )}
              {activeTab === 'admin-loan-approvals' && <LoanApprovalsView />}
              {activeTab === 'admin-co-makers' && <CoMakersView />}
              {activeTab === 'admin-active-loans' && <ActiveLoansView />}
              {activeTab === 'admin-loan-releasing' && <LoanReleasingView />}
              {activeTab === 'admin-payroll-deductions' && <PayrollDeductionsView />}
              {activeTab === 'admin-loan-products' && <LoanProductsView />}
              {activeTab === 'admin-csr-projects' && <CommunityProjectsView />}
              {activeTab === 'admin-reports' && <ReportsView />}
              {activeTab === 'admin-audit-logs' && <AuditLogsView />}
              {activeTab === 'admin-rbac' && <RBACView />}
            </>
          ) : (
            <>
              {activeTab === 'emp-dashboard' && (
                <EmployeeDashboard
                  setActiveTab={setActiveTab}
                  onOpenApply={() => setShowApplyModal(true)}
                />
              )}
              {activeTab === 'emp-profile' && <MyProfileView />}
              {activeTab === 'emp-apply-loan' && (
                <LoanApplicationWizard
                  onSuccess={handleApplySuccess}
                  onCancel={() => setActiveTab('emp-dashboard')}
                />
              )}
              {(activeTab === 'emp-applications' || activeTab === 'emp-active-loans') && (
                <MyLoansView onOpenApply={() => setShowApplyModal(true)} />
              )}
              {(activeTab === 'emp-activities' || activeTab === 'emp-qr-attendance') && (
                <MyCommunityActivitiesView />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Application Wizard Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="max-w-3xl w-full my-8">
            <LoanApplicationWizard
              onSuccess={handleApplySuccess}
              onCancel={() => setShowApplyModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
