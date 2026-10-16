import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  NotificationCategory,
  ApprovalDecision,
  LoanStatus,
  ReleaseMethod,
  UserRole,
  LoanDocument,
  Announcement,
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
  INITIAL_ANNOUNCEMENTS,
} from '../lib/constants';
import { calculateLoanFinancials } from '../lib/loans/calculator';
import {
  subscribeAuth,
  googleSignIn,
  googleLogout,
  isGoogleAuthenticated,
  getCurrentGoogleUser,
} from '../lib/services/googleAuth';
import {
  sendGmailNotification,
  sendGmailOtp,
  verifyEnteredOtp,
  isEmailVerified,
} from '../lib/services/gmailService';

interface AppContextType {
  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;
  // Gmail & Google Workspace OAuth
  registeredGmail: string;
  setRegisteredGmail: (email: string) => void;
  isGoogleConnected: boolean;
  googleUser: any;
  isGmailVerified: boolean;
  isGmailOtpModalOpen: boolean;
  gmailOtpModalProps: { defaultTab?: 'OTP' | 'NOTIF' | 'LOGS'; defaultPurpose?: string };
  openGmailOtpModal: (options?: { defaultTab?: 'OTP' | 'NOTIF' | 'LOGS'; defaultPurpose?: string }) => void;
  closeGmailOtpModal: () => void;
  refreshGmailState: () => void;
  // Dark mode
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
  employees: Employee[];
  regions: Region[];
  areas: Area[];
  branches: Branch[];
  loanProducts: LoanProduct[];
  applications: LoanApplication[];
  activeLoans: LoanAccount[];
  payrollDeductions: PayrollDeductionEntry[];
  csrProjects: CSRProject[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  // Actions
  applyForLoan: (params: {
    employeeId: string;
    loanProductId: string;
    requestedAmount: number;
    termMonths: number;
    purpose: string;
    coMakers: Array<{ employeeId: string; signatureUrl?: string; signatureDate?: string }> | string[];
    releaseMethod: ReleaseMethod;
    releaseDetails?: string;
    documents?: LoanDocument[];
    applicantSignatureUrl?: string;
    applicantSignatureDate?: string;
  }) => { success: boolean; applicationNo?: string; error?: string };
  approveByAreaManager: (
    id: string,
    params: {
      signatureUrl: string;
      signatureDate: string;
      comments?: string;
      approverName?: string;
      approverId?: string;
    }
  ) => void;
  approveByOpecPresident: (
    id: string,
    params: {
      signatureUrl: string;
      signatureDate: string;
      comments?: string;
      approverName?: string;
      approverId?: string;
    }
  ) => void;
  approveByRegionalManager: (
    id: string,
    params: {
      signatureUrl: string;
      signatureDate: string;
      comments?: string;
      approverName?: string;
      approverId?: string;
    }
  ) => void;
  reviewApplication: (
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    comments?: string,
    signatureUrl?: string,
    signatureDate?: string
  ) => void;
  voteApplication: (
    id: string,
    decision: ApprovalDecision,
    comments?: string,
    signatureUrl?: string,
    signatureDate?: string
  ) => void;
  rejectApplication: (id: string, reason: string) => void;
  releaseLoanDisbursement: (id: string, params: {
    method: ReleaseMethod;
    grossAmount: number;
    processingFee: number;
    otherFees: number;
    referenceNumber: string;
    disbursementAccount?: string;
    signatureUrl?: string;
    signatureDate?: string;
  }) => { success: boolean; loanNumber?: string };
  postPayrollDeduction: (id: string, actualAmount: number, remarks?: string) => void;
  batchPostPayroll: (period: string) => void;
  recordManualPayment: (loanAccountId: string, amount: number, refNo: string, remarks?: string) => void;
  updateLoanProduct: (product: LoanProduct) => void;
  addCSRProject: (project: Omit<CSRProject, 'id' | 'projectNumber'>) => void;
  updateCSRProject: (project: CSRProject) => void;
  deleteCSRProject: (id: string) => void;
  updateCSRProjectStatus: (id: string, status: CSRProject['status'], summary?: string) => void;
  checkInAttendance: (eventId: string, employeeId: string) => void;
  addProjectDonation: (projectId: string, donation: any) => void;
  addProjectExpense: (projectId: string, expense: any) => void;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAnnouncement: (announcement: Announcement) => void;
  deleteAnnouncement: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  sendTestNotification: (category: NotificationCategory, employeeId?: string) => void;
  notify: (
    title: string,
    message: string,
    type: AppNotification['type'],
    targetRole?: UserRole[],
    targetEmployeeId?: string,
    category?: NotificationCategory,
    linkAction?: string,
    relatedId?: string,
    actorName?: string
  ) => void;
  currentUserNotifications: AppNotification[];
  latestToast: AppNotification | null;
  dismissToast: () => void;
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (emp: Employee) => void;
  deleteEmployee: (id: string) => void;
  sendCoMakerRequest: (applicantName: string, coMakerId: string, amount: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(AVAILABLE_PERSONAS[0]); // Default: Juan Dela Cruz (MEMBER)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('oagims_employees');
    if (!saved) return INITIAL_EMPLOYEES;
    try {
      const parsed: Employee[] = JSON.parse(saved);
      const initialMap = new Map(INITIAL_EMPLOYEES.map(e => [e.id, e]));
      const merged: Employee[] = parsed.map(p => {
        const init = initialMap.get(p.id);
        return {
          ...p,
          reportsToId: p.reportsToId !== undefined ? p.reportsToId : init?.reportsToId,
        };
      });
      for (const initEmp of INITIAL_EMPLOYEES) {
        if (!merged.some(e => e.id === initEmp.id)) {
          merged.push(initEmp);
        }
      }
      return merged;
    } catch {
      return INITIAL_EMPLOYEES;
    }
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
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('oagims_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('oagims_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('oagims_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });
  const [latestToast, setLatestToast] = useState<AppNotification | null>(null);

  // Registered Gmail address for notifications & OTP verification
  const [registeredGmail, setRegisteredGmailState] = useState<string>(() => {
    return localStorage.getItem('oagims_registered_gmail') || 'mcpatenz45@gmail.com';
  });
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isGmailVerified, setIsGmailVerified] = useState<boolean>(() => {
    return isEmailVerified(localStorage.getItem('oagims_registered_gmail') || 'mcpatenz45@gmail.com');
  });

  const [isGmailOtpModalOpen, setIsGmailOtpModalOpen] = useState(false);
  const [gmailOtpModalProps, setGmailOtpModalProps] = useState<{
    defaultTab?: 'OTP' | 'NOTIF' | 'LOGS';
    defaultPurpose?: string;
  }>({
    defaultTab: 'OTP',
    defaultPurpose: 'Email & Identity Verification',
  });

  const refreshGmailState = () => {
    setIsGoogleConnected(isGoogleAuthenticated());
    setGoogleUser(getCurrentGoogleUser());
    setIsGmailVerified(isEmailVerified(registeredGmail));
  };

  const setRegisteredGmail = (email: string) => {
    const clean = email.trim();
    setRegisteredGmailState(clean);
    localStorage.setItem('oagims_registered_gmail', clean);
    setIsGmailVerified(isEmailVerified(clean));
  };

  const openGmailOtpModal = (options?: { defaultTab?: 'OTP' | 'NOTIF' | 'LOGS'; defaultPurpose?: string }) => {
    setGmailOtpModalProps({
      defaultTab: options?.defaultTab || 'OTP',
      defaultPurpose: options?.defaultPurpose || 'Email & Identity Verification',
    });
    setIsGmailOtpModalOpen(true);
  };

  const closeGmailOtpModal = () => {
    setIsGmailOtpModalOpen(false);
  };

  // Subscribe to Google Auth changes
  useEffect(() => {
    const unsubscribe = subscribeAuth((user, token) => {
      setGoogleUser(user);
      setIsGoogleConnected(!!token);
    });
    return () => unsubscribe();
  }, []);

  // Dark mode persistence for reduced eye strain during late-hour work
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('opec_aurum_theme') || localStorage.getItem('theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('opec_aurum_theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('opec_aurum_theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
  };

  const dismissToast = () => setLatestToast(null);

  // Compute notifications filtered for current persona/user
  const currentUserNotifications = useMemo(() => {
    return notifications.filter(n => {
      // 1. If targeted to a specific employee ID
      if (n.targetEmployeeId) {
        return n.targetEmployeeId === currentUser.employeeId;
      }
      // 2. If targeted to specific admin/officer roles
      if (n.targetRole && n.targetRole.length > 0) {
        return n.targetRole.includes(currentUser.role) || currentUser.role === 'SUPER_ADMIN';
      }
      // 3. Untargeted / broadcast alert
      return true;
    });
  }, [notifications, currentUser]);

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
    localStorage.setItem('oagims_announcements', JSON.stringify(announcements));
  }, [announcements]);
  useEffect(() => {
    localStorage.setItem('oagims_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    localStorage.setItem('oagims_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Automated detection of upcoming loan payments (due in <= 7 days)
  useEffect(() => {
    if (activeLoans.length > 0 && employees.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      activeLoans.forEach(loan => {
        if (loan.status === 'ACTIVE') {
          const upcomingSched = (loan.schedules || []).find(s => {
            if (s.status !== 'SCHEDULED' || !s.dueDate) return false;
            const due = new Date(s.dueDate + 'T00:00:00');
            const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7;
          });

          if (upcomingSched) {
            const alreadyAlerted = notifications.some(
              n =>
                n.category === 'UPCOMING_PAYMENT' &&
                n.targetEmployeeId === loan.employeeId &&
                n.relatedId === loan.loanNumber &&
                n.message.includes(upcomingSched.dueDate)
            );

            if (!alreadyAlerted) {
              const due = new Date(upcomingSched.dueDate + 'T00:00:00');
              const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const daysText = diffDays === 0 ? 'today' : `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;

              notify(
                'Upcoming Payday Loan Deduction Alert',
                `Semi-monthly installment of ₱${upcomingSched.amount.toLocaleString()} for Loan #${loan.loanNumber} is due ${daysText} (${upcomingSched.dueDate}) via automatic salary deduction.`,
                'PAYMENT',
                undefined,
                loan.employeeId,
                'UPCOMING_PAYMENT',
                'emp-dashboard',
                loan.loanNumber,
                'Branch Payroll Master'
              );
            }
          }
        }
      });
    }
  }, [activeLoans, employees]);

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
    targetEmployeeId?: string,
    category?: NotificationCategory,
    linkAction?: string,
    relatedId?: string,
    actorName?: string
  ) => {
    const now = new Date();
    const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Auto-derive category if not passed
    const inferredCategory: NotificationCategory =
      category ||
      (type === 'PAYMENT'
        ? 'UPCOMING_PAYMENT'
        : type === 'ACTION_REQUIRED'
        ? 'COMAKER_REQUEST'
        : 'LOAN_STATUS');

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      timestamp: dateFormatted,
      read: false,
      type,
      category: inferredCategory,
      targetRole,
      targetEmployeeId,
      linkAction: linkAction || (inferredCategory === 'UPCOMING_PAYMENT' ? 'emp-dashboard' : inferredCategory === 'COMAKER_REQUEST' ? 'emp-applications' : 'emp-applications'),
      relatedId,
      actorName,
    };
    setNotifications(prev => [newNotif, ...prev]);
    setLatestToast(newNotif);

    // If Google Workspace OAuth is connected, dispatch real Gmail notification to registered email
    if (isGoogleAuthenticated() && registeredGmail) {
      sendGmailNotification({
        toEmail: registeredGmail,
        recipientName: currentUser.name || 'Valued Member',
        title,
        message,
        category: inferredCategory,
        referenceId: relatedId,
        actorName,
      }).catch(err => {
        console.warn('Background Gmail dispatch info:', err);
      });
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const sendTestNotification = (cat: NotificationCategory, targetEmpId?: string) => {
    const empId = targetEmpId || currentUser.employeeId || 'emp-0001';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (cat === 'LOAN_STATUS') {
      notify(
        'Loan Status Update: Approved by Area Manager',
        `Your Commodity Loan application #OPEC-2026-00031 was verified and signed by Area Manager Engr. Manuel Roxas at ${nowTime}. It has advanced to OPEC President review.`,
        'APPROVAL',
        undefined,
        empId,
        'LOAN_STATUS',
        'emp-applications',
        'OPEC-2026-00031',
        'Engr. Manuel Roxas'
      );
    } else if (cat === 'COMAKER_REQUEST') {
      notify(
        'Co-Maker Guarantee Request Received',
        `Ana Reyes has nominated you as Co-Maker for an OPEC Emergency Loan of ₱15,000.00 at ${nowTime}. Action required: Review undertaking and affix your signature endorsement.`,
        'ACTION_REQUIRED',
        undefined,
        empId,
        'COMAKER_REQUEST',
        'emp-applications',
        'OPEC-2026-00029',
        'Ana Reyes'
      );
    } else if (cat === 'UPCOMING_PAYMENT') {
      notify(
        'Upcoming Payday Loan Deduction Alert',
        `Payment Reminder: Semi-monthly deduction of ₱983.33 for Loan #OPEC-LN-2026-0012 is scheduled for payroll cutoff on October 15, 2026. Current balance: ₱7,866.64.`,
        'PAYMENT',
        undefined,
        empId,
        'UPCOMING_PAYMENT',
        'emp-dashboard',
        'OPEC-LN-2026-0012',
        'Branch Payroll Master'
      );
    } else if (cat === 'PAYMENT_CREDITED') {
      notify(
        'Payment Successfully Credited',
        `₱983.33 payroll deduction was posted to Loan #OPEC-LN-2026-0012. Updated balance: ₱6,883.31. Official receipt: PR-2026-10-15.`,
        'INFO',
        undefined,
        empId,
        'PAYMENT_CREDITED',
        'emp-loans',
        'OPEC-LN-2026-0012',
        'Patricia Gomez'
      );
    }
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
    documents,
    applicantSignatureUrl,
    applicantSignatureDate,
  }: {
    employeeId: string;
    loanProductId: string;
    requestedAmount: number;
    termMonths: number;
    purpose: string;
    coMakers: Array<{ employeeId: string; signatureUrl?: string; signatureDate?: string }> | string[];
    releaseMethod: ReleaseMethod;
    releaseDetails?: string;
    documents?: LoanDocument[];
    applicantSignatureUrl?: string;
    applicantSignatureDate?: string;
  }) => {
    const applicant = employees.find(e => e.id === employeeId);
    const product = loanProducts.find(p => p.id === loanProductId);
    if (!applicant || !product) {
      return { success: false, error: 'Applicant or Loan Product not found.' };
    }

    const applicationNo = `OPEC-${new Date().getFullYear()}-${String(applications.length + 33).padStart(5, '0')}`;
    const nowIso = new Date().toISOString();

    const initialApprovals = [
      {
        id: `appr-${Date.now()}-am`,
        role: 'AREA_MANAGER' as UserRole,
        title: `Area Manager Approval (${applicant.areaName || 'Area Command'})`,
        approverName: 'Engr. Manuel Roxas',
        approverId: 'emp-0012',
        decision: 'PENDING' as ApprovalDecision,
      },
      {
        id: `appr-${Date.now()}-pres`,
        role: 'OPEC_PRESIDENT' as UserRole,
        title: 'OPEC President Check & Review',
        approverName: 'Engr. Roberto Eduardo Tan',
        approverId: 'emp-0003',
        decision: 'PENDING' as ApprovalDecision,
      },
      {
        id: `appr-${Date.now()}-rm`,
        role: 'REGIONAL_MANAGER' as UserRole,
        title: 'Regional Manager Approval (Region 20 - ZASURMIS)',
        approverName: 'Victoriano Reyes',
        approverId: 'emp-0013',
        decision: 'PENDING' as ApprovalDecision,
      },
      {
        id: `appr-${Date.now()}-tres`,
        role: 'TREASURER' as UserRole,
        title: 'Treasurer Release Disbursement',
        approverName: 'Elena Corazon Mendoza',
        approverId: 'emp-0004',
        decision: 'PENDING' as ApprovalDecision,
      },
    ];

    const formattedCoMakers = coMakers.map((cm: any) => {
      if (typeof cm === 'string') {
        return {
          employeeId: cm,
          status: 'ACCEPTED' as const,
          signatureDate: nowIso.split('T')[0],
          endorsedAt: nowIso,
        };
      }
      return {
        employeeId: cm.employeeId,
        status: 'ACCEPTED' as const,
        signatureUrl: cm.signatureUrl,
        signatureDate: cm.signatureDate || nowIso.split('T')[0],
        endorsedAt: nowIso,
      };
    });

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
      status: 'AREA_MANAGER_REVIEW',
      submittedAt: nowIso,
      coMakers: formattedCoMakers,
      approvals: initialApprovals,
      documents: documents && documents.length > 0 ? documents : [
        { id: `doc-${Date.now()}-1`, name: `Payslip_${applicant.lastName}_Oct2026.pdf`, fileType: 'application/pdf', uploadedAt: new Date().toISOString().split('T')[0], fileSize: '1.2 MB', category: 'Latest Verified Payslip' },
        { id: `doc-${Date.now()}-2`, name: `Loan_Application_${applicationNo}.pdf`, fileType: 'application/pdf', uploadedAt: new Date().toISOString().split('T')[0], fileSize: '980 KB', category: 'Application Form' },
      ],
      applicantSignatureUrl: applicantSignatureUrl || undefined,
      applicantSignatureDate: applicantSignatureDate || (applicantSignatureUrl ? nowIso.split('T')[0] : undefined),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setApplications(prev => [newApp, ...prev]);

    logAction('SUBMIT_LOAN', 'LOAN_APPLICATION', applicationNo, `Submitted ${product.name} application for ₱${requestedAmount.toLocaleString()} (${termMonths} mos). Co-maker endorsements signed. Awaiting Area Manager review.`, [
      { field: 'status', oldVal: 'DRAFT', newVal: 'AREA_MANAGER_REVIEW' },
    ]);

    notify(
      'New Loan Application Submitted',
      `Application #${applicationNo} from ${applicant.firstName} ${applicant.lastName} (₱${requestedAmount.toLocaleString()}) submitted. Awaiting Area Manager endorsement.`,
      'ACTION_REQUIRED',
      ['AREA_MANAGER', 'SUPER_ADMIN'],
      undefined,
      'APPROVAL',
      'adm-approvals',
      applicationNo
    );

    // Alert employee directly
    notify(
      'Loan Application Submitted',
      `Your ${product.name} application #${applicationNo} for ₱${requestedAmount.toLocaleString()} has been received and routed to Area Manager (${applicant.areaName || 'Area Command'}) for review.`,
      'INFO',
      undefined,
      employeeId,
      'LOAN_STATUS',
      'emp-applications',
      applicationNo,
      `${applicant.firstName} ${applicant.lastName}`
    );

    return { success: true, applicationNo };
  };

  // 2. Sequential Hierarchy Approvals
  const approveByAreaManager = (
    id: string,
    params: {
      signatureUrl: string;
      signatureDate: string;
      comments?: string;
      approverName?: string;
      approverId?: string;
    }
  ) => {
    const nowIso = new Date().toISOString();
    setApplications(prev =>
      prev.map(app => {
        if (app.id !== id) return app;
        const updatedApprovals = app.approvals.map(apr => {
          if (apr.role === 'AREA_MANAGER') {
            return {
              ...apr,
              decision: 'APPROVED' as ApprovalDecision,
              comments: params.comments || 'Area Manager verified and approved application.',
              approverName: params.approverName || currentUser.name,
              approverId: params.approverId || currentUser.employeeId || 'emp-0012',
              signatureUrl: params.signatureUrl,
              signatureDate: params.signatureDate,
              timestamp: nowIso,
            };
          }
          return apr;
        });

        return {
          ...app,
          status: 'OPEC_PRESIDENT_REVIEW' as LoanStatus,
          reviewedAt: nowIso,
          approvals: updatedApprovals,
          updatedAt: nowIso,
        };
      })
    );

    const targetApp = applications.find(a => a.id === id);
    if (targetApp) {
      logAction(
        'AREA_MANAGER_APPROVAL',
        'LOAN_APPLICATION',
        targetApp.applicationNo,
        `Area Manager endorsed application with signature. Redirected to OPEC President for check & review.`
      );
      notify(
        'Loan Awaiting OPEC President Review',
        `Application #${targetApp.applicationNo} was endorsed by Area Manager and now requires OPEC President review.`,
        'ACTION_REQUIRED',
        ['OPEC_PRESIDENT', 'SUPER_ADMIN']
      );
      // Alert employee when loan status changes
      notify(
        'Loan Status Update: Area Manager Endorsed',
        `Your loan application #${targetApp.applicationNo} has been verified and endorsed by Area Manager ${params.approverName || currentUser.name}. Routed to OPEC President review.`,
        'APPROVAL',
        undefined,
        targetApp.employeeId,
        'LOAN_STATUS',
        'emp-applications',
        targetApp.applicationNo,
        params.approverName || currentUser.name
      );
    }
  };

  const approveByOpecPresident = (
    id: string,
    params: {
      signatureUrl: string;
      signatureDate: string;
      comments?: string;
      approverName?: string;
      approverId?: string;
    }
  ) => {
    const nowIso = new Date().toISOString();
    setApplications(prev =>
      prev.map(app => {
        if (app.id !== id) return app;
        const updatedApprovals = app.approvals.map(apr => {
          if (apr.role === 'OPEC_PRESIDENT') {
            return {
              ...apr,
              decision: 'APPROVED' as ApprovalDecision,
              comments: params.comments || 'OPEC President checked, reviewed, and approved.',
              approverName: params.approverName || currentUser.name,
              approverId: params.approverId || currentUser.employeeId || 'emp-0003',
              signatureUrl: params.signatureUrl,
              signatureDate: params.signatureDate,
              timestamp: nowIso,
            };
          }
          return apr;
        });

        return {
          ...app,
          status: 'REGIONAL_MANAGER_REVIEW' as LoanStatus,
          approvals: updatedApprovals,
          updatedAt: nowIso,
        };
      })
    );

    const targetApp = applications.find(a => a.id === id);
    if (targetApp) {
      logAction(
        'OPEC_PRESIDENT_APPROVAL',
        'LOAN_APPLICATION',
        targetApp.applicationNo,
        `OPEC President reviewed and approved with signature. Redirected to Regional Manager for approval.`
      );
      notify(
        'Loan Awaiting Regional Manager Approval',
        `Application #${targetApp.applicationNo} passed OPEC President review and now requires Regional Manager approval.`,
        'ACTION_REQUIRED',
        ['REGIONAL_MANAGER', 'SUPER_ADMIN']
      );
      // Alert employee when loan status changes
      notify(
        'Loan Status Update: OPEC President Approved',
        `Your loan application #${targetApp.applicationNo} passed OPEC President review by ${params.approverName || currentUser.name}. Forwarded to Regional Manager for final release approval.`,
        'APPROVAL',
        undefined,
        targetApp.employeeId,
        'LOAN_STATUS',
        'emp-applications',
        targetApp.applicationNo,
        params.approverName || currentUser.name
      );
    }
  };

  const approveByRegionalManager = (
    id: string,
    params: {
      signatureUrl: string;
      signatureDate: string;
      comments?: string;
      approverName?: string;
      approverId?: string;
    }
  ) => {
    const nowIso = new Date().toISOString();
    setApplications(prev =>
      prev.map(app => {
        if (app.id !== id) return app;
        const updatedApprovals = app.approvals.map(apr => {
          if (apr.role === 'REGIONAL_MANAGER') {
            return {
              ...apr,
              decision: 'APPROVED' as ApprovalDecision,
              comments: params.comments || 'Regional Manager authorized release.',
              approverName: params.approverName || currentUser.name,
              approverId: params.approverId || currentUser.employeeId || 'emp-0013',
              signatureUrl: params.signatureUrl,
              signatureDate: params.signatureDate,
              timestamp: nowIso,
            };
          }
          return apr;
        });

        return {
          ...app,
          status: 'FOR_RELEASE' as LoanStatus,
          approvedAt: nowIso,
          approvals: updatedApprovals,
          updatedAt: nowIso,
        };
      })
    );

    const targetApp = applications.find(a => a.id === id);
    if (targetApp) {
      logAction(
        'REGIONAL_MANAGER_APPROVAL',
        'LOAN_APPLICATION',
        targetApp.applicationNo,
        `Regional Manager authorized application with signature. Redirected to Treasurer for release.`
      );
      notify(
        'Loan Ready for Release by Treasurer',
        `Application #${targetApp.applicationNo} approved by Regional Manager. Ready for Treasurer release disbursement.`,
        'APPROVAL',
        ['TREASURER', 'SUPER_ADMIN']
      );
      // Alert employee when loan status changes
      notify(
        'Loan Status Update: Regional Manager Authorized',
        `Your loan application #${targetApp.applicationNo} has received executive authorization from Regional Manager ${params.approverName || currentUser.name}. Transferred to Treasurer for cash disbursement release.`,
        'APPROVAL',
        undefined,
        targetApp.employeeId,
        'LOAN_STATUS',
        'emp-applications',
        targetApp.applicationNo,
        params.approverName || currentUser.name
      );
    }
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
        notify(
          'Loan Status Update: Credit Appraisal Passed',
          `Your loan application #${targetApp.applicationNo} successfully passed Loan Officer credit appraisal and advanced to Credit Committee voting.`,
          'INFO',
          undefined,
          targetApp.employeeId,
          'LOAN_STATUS',
          'emp-applications',
          targetApp.applicationNo
        );
      } else {
        notify(
          'Loan Application Rejected',
          `Your loan application #${targetApp.applicationNo} was rejected during initial credit review. Remarks: ${comments || 'Evaluation criteria not met'}.`,
          'ALERT',
          undefined,
          targetApp.employeeId,
          'LOAN_STATUS',
          'emp-applications',
          targetApp.applicationNo
        );
      }
    }
  };

  // 3. Credit Committee Vote (President, Treasurer, Auditor, Payroll Master, Adviser)
  const voteApplication = (id: string, decision: ApprovalDecision, comments?: string) => {
    let finalStatus: LoanStatus | null = null;
    let anyVoteRejected = false;
    let allVotesApproved = false;

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

        allVotesApproved = presApproved && tresApproved && audApproved && pmApproved;
        anyVoteRejected = updatedApprovals.some(a => a.decision === 'REJECTED');

        let newStatus = app.status;
        if (anyVoteRejected) {
          newStatus = 'REJECTED';
        } else if (allVotesApproved) {
          newStatus = 'FOR_RELEASE';
        }
        finalStatus = newStatus;

        return {
          ...app,
          status: newStatus,
          approvedAt: allVotesApproved ? new Date().toISOString() : app.approvedAt,
          rejectedAt: anyVoteRejected ? new Date().toISOString() : app.rejectedAt,
          rejectionReason: anyVoteRejected ? (comments || 'Rejected by committee member.') : undefined,
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

      // Alert employee on outcome
      if (anyVoteRejected) {
        notify(
          'Loan Status Update: Rejected by Credit Committee',
          `Your loan application #${targetApp.applicationNo} was rejected by Credit Committee member (${currentUser.role}). Remarks: ${comments || 'Consensus criteria unmet'}.`,
          'ALERT',
          undefined,
          targetApp.employeeId,
          'LOAN_STATUS',
          'emp-applications',
          targetApp.applicationNo,
          currentUser.name
        );
      } else if (allVotesApproved) {
        notify(
          'Loan Status Update: Approved for Release',
          `Great news! Your loan application #${targetApp.applicationNo} was approved by the Credit Committee and is ready for Treasurer disbursement.`,
          'APPROVAL',
          undefined,
          targetApp.employeeId,
          'LOAN_STATUS',
          'emp-applications',
          targetApp.applicationNo,
          currentUser.name
        );
      }
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

  const releaseLoanDisbursement = (
    id: string,
    params: {
      method: ReleaseMethod;
      grossAmount: number;
      processingFee: number;
      otherFees: number;
      referenceNumber: string;
      disbursementAccount?: string;
      signatureUrl?: string;
      signatureDate?: string;
    }
  ) => {
    const app = applications.find(a => a.id === id);
    if (!app) return { success: false };

    const product = loanProducts.find(p => p.id === app.loanProductId) || loanProducts[0];
    const loanNumber = `OPEC-LN-${new Date().getFullYear()}-${String(activeLoans.length + 23).padStart(4, '0')}`;
    const nowStr = new Date().toISOString();
    const releaseDate = params.signatureDate || nowStr.split('T')[0];

    // Compute maturity date
    const matDate = new Date();
    matDate.setMonth(matDate.getMonth() + app.termMonths);
    const maturityDate = matDate.toISOString().split('T')[0];

    // Calculate financials
    const financials = calculateLoanFinancials(params.grossAmount, app.termMonths, product, new Date());

    const updatedApprovals = app.approvals.map(apr => {
      if (apr.role === 'TREASURER') {
        return {
          ...apr,
          decision: 'APPROVED' as ApprovalDecision,
          signatureUrl: params.signatureUrl || apr.signatureUrl,
          signatureDate: params.signatureDate || releaseDate,
          timestamp: nowStr,
        };
      }
      return apr;
    });

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
        signatureUrl: params.signatureUrl,
        signatureDate: params.signatureDate || releaseDate,
      },
      schedules: financials.schedules,
      payments: [],
    };

    // Update application to RELEASED
    setApplications(prev =>
      prev.map(a => (a.id === id ? { ...a, status: 'RELEASED', approvals: updatedApprovals, updatedAt: nowStr } : a))
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

    // Alert employee of posted deduction payment
    notify(
      'Payroll Deduction Credited to Loan',
      `₱${actualAmount.toLocaleString()} salary deduction has been posted for ${entry.employeeName} (${entry.payrollPeriod}). Ref: ${entry.payrollReference}.`,
      'INFO',
      undefined,
      entry.employeeId,
      'PAYMENT_CREDITED',
      'emp-loans',
      entry.loanAccountId,
      currentUser.name
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

  // 10. OPEC & CSR Projects Actions
  const addCSRProject = (projectData: Omit<CSRProject, 'id' | 'projectNumber'>) => {
    const projectNumber = `OA-CSR-${new Date().getFullYear()}-${String(csrProjects.length + 88).padStart(3, '0')}`;
    const title = projectData.projectTitle || projectData.name;
    const address = projectData.projectAddress || projectData.location;
    const newProj: CSRProject = {
      ...projectData,
      id: `proj-${Date.now()}`,
      projectNumber,
      name: title,
      projectTitle: title,
      location: address,
      projectAddress: address,
      projectBeneficiaries: projectData.projectBeneficiaries || '',
      photos: projectData.photos || [],
      videos: projectData.videos || [],
      videoLink: projectData.videoLink || '',
      beneficiaries: projectData.beneficiaries || [],
      events: projectData.events || [],
      donations: projectData.donations || [],
      expenses: projectData.expenses || [],
      createdAt: new Date().toISOString(),
    };
    setCsrProjects(prev => [newProj, ...prev]);
    logAction('CREATE_PROJECT', 'PROJECT', projectNumber, `Created OPEC Activity: "${title}" in ${address}.`);
    notify(`New OPEC Activity Added`, `"${title}" has been successfully added to OPEC activities.`, 'INFO');
  };

  const updateCSRProject = (project: CSRProject) => {
    const title = project.projectTitle || project.name;
    const address = project.projectAddress || project.location;
    const updatedProj: CSRProject = {
      ...project,
      name: title,
      projectTitle: title,
      location: address,
      projectAddress: address,
      updatedAt: new Date().toISOString(),
    };
    setCsrProjects(prev => prev.map(p => (p.id === project.id ? updatedProj : p)));
    logAction('UPDATE_PROJECT', 'PROJECT', project.projectNumber, `Updated OPEC Activity: "${title}".`);
    notify(`OPEC Activity Updated`, `"${title}" details have been updated.`, 'INFO');
  };

  const deleteCSRProject = (id: string) => {
    const target = csrProjects.find(p => p.id === id);
    setCsrProjects(prev => prev.filter(p => p.id !== id));
    if (target) {
      logAction('DELETE_PROJECT', 'PROJECT', target.projectNumber, `Deleted OPEC Activity: "${target.name || target.projectTitle}".`);
      notify(`OPEC Activity Deleted`, `"${target.name || target.projectTitle}" was deleted.`, 'ALERT');
    }
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

  // 10b. Announcements Actions
  const addAnnouncement = (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAnn: Announcement = {
      ...data,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    logAction('CREATE_ANNOUNCEMENT', 'ANNOUNCEMENT', newAnn.id, `Created announcement: "${newAnn.title}" [${newAnn.category}].`);
    notify(`Announcement Published: ${newAnn.title}`, newAnn.content.slice(0, 100) + '...', 'INFO');
  };

  const updateAnnouncement = (data: Announcement) => {
    setAnnouncements(prev => prev.map(a => (a.id === data.id ? { ...data, updatedAt: new Date().toISOString() } : a)));
    logAction('UPDATE_ANNOUNCEMENT', 'ANNOUNCEMENT', data.id, `Updated announcement: "${data.title}".`);
    notify(`Announcement Updated`, `"${data.title}" has been updated.`, 'INFO');
  };

  const deleteAnnouncement = (id: string) => {
    const target = announcements.find(a => a.id === id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    if (target) {
      logAction('DELETE_ANNOUNCEMENT', 'ANNOUNCEMENT', id, `Deleted announcement: "${target.title}".`);
      notify(`Announcement Removed`, `"${target.title}" was deleted.`, 'ALERT');
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

  const deleteEmployee = (id: string) => {
    const target = employees.find(e => e.id === id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    if (target) {
      logAction('DELETE_EMPLOYEE', 'EMPLOYEE', target.employeeNumber, `Deleted employee record for ${target.firstName} ${target.lastName}.`);
    }
  };

  const sendCoMakerRequest = (applicantName: string, coMakerId: string, amount: number) => {
    const coMaker = employees.find(e => e.id === coMakerId);
    const coMakerName = coMaker ? `${coMaker.firstName} ${coMaker.lastName}` : coMakerId;
    notify(
      'Co-Maker Signature Request',
      `${applicantName} requested your formal endorsement & signature as Co-Maker for an OPEC Loan of ₱${amount.toLocaleString()}.`,
      'ACTION_REQUIRED',
      undefined,
      coMakerId
    );
    logAction(
      'SUBMIT_LOAN',
      'LOAN_APPLICATION',
      coMakerId,
      `Dispatched co-maker digital signature request to ${coMakerName} (${coMakerId}) on behalf of ${applicantName}.`
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        registeredGmail,
        setRegisteredGmail,
        isGoogleConnected,
        googleUser,
        isGmailVerified,
        isGmailOtpModalOpen,
        gmailOtpModalProps,
        openGmailOtpModal,
        closeGmailOtpModal,
        refreshGmailState,
        isDarkMode,
        toggleDarkMode,
        setDarkMode,
        employees,
        regions,
        areas,
        branches,
        loanProducts,
        applications,
        activeLoans,
        payrollDeductions,
        csrProjects,
        announcements,
        auditLogs,
        notifications,
        currentUserNotifications,
        applyForLoan,
        approveByAreaManager,
        approveByOpecPresident,
        approveByRegionalManager,
        reviewApplication,
        voteApplication,
        rejectApplication,
        releaseLoanDisbursement,
        postPayrollDeduction,
        batchPostPayroll,
        recordManualPayment,
        updateLoanProduct,
        addCSRProject,
        updateCSRProject,
        deleteCSRProject,
        updateCSRProjectStatus,
        checkInAttendance,
        addProjectDonation,
        addProjectExpense,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        sendTestNotification,
        notify,
        latestToast,
        dismissToast,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        sendCoMakerRequest,
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
