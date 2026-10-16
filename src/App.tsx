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
import { RecurringEmailScheduler } from './components/admin/RecurringEmailScheduler';
import { AnnouncementsView } from './components/admin/AnnouncementsView';
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';
import { LoanApplicationWizard } from './components/employee/LoanApplicationWizard';
import { MyLoansView } from './components/employee/MyLoansView';
import { MyProfileView } from './components/employee/MyProfileView';
import { MyCommunityActivitiesView } from './components/employee/MyCommunityActivitiesView';
import { LoanCalculator } from './components/loans/LoanCalculator';
import { LoanRepaymentSimulator } from './components/employee/LoanRepaymentSimulator';
import { RepaymentCalendar } from './components/employee/RepaymentCalendar';
import { DocumentVault } from './components/employee/DocumentVault';
import { NotificationToast } from './components/common/NotificationToast';
import { InAppNotificationCenterModal } from './components/common/InAppNotificationCenterModal';
import { PaystubModal } from './components/common/PaystubModal';
import { SubmitCSRReportModal } from './components/common/SubmitCSRReportModal';
import { GmailOtpVerificationModal } from './components/common/GmailOtpVerificationModal';
import { Menu, X, CheckCircle2 } from 'lucide-react';
import { evaluateReLoanEligibility } from './lib/loans/eligibility';

