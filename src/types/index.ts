export type UserRole =
  | 'SUPER_ADMIN'
  | 'OPEC_PRESIDENT'
  | 'TREASURER'
  | 'AUDITOR'
  | 'PAYROLL_MASTER'
  | 'OPEC_ADVISER'
  | 'REGIONAL_MANAGER'
  | 'AREA_MANAGER'
  | 'OPEC_OFFICER'
  | 'LOAN_OFFICER'
  | 'FINANCE_OFFICER'
  | 'PROJECT_COORDINATOR'
  | 'DOCUMENTATION_OFFICER'
  | 'MEMBER'
  | 'VIEWER';

export type EmploymentStatus =
  | 'PERMANENT'
  | 'PROBATIONARY'
  | 'RESIGNED'
  | 'RETIRED'
  | 'TERMINATED'
  | 'INACTIVE';

export type LoanStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'FOR_REVIEW'
  | 'CREDIT_COMMITTEE'
  | 'APPROVED'
  | 'REJECTED'
  | 'FOR_RELEASE'
  | 'RELEASED'
  | 'ACTIVE'
  | 'PARTIALLY_PAID'
  | 'FULLY_PAID'
  | 'CANCELLED'
  | 'DEFAULTED'
  | 'CLOSED';

export type ApprovalDecision = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PaymentStatus =
  | 'SCHEDULED'
  | 'POSTED'
  | 'PARTIAL'
  | 'MISSED'
  | 'WAIVED';

export type ReleaseMethod =
  | 'BANK_CHECK'
  | 'ML_KWARTA_PADALA'
  | 'BPI_ATM_DEPOSIT'
  | 'CASH_PICKUP';

export interface Region {
  id: string;
  name: string;
  code: string;
}

export interface Area {
  id: string;
  name: string;
  code: string;
  regionId: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  areaId: string;
  address?: string;
  contactNumber?: string;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  birthDate: string;
  dateHired: string;
  employmentStatus: EmploymentStatus;
  position: string;
  email: string;
  contactNumber: string;
  address: string;
  regionId: string;
  areaId: string;
  branchId: string;
  opecMembership: boolean;
  opecPosition?: string;
  monthlySalary: number;
  avatarUrl?: string;
}

export interface LoanProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  interestRate: number; // e.g. 1.5 for 1.5%
  interestMethod: 'FLAT_RATE' | 'REDUCING_BALANCE' | 'CUSTOM_OPEC_FORMULA';
  processingFee: number;
  requiredCoMakers: number;
  minServiceYearsCoMaker: number;
  minServiceYearsApplicant: number;
  active: boolean;
  applicableDeductions: 'PAYDAY_TWICE_MONTHLY' | 'MONTHLY';
}

export interface CoMakerSelection {
  employeeId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  notes?: string;
}

export interface LoanApprovalRecord {
  id: string;
  role: UserRole;
  title: string;
  approverName: string;
  approverId: string;
  decision: ApprovalDecision;
  comments?: string;
  timestamp?: string;
}

export interface LoanDocument {
  id: string;
  name: string;
  fileType: string;
  uploadedAt: string;
  fileSize: string;
  url?: string;
}

