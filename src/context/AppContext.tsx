import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CurrentUser,
  Employee,
  Region,
  Area,
  Branch,
  LoanProduct,
  LoanApplication,
  LoanAccount,
  PayrollDeductionEntry,
  CSRProject,
  AuditLog,
  AppNotification,
  ApprovalDecision,
  LoanStatus,
  ReleaseMethod,
  UserRole,
} from '../types';
import {
  AVAILABLE_PERSONAS,
  INITIAL_EMPLOYEES,
  INITIAL_REGIONS,
  INITIAL_AREAS,
  INITIAL_BRANCHES,
  INITIAL_LOAN_PRODUCTS,
  INITIAL_APPLICATIONS,
  INITIAL_ACTIVE_LOANS,
  INITIAL_PAYROLL_DEDUCTIONS,
  INITIAL_CSR_PROJECTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from '../lib/constants';
import { calculateLoanFinancials } from '../lib/loans/calculator';

interface AppContextType {
  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;
  employees: Employee[];
  regions: Region[];
  areas: Area[];
  branches: Branch[];
  loanProducts: LoanProduct[];
  applications: LoanApplication[];
  activeLoans: LoanAccount[];
  payrollDeductions: PayrollDeductionEntry[];
  csrProjects: CSRProject[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  // Actions
  applyForLoan: (params: {
    employeeId: string;
    loanProductId: string;
    requestedAmount: number;
    termMonths: number;
    purpose: string;
    coMakers: string[];
    releaseMethod: ReleaseMethod;
    releaseDetails?: string;
  }) => { success: boolean; applicationNo?: string; error?: string };
  reviewApplication: (id: string, decision: 'APPROVED' | 'REJECTED', comments?: string) => void;
  voteApplication: (id: string, decision: ApprovalDecision, comments?: string) => void;
  rejectApplication: (id: string, reason: string) => void;
  releaseLoanDisbursement: (id: string, params: {
    method: ReleaseMethod;
    grossAmount: number;
    processingFee: number;
    otherFees: number;
    referenceNumber: string;
    disbursementAccount?: string;
  }) => { success: boolean; loanNumber?: string };
  postPayrollDeduction: (id: string, actualAmount: number, remarks?: string) => void;
  batchPostPayroll: (period: string) => void;
  recordManualPayment: (loanAccountId: string, amount: number, refNo: string, remarks?: string) => void;
  updateLoanProduct: (product: LoanProduct) => void;
  addCSRProject: (project: Omit<CSRProject, 'id' | 'projectNumber'>) => void;
  updateCSRProjectStatus: (id: string, status: CSRProject['status'], summary?: string) => void;
  checkInAttendance: (eventId: string, employeeId: string) => void;
  addProjectDonation: (projectId: string, donation: any) => void;
  addProjectExpense: (projectId: string, expense: any) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (emp: Employee) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(AVAILABLE_PERSONAS[0]); // Default: Juan Dela Cruz (MEMBER)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('oagims_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });
  const [regions] = useState<Region[]>(INITIAL_REGIONS);
  const [areas] = useState<Area[]>(INITIAL_AREAS);
  const [branches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>(() => {
    const saved = localStorage.getItem('oagims_loan_products');
    return saved ? JSON.parse(saved) : INITIAL_LOAN_PRODUCTS;
  });
  const [applications, setApplications] = useState<LoanApplication[]>(() => {
    const saved = localStorage.getItem('oagims_applications');
    return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
  });
  const [activeLoans, setActiveLoans] = useState<LoanAccount[]>(() => {
    const saved = localStorage.getItem('oagims_active_loans');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVE_LOANS;
  });
  const [payrollDeductions, setPayrollDeductions] = useState<PayrollDeductionEntry[]>(() => {
    const saved = localStorage.getItem('oagims_payroll');
    return saved ? JSON.parse(saved) : INITIAL_PAYROLL_DEDUCTIONS;
  });
  const [csrProjects, setCsrProjects] = useState<CSRProject[]>(() => {
    const saved = localStorage.getItem('oagims_csr_projects');
    return saved ? JSON.parse(saved) : INITIAL_CSR_PROJECTS;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('oagims_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('oagims_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // LocalStorage sync
  useEffect(() => {
    localStorage.setItem('oagims_employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem('oagims_applications', JSON.stringify(applications));
  }, [applications]);
  useEffect(() => {
    localStorage.setItem('oagims_active_loans', JSON.stringify(activeLoans));
  }, [activeLoans]);
  useEffect(() => {
    localStorage.setItem('oagims_payroll', JSON.stringify(payrollDeductions));
  }, [payrollDeductions]);
  useEffect(() => {
    localStorage.setItem('oagims_loan_products', JSON.stringify(loanProducts));
  }, [loanProducts]);
  useEffect(() => {
    localStorage.setItem('oagims_csr_projects', JSON.stringify(csrProjects));
  }, [csrProjects]);
  useEffect(() => {
    localStorage.setItem('oagims_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    localStorage.setItem('oagims_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const logAction = (
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    details: string,
    changes?: { field: string; oldVal?: string; newVal?: string }[]
  ) => {
    const now = new Date();
    const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: dateFormatted,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entityType,
      entityId,
      details,
      changes,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const notify = (
    title: string,
    message: string,
    type: AppNotification['type'],
    targetRole?: UserRole[],
    targetEmployeeId?: string
  ) => {
    const now = new Date();
    const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      timestamp: dateFormatted,
      read: false,
      type,
      targetRole,
      targetEmployeeId,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // 1. Apply For Loan
  const applyForLoan = ({
    employeeId,
    loanProductId,
    requestedAmount,
    termMonths,
    purpose,
    coMakers,
    releaseMethod,
    releaseDetails,
  }: {
    employeeId: string;
    loanProductId: string;
    requestedAmount: number;
    termMonths: number;
    purpose: string;
    coMakers: string[];
    releaseMethod: ReleaseMethod;
    releaseDetails?: string;
  }) => {
    const applicant = employees.find(e => e.id === employeeId);
    const product = loanProducts.find(p => p.id === loanProductId);
    if (!applicant || !product) {
      return { success: false, error: 'Applicant or Loan Product not found.' };
    }

    const applicationNo = `OPEC-${new Date().getFullYear()}-${String(applications.length + 33).padStart(5, '0')}`;
    const nowIso = new Date().toISOString();

    const initialApprovals = [
      { id: `appr-${Date.now()}-1`, role: 'LOAN_OFFICER' as UserRole, title: 'Loan Officer Review', approverName: 'Maria Clara Santos', approverId: 'emp-0002', decision: 'PENDING' as ApprovalDecision },
      { id: `appr-${Date.now()}-2`, role: 'AUDITOR' as UserRole, title: 'Audit Verification', approverName: 'Carlos Villar Dizon', approverId: 'emp-0005', decision: 'PENDING' as ApprovalDecision },
      { id: `appr-${Date.now()}-3`, role: 'PAYROLL_MASTER' as UserRole, title: 'Payroll Deduction Check', approverName: 'Patricia Cruz Gomez', approverId: 'emp-0006', decision: 'PENDING' as ApprovalDecision },
      { id: `appr-${Date.now()}-4`, role: 'TREASURER' as UserRole, title: 'Treasurer Review', approverName: 'Elena Corazon Mendoza', approverId: 'emp-0004', decision: 'PENDING' as ApprovalDecision },
      { id: `appr-${Date.now()}-5`, role: 'OPEC_PRESIDENT' as UserRole, title: 'President Approval', approverName: 'Engr. Roberto Eduardo Tan', approverId: 'emp-0003', decision: 'PENDING' as ApprovalDecision },
    ];

    const newApp: LoanApplication = {
      id: `app-${Date.now()}`,
      applicationNo,
      employeeId,
      loanProductId,
      purpose,
      requestedAmount,
      approvedAmount: requestedAmount,
      termMonths,
      interestRate: product.interestRate,
      processingFee: product.processingFee,
      releaseMethod,
      releaseDetails,
      status: 'FOR_REVIEW',
      submittedAt: nowIso,
      coMakers: coMakers.map(cmId => ({ employeeId: cmId, status: 'ACCEPTED' })),
      approvals: initialApprovals,
      documents: [
        { id: `doc-${Date.now()}-1`, name: `Payslip_${applicant.lastName}_Oct2026.pdf`, fileType: 'application/pdf', uploadedAt: new Date().toISOString().split('T')[0], fileSize: '1.2 MB' },
        { id: `doc-${Date.now()}-2`, name: `Loan_Application_${applicationNo}.pdf`, fileType: 'application/pdf', uploadedAt: new Date().toISOString().split('T')[0], fileSize: '980 KB' },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setApplications(prev => [newApp, ...prev]);

    logAction('SUBMIT_LOAN', 'LOAN_APPLICATION', applicationNo, `Submitted ${product.name} application for ₱${requestedAmount.toLocaleString()} (${termMonths} mos).`, [
      { field: 'status', oldVal: 'DRAFT', newVal: 'FOR_REVIEW' },
    ]);

    notify(
      'New Loan Application Submitted',
      `Application #${applicationNo} from ${applicant.firstName} ${applicant.lastName} (₱${requestedAmount.toLocaleString()}) requires Loan Officer initial review.`,
      'ACTION_REQUIRED',
      ['LOAN_OFFICER', 'SUPER_ADMIN']
    );

    return { success: true, applicationNo };
  };

  // 2. Loan Officer Review
  const reviewApplication = (id: string, decision: 'APPROVED' | 'REJECTED', comments?: string) => {
    setApplications(prev =>
      prev.map(app => {
        if (app.id !== id) return app;
        const newStatus: LoanStatus = decision === 'APPROVED' ? 'CREDIT_COMMITTEE' : 'REJECTED';
        const updatedApprovals = app.approvals.map(apr => {
          if (apr.role === 'LOAN_OFFICER') {
            return {
              ...apr,
              decision: decision as ApprovalDecision,
              comments: comments || 'Evaluation complete.',
              timestamp: new Date().toISOString(),
            };
          }
          return apr;
        });

        return {
          ...app,
          status: newStatus,
          reviewedAt: new Date().toISOString(),
          rejectionReason: decision === 'REJECTED' ? comments : undefined,
          approvals: updatedApprovals,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const targetApp = applications.find(a => a.id === id);
    if (targetApp) {
      logAction(
        decision === 'APPROVED' ? 'REVIEW_LOAN_PASSED' : 'REJECT_LOAN',
        'LOAN_APPLICATION',
        targetApp.applicationNo,
        `Loan Officer reviewed application: ${decision}. ${comments || ''}`
      );
      if (decision === 'APPROVED') {
        notify(
          'Loan Moved to Credit Committee',
          `Application #${targetApp.applicationNo} passed Loan Officer review and now awaits Credit Committee votes.`,
          'ACTION_REQUIRED',
          ['OPEC_PRESIDENT', 'TREASURER', 'AUDITOR', 'PAYROLL_MASTER', 'OPEC_ADVISER']
        );
      }
    }
  };

  // 3. Credit Committee Vote (President, Treasurer, Auditor, Payroll Master, Adviser)
  const voteApplication = (id: string, decision: ApprovalDecision, comments?: string) => {
    setApplications(prev =>
      prev.map(app => {
        if (app.id !== id) return app;

        const updatedApprovals = app.approvals.map(apr => {
          if (apr.role === currentUser.role || (currentUser.role === 'SUPER_ADMIN' && apr.decision === 'PENDING')) {
            return {
              ...apr,
              decision,
              comments: comments || apr.comments,
              approverName: currentUser.name,
              approverId: currentUser.employeeId || 'admin',
              timestamp: new Date().toISOString(),
            };
          }
          return apr;
        });

        // Check if all critical sign-offs are approved
        const presApproved = updatedApprovals.some(a => a.role === 'OPEC_PRESIDENT' && a.decision === 'APPROVED');
        const tresApproved = updatedApprovals.some(a => a.role === 'TREASURER' && a.decision === 'APPROVED');
        const audApproved = updatedApprovals.some(a => a.role === 'AUDITOR' && a.decision === 'APPROVED');
        const pmApproved = updatedApprovals.some(a => a.role === 'PAYROLL_MASTER' && a.decision === 'APPROVED');

        const allApproved = presApproved && tresApproved && audApproved && pmApproved;
        const anyRejected = updatedApprovals.some(a => a.decision === 'REJECTED');

        let newStatus = app.status;
        if (anyRejected) {
          newStatus = 'REJECTED';
        } else if (allApproved) {
          newStatus = 'FOR_RELEASE';
        }

        return {
          ...app,
          status: newStatus,
          approvedAt: allApproved ? new Date().toISOString() : app.approvedAt,
          rejectedAt: anyRejected ? new Date().toISOString() : app.rejectedAt,
          rejectionReason: anyRejected ? (comments || 'Rejected by committee member.') : undefined,
          approvals: updatedApprovals,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const targetApp = applications.find(a => a.id === id);
    if (targetApp) {
      logAction(
        decision === 'APPROVED' ? 'COMMITTEE_APPROVAL' : 'COMMITTEE_REJECTION',
        'LOAN_APPLICATION',
        targetApp.applicationNo,
        `${currentUser.role} voted ${decision}: ${comments || 'No comments'}`
      );
    }
  };

  // 4. Reject Application
  const rejectApplication = (id: string, reason: string) => {
    setApplications(prev =>
      prev.map(app => {
        if (app.id !== id) return app;
        return {
          ...app,
          status: 'REJECTED',
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    const targetApp = applications.find(a => a.id === id);
    if (targetApp) {
      logAction('REJECT_LOAN', 'LOAN_APPLICATION', targetApp.applicationNo, `Application rejected with reason: ${reason}`);
      notify(
        'Loan Application Rejected',
        `Your application #${targetApp.applicationNo} was rejected. Reason: ${reason}`,
        'ALERT',
        undefined,
        targetApp.employeeId
      );
    }
  };

  // 5. Release Loan Disbursement
  const releaseLoanDisbursement = (
    id: string,
    params: {
      method: ReleaseMethod;
      grossAmount: number;
      processingFee: number;
      otherFees: number;
      referenceNumber: string;
      disbursementAccount?: string;
    }
  ) => {
    const app = applications.find(a => a.id === id);
    if (!app) return { success: false };

    const product = loanProducts.find(p => p.id === app.loanProductId) || loanProducts[0];
    const loanNumber = `OPEC-LN-${new Date().getFullYear()}-${String(activeLoans.length + 23).padStart(4, '0')}`;
    const nowStr = new Date().toISOString();
    const releaseDate = nowStr.split('T')[0];

    // Compute maturity date
    const matDate = new Date();
    matDate.setMonth(matDate.getMonth() + app.termMonths);
    const maturityDate = matDate.toISOString().split('T')[0];

    // Calculate financials
    const financials = calculateLoanFinancials(params.grossAmount, app.termMonths, product, new Date());

    const newLoanAccount: LoanAccount = {
      id: `loan-act-${Date.now()}`,
      loanNumber,
      applicationId: app.id,
      employeeId: app.employeeId,
      loanProductId: app.loanProductId,
      principal: params.grossAmount,
      interestTotal: financials.totalInterest,
      processingFee: params.processingFee,
      totalPayable: financials.totalPayable,
      balance: financials.totalPayable,
      amountPaid: 0,
      releaseDate,
      maturityDate,
      status: 'ACTIVE',
      releaseInfo: {
        releasedAt: nowStr,
        releasedBy: currentUser.name,
        method: params.method,
        grossAmount: params.grossAmount,
        processingFee: params.processingFee,
        otherFees: params.otherFees,
        netAmount: params.grossAmount - params.processingFee - params.otherFees,
        referenceNumber: params.referenceNumber,
        disbursementAccount: params.disbursementAccount,
      },
      schedules: financials.schedules,
      payments: [],
    };

    // Update application to RELEASED
    setApplications(prev =>
      prev.map(a => (a.id === id ? { ...a, status: 'RELEASED', updatedAt: nowStr } : a))
    );

    // Add to active loans
    setActiveLoans(prev => [newLoanAccount, ...prev]);

    // Generate upcoming first payroll deduction
    const applicant = employees.find(e => e.id === app.employeeId);
    const branch = branches.find(b => b.id === applicant?.branchId);
    const upcomingSchedule = financials.schedules[0];

    if (upcomingSchedule) {
      const deductionEntry: PayrollDeductionEntry = {
        id: `prd-${Date.now()}`,
        loanAccountId: newLoanAccount.id,
        employeeId: app.employeeId,
        employeeNumber: applicant?.employeeNumber || 'ML-0000',
        employeeName: `${applicant?.firstName} ${applicant?.lastName}`,
        branchName: branch?.name || 'Main Branch',
        payrollPeriod: upcomingSchedule.dueDate,
        scheduledAmount: upcomingSchedule.amount,
        deductedAmount: upcomingSchedule.amount,
        difference: 0,
        status: 'SCHEDULED',
        payrollReference: `PR-${upcomingSchedule.dueDate}-${branch?.code || 'OPEC'}`,
        remarks: 'Auto-enrolled upon loan disbursement',
      };
      setPayrollDeductions(prev => [deductionEntry, ...prev]);
    }

    logAction(
      'RELEASE_LOAN',
      'LOAN_ACCOUNT',
      loanNumber,
      `Disbursed Net ₱${(params.grossAmount - params.processingFee - params.otherFees).toLocaleString()} via ${params.method} (Ref: ${params.referenceNumber}).`
    );

    notify(
      'Loan Successfully Released',
      `Loan #${loanNumber} has been disbursed to ${applicant?.firstName} ${applicant?.lastName}. Net released: ₱${(params.grossAmount - params.processingFee - params.otherFees).toLocaleString()}.`,
      'PAYMENT',
      undefined,
      app.employeeId
    );

    return { success: true, loanNumber };
  };

  // 6. Post Payroll Deduction (handles full or partial payment shortfall)
  const postPayrollDeduction = (id: string, actualAmount: number, remarks?: string) => {
    const entry = payrollDeductions.find(d => d.id === id);
    if (!entry) return;

    const diff = Math.round((actualAmount - entry.scheduledAmount) * 100) / 100;
    const isPartial = actualAmount < entry.scheduledAmount;
    const isWaived = actualAmount === 0;
    const nowIso = new Date().toISOString();

    const newStatus: PayrollDeductionEntry['status'] = isWaived
      ? 'MISSED'
      : isPartial
      ? 'PARTIAL'
      : 'POSTED';

    // Update payroll deduction record
    setPayrollDeductions(prev =>
      prev.map(d =>
        d.id === id
          ? {
              ...d,
              deductedAmount: actualAmount,
              difference: diff,
              status: newStatus,
              postedAt: nowIso,
              postedBy: currentUser.name,
              remarks: remarks || d.remarks,
            }
          : d
      )
    );

    // Update corresponding loan account balance and schedules
    setActiveLoans(prev =>
      prev.map(loan => {
        if (loan.id !== entry.loanAccountId) return loan;

        const newAmountPaid = Math.round((loan.amountPaid + actualAmount) * 100) / 100;
        const newBalance = Math.max(0, Math.round((loan.balance - actualAmount) * 100) / 100);
        const isFullyPaid = newBalance === 0;

        // Update first unpaid schedule
        let scheduleUpdated = false;
        const updatedSchedules = loan.schedules.map(sch => {
          if (!scheduleUpdated && (sch.status === 'SCHEDULED' || sch.status === 'PARTIAL')) {
            scheduleUpdated = true;
            return {
              ...sch,
              status: newStatus,
              paidAmount: actualAmount,
              paymentDate: nowIso.split('T')[0],
              paymentRef: entry.payrollReference,
            };
          }
          return sch;
        });

        // Add payment record
        const paymentRecord = {
          id: `pay-${Date.now()}`,
          loanAccountId: loan.id,
          paymentDate: nowIso.split('T')[0],
          amount: actualAmount,
          paymentType: 'PAYROLL_DEDUCTION' as const,
          referenceNo: entry.payrollReference,
          payrollPeriod: entry.payrollPeriod,
          receivedBy: currentUser.name,
          remarks: remarks || (isPartial ? `Shortfall of ₱${Math.abs(diff).toLocaleString()}` : 'Regular salary deduction'),
        };

        return {
          ...loan,
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: isFullyPaid ? 'FULLY_PAID' : 'ACTIVE',
          schedules: updatedSchedules,
          payments: [paymentRecord, ...loan.payments],
        };
      })
    );

    logAction(
      'POST_PAYMENT',
      'PAYROLL',
      entry.payrollReference,
      `Posted salary deduction for ${entry.employeeName}: ₱${actualAmount.toLocaleString()} (${newStatus}). Difference: ₱${diff.toLocaleString()}`
    );
  };

  // 7. Batch Post Payroll Deductions
  const batchPostPayroll = (period: string) => {
    const scheduledEntries = payrollDeductions.filter(d => d.payrollPeriod === period && d.status === 'SCHEDULED');
    scheduledEntries.forEach(entry => {
      postPayrollDeduction(entry.id, entry.scheduledAmount, 'Batch processed via Payroll Master');
    });
  };

  // 8. Record Manual Payment
  const recordManualPayment = (loanAccountId: string, amount: number, refNo: string, remarks?: string) => {
    const loan = activeLoans.find(l => l.id === loanAccountId);
    if (!loan) return;

    const nowIso = new Date().toISOString();
    const newAmountPaid = Math.round((loan.amountPaid + amount) * 100) / 100;
    const newBalance = Math.max(0, Math.round((loan.balance - amount) * 100) / 100);
    const isFullyPaid = newBalance === 0;

    setActiveLoans(prev =>
      prev.map(l => {
        if (l.id !== loanAccountId) return l;
        return {
          ...l,
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: isFullyPaid ? 'FULLY_PAID' : 'ACTIVE',
          payments: [
            {
              id: `pay-${Date.now()}`,
              loanAccountId,
              paymentDate: nowIso.split('T')[0],
              amount,
              paymentType: 'DIRECT_CASH',
              referenceNo: refNo,
              receivedBy: currentUser.name,
              remarks,
            },
            ...l.payments,
          ],
        };
      })
    );

    logAction('POST_PAYMENT', 'PAYMENT', refNo, `Direct OTC payment of ₱${amount.toLocaleString()} received for loan ${loan.loanNumber}.`);
  };

  // 9. Loan Product Configuration
  const updateLoanProduct = (product: LoanProduct) => {
    setLoanProducts(prev => prev.map(p => (p.id === product.id ? product : p)));
    logAction('UPDATE_POLICY', 'POLICY', product.code, `Updated terms for ${product.name}: Rate ${product.interestRate}%, Max ₱${product.maxAmount.toLocaleString()}`);
  };

  // 10. CSR Projects Actions
  const addCSRProject = (projectData: Omit<CSRProject, 'id' | 'projectNumber'>) => {
    const projectNumber = `OA-CSR-${new Date().getFullYear()}-${String(csrProjects.length + 88).padStart(3, '0')}`;
    const newProj: CSRProject = {
      ...projectData,
      id: `proj-${Date.now()}`,
      projectNumber,
      beneficiaries: projectData.beneficiaries || [],
      events: projectData.events || [],
      donations: projectData.donations || [],
      expenses: projectData.expenses || [],
    };
    setCsrProjects(prev => [newProj, ...prev]);
    logAction('CREATE_PROJECT', 'PROJECT', projectNumber, `Created new CSR Project: "${newProj.name}" with budget ₱${newProj.budget.toLocaleString()}.`);
  };

  const updateCSRProjectStatus = (id: string, status: CSRProject['status'], summary?: string) => {
    setCsrProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, status, accomplishmentSummary: summary || p.accomplishmentSummary } : p))
    );
    const target = csrProjects.find(p => p.id === id);
    if (target) {
      logAction('UPDATE_PROJECT', 'PROJECT', target.projectNumber, `Updated status to ${status}.`);
    }
  };

  const checkInAttendance = (eventId: string, employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    const branch = branches.find(b => b.id === employee.branchId);

    setCsrProjects(prev =>
      prev.map(proj => {
        const hasEvent = proj.events.some(e => e.id === eventId);
        if (!hasEvent) return proj;

        const updatedEvents = proj.events.map(ev => {
          if (ev.id !== eventId) return ev;
          return {
            ...ev,
            actualParticipants: ev.actualParticipants + 1,
          };
        });

        return { ...proj, events: updatedEvents };
      })
    );

    logAction('QR_ATTENDANCE', 'PROJECT', eventId, `Checked in ${employee.firstName} ${employee.lastName} (${employee.employeeNumber}, ${branch?.name || ''}).`);
  };

  const addProjectDonation = (projectId: string, donation: any) => {
    setCsrProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const newDon = {
          ...donation,
          id: `don-${Date.now()}`,
          donationNumber: `DON-${new Date().getFullYear()}-${String((p.donations?.length || 0) + 16).padStart(3, '0')}`,
        };
        return { ...p, donations: [newDon, ...(p.donations || [])] };
      })
    );
  };

  const addProjectExpense = (projectId: string, expense: any) => {
    setCsrProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const newExp = { ...expense, id: `exp-${Date.now()}` };
        return {
          ...p,
          spentAmount: p.spentAmount + (expense.amount || 0),
          expenses: [newExp, ...(p.expenses || [])],
        };
      })
    );
  };

  // 11. Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // 12. Employee management
  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    const id = `emp-${Date.now()}`;
    const newEmp = { ...empData, id };
    setEmployees(prev => [...prev, newEmp]);
    logAction('CREATE_EMPLOYEE', 'EMPLOYEE', newEmp.employeeNumber, `Added employee ${newEmp.firstName} ${newEmp.lastName}.`);
  };

  const updateEmployee = (emp: Employee) => {
    setEmployees(prev => prev.map(e => (e.id === emp.id ? emp : e)));
    logAction('UPDATE_EMPLOYEE', 'EMPLOYEE', emp.employeeNumber, `Updated records for ${emp.firstName} ${emp.lastName}.`);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        employees,
        regions,
        areas,
        branches,
        loanProducts,
        applications,
        activeLoans,
        payrollDeductions,
        csrProjects,
        auditLogs,
        notifications,
        applyForLoan,
        reviewApplication,
        voteApplication,
        rejectApplication,
        releaseLoanDisbursement,
        postPayrollDeduction,
        batchPostPayroll,
        recordManualPayment,
        updateLoanProduct,
        addCSRProject,
        updateCSRProjectStatus,
        checkInAttendance,
        addProjectDonation,
        addProjectExpense,
        markNotificationRead,
        markAllNotificationsRead,
        addEmployee,
        updateEmployee,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