function MainApp() {
  const {
    currentUser,
    employees,
    activeLoans,
    applications,
    isGmailOtpModalOpen,
    closeGmailOtpModal,
    openGmailOtpModal,
    gmailOtpModalProps,
    isDarkMode,
  } = useApp();
  const [portalMode, setPortalMode] = useState<'admin' | 'employee'>('admin');
  const [activeTab, setActiveTab] = useState<string>('admin-dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState<boolean>(false);
  const [showPaystubModal, setShowPaystubModal] = useState<boolean>(false);
  const [showCSRReportModal, setShowCSRReportModal] = useState<boolean>(false);
  const [applyInitialTerms, setApplyInitialTerms] = useState<{
    productId?: string;
    amount?: number;
    termMonths?: number;
  } | undefined>(undefined);
  const [successAppNo, setSuccessAppNo] = useState<string | null>(null);
  const [empCalcMode, setEmpCalcMode] = useState<'simulator' | 'calculator'>('simulator');

  const handleApplySuccess = (appNo: string) => {
    setShowApplyModal(false);
    setApplyInitialTerms(undefined);
    setSuccessAppNo(appNo);
    if (portalMode === 'employee') {
      setActiveTab('emp-applications');
    } else {
      setActiveTab('admin-loan-approvals');
    }
  };

  const handleApplyWithTerms = (terms: { productId: string; amount: number; termMonths: number }) => {
    const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
    const reLoanEval = evaluateReLoanEligibility(applicant, activeLoans, applications, terms.productId);
    if (!reLoanEval.isProductAllowed(terms.productId)) {
      return;
    }
    setApplyInitialTerms(terms);
    setShowApplyModal(true);
  };

  const handleOpenGeneralApply = () => {
    const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
    const reLoanEval = evaluateReLoanEligibility(applicant, activeLoans, applications);
    if (reLoanEval.hasActiveRegularMpl && !reLoanEval.canReLoanRegularMpl) {
      // Under policy, employee cannot loan for another Regular MPL, but can loan for Emergency, Commodity, Calamity, Petty Cash
      setApplyInitialTerms({
        productId: 'prod-commodity',
        amount: 15000,
        termMonths: 12,
      });
    } else if (reLoanEval.hasActiveRegularMpl && reLoanEval.canReLoanRegularMpl) {
      setApplyInitialTerms({
        productId: 'prod-mpl',
        amount: 25000,
        termMonths: 18,
      });
    } else {
      setApplyInitialTerms(undefined);
    }
    setShowApplyModal(true);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Header */}
      <Header
        portalMode={portalMode}
        setPortalMode={setPortalMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApplyModal={() => setShowApplyModal(true)}
        onOpenNotificationCenter={() => setShowNotificationCenter(true)}
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
              {activeTab === 'admin-payroll-deductions' && (
                <PayrollDeductionsView onOpenScheduler={() => setActiveTab('admin-email-scheduler')} />
              )}
              {activeTab === 'admin-email-scheduler' && (
                <RecurringEmailScheduler onBackToDashboard={() => setActiveTab('admin-dashboard')} />
              )}
              {activeTab === 'admin-loan-products' && <LoanProductsView />}
              {activeTab === 'admin-announcements' && <AnnouncementsView />}
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
                  onOpenApply={handleOpenGeneralApply}
                  onOpenApplyWithTerms={handleApplyWithTerms}
                  onOpenNotificationCenter={() => setShowNotificationCenter(true)}
                  onOpenPaystub={() => setShowPaystubModal(true)}
                  onOpenCSRReport={() => setShowCSRReportModal(true)}
                />
              )}
              {activeTab === 'emp-calendar' && (
                <RepaymentCalendar setActiveTab={setActiveTab} />
              )}
              {activeTab === 'emp-calculator' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold block">
                        Credit Tools & Repayment Forecaster
                      </span>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        {empCalcMode === 'simulator'
                          ? 'Loan Repayment Simulator (with Outstanding Balance)'
                          : 'Standard OPEC Loan Calculator'}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-bold self-start sm:self-auto flex-wrap">
                      <button
                        onClick={() => setEmpCalcMode('simulator')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          empCalcMode === 'simulator'
                            ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>Repayment Simulator (w/ Balance)</span>
                      </button>
                      <button
                        onClick={() => setEmpCalcMode('calculator')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          empCalcMode === 'calculator'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-black shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>Standard Calculator</span>
                      </button>
                    </div>
                  </div>

                  {empCalcMode === 'simulator' ? (
                    <LoanRepaymentSimulator onApplyWithTerms={handleApplyWithTerms} />
                  ) : (
                    <LoanCalculator onApplyWithTerms={handleApplyWithTerms} />
                  )}
                </div>
              )}
              {activeTab === 'emp-vault' && (
                <DocumentVault onOpenApply={handleOpenGeneralApply} />
              )}
              {activeTab === 'emp-profile' && <MyProfileView />}
              {activeTab === 'emp-apply-loan' && (
                <LoanApplicationWizard
                  initialValues={applyInitialTerms}
                  onSuccess={handleApplySuccess}
                  onCancel={() => setActiveTab('emp-dashboard')}
                />
              )}
              {(activeTab === 'emp-applications' || activeTab === 'emp-active-loans') && (
                <MyLoansView
                  onOpenApply={handleOpenGeneralApply}
                  onOpenVault={() => setActiveTab('emp-vault')}
                />
              )}
              {activeTab === 'emp-announcements' && <AnnouncementsView />}
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
              initialValues={applyInitialTerms}
              onSuccess={handleApplySuccess}
              onCancel={() => {
                setShowApplyModal(false);
                setApplyInitialTerms(undefined);
              }}
            />
          </div>
        </div>
      )}

      {/* In-App Floating Notification Toast (Alerts when status changes, co-maker request received, payment upcoming) */}
      <NotificationToast
        setActiveTab={setActiveTab}
        onOpenNotificationsModal={() => setShowNotificationCenter(true)}
      />

      {/* Comprehensive In-App Notification Center Modal */}
      <InAppNotificationCenterModal
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        setActiveTab={setActiveTab}
        setPortalMode={setPortalMode}
      />


      {/* Semi-Monthly Employee Paystub Voucher Modal */}
      <PaystubModal
        isOpen={showPaystubModal}
        onClose={() => setShowPaystubModal(false)}
        setActiveTab={setActiveTab}
      />

      {/* CSR & Community Outreach Accomplishment Report Modal */}
      <SubmitCSRReportModal
        isOpen={showCSRReportModal}
        onClose={() => setShowCSRReportModal(false)}
        setActiveTab={setActiveTab}
      />

      {/* Gmail & OTP Verification Center Modal */}
      <GmailOtpVerificationModal
        isOpen={isGmailOtpModalOpen}
        onClose={closeGmailOtpModal}
        defaultTab={gmailOtpModalProps.defaultTab}
        defaultPurpose={gmailOtpModalProps.defaultPurpose}
      />
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