export interface LoanApplication {
  id: string;
  applicationNo: string;
  employeeId: string;
  loanProductId: string;
  purpose: string;
  requestedAmount: number;
  approvedAmount?: number;
  termMonths: number;
  interestRate: number;
  processingFee: number;
  releaseMethod: ReleaseMethod;
  releaseDetails?: string;
  status: LoanStatus;
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  coMakers: CoMakerSelection[];
  approvals: LoanApprovalRecord[];
  documents: LoanDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface LoanAmortizationSchedule {
  id: string;
  installmentNo: number;
  dueDate: string;
  cutoffPeriod: '15th' | '30th' | 'Monthly';
  principal: number;
  interest: number;
  fees: number;
  amount: number;
  balanceAfter: number;
  status: PaymentStatus;
  paidAmount?: number;
  paymentDate?: string;
  paymentRef?: string;
}

export interface LoanPayment {
  id: string;
  loanAccountId: string;
  paymentDate: string;
  amount: number;
  paymentType: 'PAYROLL_DEDUCTION' | 'DIRECT_CASH' | 'BANK_TRANSFER';
  referenceNo: string;
  payrollPeriod?: string;
  receivedBy: string;
  remarks?: string;
}

export interface LoanReleaseInfo {
  releasedAt: string;
  releasedBy: string;
  method: ReleaseMethod;
  grossAmount: number;
  processingFee: number;
  otherFees: number;
  netAmount: number;
  referenceNumber: string;
  disbursementAccount?: string;
}

export interface LoanAccount {
  id: string;
  loanNumber: string;
  applicationId: string;
  employeeId: string;
  loanProductId: string;
  principal: number;
  interestTotal: number;
  processingFee: number;
  totalPayable: number;
  balance: number;
  amountPaid: number;
  releaseDate: string;
  maturityDate: string;
  status: LoanStatus;
  releaseInfo: LoanReleaseInfo;
  schedules: LoanAmortizationSchedule[];
  payments: LoanPayment[];
}

export interface PayrollDeductionEntry {
  id: string;
  loanAccountId: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  branchName: string;
  payrollPeriod: string; // e.g. "2026-10-15"
  scheduledAmount: number;
  deductedAmount: number;
  difference: number;
  status: PaymentStatus;
  payrollReference: string;
  postedAt?: string;
  postedBy?: string;
  remarks?: string;
}

export type ProjectStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'REVIEW'
  | 'APPROVED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'ACCOMPLISHMENT_REPORT'
  | 'CLOSED';

export type BeneficiaryType =
  | 'INDIVIDUAL'
  | 'FAMILY'
  | 'BARANGAY'
  | 'SCHOOL'
  | 'LGU'
  | 'COMMUNITY'
  | 'ORGANIZATION';

export interface ProjectBeneficiary {
  id: string;
  name: string;
  type: BeneficiaryType;
  barangay: string;
  municipality: string;
  province: string;
  contactPerson: string;
  estimatedBeneficiaries: number;
  actualBeneficiaries?: number;
  description: string;
}

export interface ProjectEvent {
  id: string;
  projectId: string;
  eventName: string;
  date: string;
  location: string;
  coordinatorName: string;
  expectedParticipants: number;
  actualParticipants: number;
  status: 'SCHEDULED' | 'ONGOING' | 'CONCLUDED';
  description?: string;
}

export interface EventAttendance {
  id: string;
  eventId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  branchName: string;
  timeIn: string;
  timeOut?: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  checkedInBy?: string;
}

export interface ProjectDonation {
  id: string;
  donationNumber: string;
  projectId: string;
  donorName: string;
  donationType: 'CASH' | 'FOOD' | 'CLOTHING' | 'EQUIPMENT' | 'SUPPLIES' | 'SERVICES' | 'OTHER';
  quantity?: string;
  estimatedValue: number;
  dateReceived: string;
  receivedBy: string;
  remarks?: string;
}

export interface ProjectExpense {
  id: string;
  projectId: string;
  category: 'FOOD' | 'TRANSPORTATION' | 'SUPPLIES' | 'EQUIPMENT' | 'VENUE' | 'PRINTING' | 'LOGISTICS' | 'OTHER';
  amount: number;
  date: string;
  payee: string;
  receiptNumber: string;
  approvedBy: string;
  description: string;
}

export interface CSRProject {
  id: string;
  projectNumber: string;
  name: string;
  category: 'EDUCATION' | 'CALAMITY_RELIEF' | 'HEALTH_NUTRITION' | 'LIVELIHOOD' | 'ENVIRONMENT_TREE_PLANTING' | 'COMMUNITY_DEVELOPMENT';
  description: string;
  objective: string;
  location: string;
  startDate: string;
  endDate: string;
  budget: number;
  spentAmount: number;
  status: ProjectStatus;
  projectLeader: string;
  projectLeaderId: string;
  beneficiaries: ProjectBeneficiary[];
  events: ProjectEvent[];
  donations: ProjectDonation[];
  expenses: ProjectExpense[];
  accomplishmentSummary?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'LOAN_APPLICATION' | 'LOAN_ACCOUNT' | 'PAYMENT' | 'PAYROLL' | 'EMPLOYEE' | 'PROJECT' | 'POLICY' | 'SYSTEM';
  entityId: string;
  details: string;
  changes?: { field: string; oldVal?: string; newVal?: string }[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'INFO' | 'ACTION_REQUIRED' | 'APPROVAL' | 'PAYMENT' | 'ALERT';
  targetRole?: UserRole[];
  targetEmployeeId?: string;
  linkAction?: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  branchName?: string;
}
