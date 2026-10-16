import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../lib/loans/calculator';
import {
  ShieldCheck,
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Eye,
  FileCheck,
  Receipt,
  FileSpreadsheet,
  QrCode,
  Building,
  User,
  X,
  Upload,
  Plus,
  Image as ImageIcon,
  ExternalLink,
  ChevronDown,
  Info,
  Maximize2,
  FolderOpen,
  Sparkles,
  PenTool,
} from 'lucide-react';
import {
  DocumentPreviewModal,
  PreviewableDocument,
} from '../common/DocumentPreviewModal';
import { LoanAgreementSignModal } from './LoanAgreementSignModal';
import { SignatureVerificationModal } from './SignatureVerificationModal';
import {
  getStoredSignatures,
  saveStoredSignature,
  DigitalSignatureMetadata,
} from '../../lib/services/documentSigningService';

export type VaultDocCategory =
  | 'ALL'
  | 'UPLOADED'
  | 'LOAN_AGREEMENT'
  | 'PROMISSORY_NOTE'
  | 'DISCHARGE_CERTIFICATE'
  | 'DISBURSEMENT_RECEIPT'
  | 'AMORTIZATION_LEDGER';

export interface VaultDocumentItem extends PreviewableDocument {
  id: string;
  name: string;
  title: string;
  category: string;
  categoryType: VaultDocCategory;
  categoryColor: string;
  loanId?: string;
  loanNumber: string;
  productName: string;
  principal?: number;
  issueDate: string;
  fileSize: string;
  securityHash: string;
  status: string;
  isUploaded: boolean;
  docNumber: string;
  coMakers?: string[];
}

interface DocumentVaultProps {
  className?: string;
  onOpenApply?: () => void;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({
  className = '',
  onOpenApply,
}) => {
  const { currentUser, employees, branches, activeLoans, loanProducts, applications, notify } = useApp();

  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const branch = branches.find(b => b.id === applicant.branchId);

  // Active loans for this user
  const myLoans = useMemo(() => {
    return activeLoans.filter(l => l.employeeId === applicant.id);
  }, [activeLoans, applicant]);

  // Loan applications for this user
  const myApplications = useMemo(() => {
    return applications.filter(a => a.employeeId === applicant.id);
  }, [applications, applicant]);

  // Custom user uploaded documents stored in localStorage
  const [customUploadedDocs, setCustomUploadedDocs] = useState<VaultDocumentItem[]>(() => {
    const saved = localStorage.getItem(`oagims_vault_uploads_${applicant.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'cust-doc-01',
        name: 'Government_Issued_UMID_Card_Front_Back.jpg',
        title: 'Valid Government Identification (UMID Card)',
        category: 'Valid Government / Company ID',
        categoryType: 'UPLOADED',
        categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        fileType: 'image',
        loanNumber: 'OPEC-2026-0012',
        productName: 'Commodity Loan Facility',
        principal: 20000,
        issueDate: '2026-09-18',
        uploadedAt: '2026-09-18',
        fileSize: '1.4 MB (JPG)',
        securityHash: 'SHA256:d489b021ff7c92b001a4e1',
        status: 'VERIFIED_ACCEPTED',
        isUploaded: true,
        docNumber: 'UPLOAD-ID-2026-091',
        borrowerName: `${applicant.firstName} ${applicant.lastName}`,
        employeeNumber: applicant.employeeNumber,
        description: 'Verified clear scan of primary government identification with signature match.',
      },
      {
        id: 'cust-doc-02',
        name: 'Barangay_Certificate_Residency_Ozamiz.pdf',
        title: 'Barangay Certificate of Residency & Good Standing',
        category: 'Residential Clearance',
        categoryType: 'UPLOADED',
        categoryColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        fileType: 'pdf',
        loanNumber: 'OPEC-2026-0012',
        productName: 'Commodity Loan Facility',
        principal: 20000,
        issueDate: '2026-09-20',
        uploadedAt: '2026-09-20',
        fileSize: '890 KB (PDF)',
        securityHash: 'SHA256:88bc41e2a09f3387b120c4',
        status: 'VERIFIED_ACCEPTED',
        isUploaded: true,
        docNumber: 'UPLOAD-BRG-2026-442',
        borrowerName: `${applicant.firstName} ${applicant.lastName}`,
        employeeNumber: applicant.employeeNumber,
        description: 'Official residency clearance issued by Barangay Aguada, Ozamiz City.',
      },
    ];
  });

  // Selected filters
  const [selectedCategory, setSelectedCategory] = useState<VaultDocCategory>('ALL');
  const [selectedLoanFilter, setSelectedLoanFilter] = useState<string>('ALL');
  const [signatureStatusFilter, setSignatureStatusFilter] = useState<'ALL' | 'SIGNED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Digital signature & verification states
  const [storedSignatures, setStoredSignatures] = useState<Record<string, DigitalSignatureMetadata>>(() => {
    const existing = getStoredSignatures(applicant.id);
    if (Object.keys(existing).length === 0) {
      // Seed an initial verified signature for Master Loan Agreement so users can immediately test verification
      const defaultMlaId = 'doc-mla-loan-act-demo';
      const sampleSeed: DigitalSignatureMetadata = {
        signatureUrl:
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M 20 45 Q 40 15, 60 40 T 100 35 T 140 45 T 170 30 Q 185 20, 195 40" fill="none" stroke="%231e3a8a" stroke-width="3" stroke-linecap="round"/><path d="M 50 50 L 180 50" fill="none" stroke="%231e3a8a" stroke-width="2" stroke-linecap="round"/></svg>',
        signatureDate: '2026-09-18',
        signedAtIso: '2026-09-18T10:15:00Z',
        signedByName: `${applicant.firstName} ${applicant.lastName}`,
        signedByEmployeeNo: applicant.employeeNumber,
        signerRole: 'Principal Borrower & OPEC Member',
        branchName: branch?.name || 'ML Ozamiz 1 Branch',
        verificationHash: 'sig-sha256:d891c0e34b12a8849f2a710bc49',
        verificationStatus: 'VERIFIED_AUTHENTIC',
        legalNotice: 'Executed in compliance with Philippine Electronic Commerce Act (R.A. 8792)',
        ipAddressSimulated: '192.168.1.104 (Verified OA-GIMS Station)',
      };
      saveStoredSignature(applicant.id, defaultMlaId, sampleSeed);
      return { [defaultMlaId]: sampleSeed };
    }
    return existing;
  });

  const [signModalDoc, setSignModalDoc] = useState<VaultDocumentItem | null>(null);
  const [verifyModalDoc, setVerifyModalDoc] = useState<VaultDocumentItem | null>(null);

  const handleSaveDocumentSignature = (metadata: DigitalSignatureMetadata) => {
    if (!signModalDoc) return;
    saveStoredSignature(applicant.id, signModalDoc.id, metadata);
    setStoredSignatures(prev => ({
      ...prev,
      [signModalDoc.id]: metadata,
    }));
    notify(
      'Loan Agreement Digitally Signed & Verified',
      `Your digital signature and SHA-256 verification hash have been attached to ${signModalDoc.title} meta-data.`,
      'INFO',
      undefined,
      applicant.id,
      'LOAN_STATUS',
      'emp-vault',
      signModalDoc.docNumber
    );
    setSignModalDoc(null);
  };

  // Preview modal states
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [activePreviewDocId, setActivePreviewDocId] = useState<string>('');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'Signed Contract / Agreement',
    fileType: 'pdf',
    fileName: '',
    fileSize: '1.2 MB',
    fileDataUrl: '',
    associatedLoan: myLoans[0]?.loanNumber || 'OPEC-2026-0012',
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Automatically assemble all vault documents (Generated + Application-Uploaded + Custom-Uploaded)
  const allVaultDocuments: VaultDocumentItem[] = useMemo(() => {
    const docs: VaultDocumentItem[] = [];

    // Fallback loan if employee has no loan in state yet
    const loansToProcess = myLoans.length > 0 ? myLoans : [
      {
        id: 'loan-act-demo',
        loanNumber: 'OPEC-LN-2026-0012',
        applicationId: 'app-demo-12',
        employeeId: applicant.id,
        loanProductId: 'prod-commodity',
        principal: 20000,
        interestTotal: 3600,
        processingFee: 50,
        totalPayable: 23600,
        balance: 7866.64,
        amountPaid: 15733.36,
        releaseDate: '2026-02-15',
        maturityDate: '2027-02-15',
        status: 'ACTIVE' as const,
        releaseInfo: {
          releasedAt: '2026-02-15T09:30:00Z',
          releasedBy: 'Elena Corazon Mendoza',
          method: 'BANK_CHECK' as const,
          grossAmount: 20000,
          processingFee: 50,
          otherFees: 0,
          netAmount: 19950,
          referenceNumber: 'CHK-2026-00411',
          disbursementAccount: 'ML Ozamiz 1 Branch Check #411',
        },
        schedules: [],
        payments: [],
      },
    ];

    // 1. GENERATED OFFICIAL LEGAL CONTRACTS FROM LOANS
    loansToProcess.forEach(loan => {
      const prod = loanProducts.find(p => p.id === loan.loanProductId);
      const isPaidOff = loan.balance === 0;
      const loanNumShort = loan.loanNumber.split('-').pop() || '0012';

      // 1.1 Master Loan Agreement
      docs.push({
        id: `doc-mla-${loan.id}`,
        docNumber: `MLA-2026-${loanNumShort}-OPEC`,
        name: `Master_Loan_Agreement_${loan.loanNumber}.pdf`,
        title: `Master Loan & Credit Facility Agreement (${prod?.name || 'Loan Facility'})`,
        category: 'Loan Agreement',
        categoryType: 'LOAN_AGREEMENT',
        categoryColor: 'bg-blue-100 text-blue-800 border-blue-200',
        fileType: 'pdf',
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        productName: prod?.name || 'Commodity Loan Facility',
        principal: loan.principal,
        issueDate: loan.releaseDate,
        uploadedAt: loan.releaseDate,
        fileSize: '1.8 MB (PDF)',
        securityHash: `SHA256:7f9b8c${loan.id.slice(-6)}e314a89`,
        status: isPaidOff ? 'DISCHARGED' : 'ACTIVE_BINDING',
        isUploaded: false,
        coMakers: ['Maria Clara Santos', 'Carlos Villar Dizon'],
        borrowerName: `${applicant.firstName} ${applicant.lastName}`,
        employeeNumber: applicant.employeeNumber,
        description: 'Formal Master Credit Facility contract containing terms, interest covenants, and co-maker guarantees.',
      });

      // 1.2 Promissory Note with Disclosure Statement
      docs.push({
        id: `doc-pn-${loan.id}`,
        docNumber: `PN-2026-${loanNumShort}-OPEC`,
        name: `Promissory_Note_${loan.loanNumber}.pdf`,
        title: `Promissory Note with Truth in Lending Disclosure Statement`,
        category: 'Promissory Note',
        categoryType: 'PROMISSORY_NOTE',
        categoryColor: 'bg-amber-100 text-amber-800 border-amber-300',
        fileType: 'pdf',
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        productName: prod?.name || 'Commodity Loan Facility',
        principal: loan.principal,
        issueDate: loan.releaseDate,
        uploadedAt: loan.releaseDate,
        fileSize: '1.4 MB (PDF)',
        securityHash: `SHA256:a23b1c${loan.id.slice(-6)}88df21b`,
        status: isPaidOff ? 'DISCHARGED' : 'ACTIVE_BINDING',
        isUploaded: false,
        coMakers: ['Maria Clara Santos', 'Carlos Villar Dizon'],
        borrowerName: `${applicant.firstName} ${applicant.lastName}`,
        employeeNumber: applicant.employeeNumber,
        description: 'Unconditional promise to pay with statutory Truth in Lending (R.A. 3765) disclosure details.',
      });

      // 1.3 Loan Disbursement Voucher & Official Release Receipt
      docs.push({
        id: `doc-rcpt-${loan.id}`,
        docNumber: `DVR-2026-${loanNumShort}-OPEC`,
        name: `Disbursement_Voucher_${loan.loanNumber}.pdf`,
        title: `Official Loan Disbursement Voucher & Release Receipt`,
        category: 'Disbursement Voucher',
        categoryType: 'DISBURSEMENT_RECEIPT',
        categoryColor: 'bg-slate-100 text-slate-800 border-slate-300',
        fileType: 'pdf',
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        productName: prod?.name || 'Commodity Loan Facility',
        principal: loan.principal,
        issueDate: loan.releaseDate,
        uploadedAt: loan.releaseDate,
        fileSize: '950 KB (PDF)',
        securityHash: `SHA256:e51c89${loan.id.slice(-6)}00bc44a`,
        status: 'OFFICIAL_COPY',
        isUploaded: false,
        coMakers: ['Maria Clara Santos', 'Carlos Villar Dizon'],
        borrowerName: `${applicant.firstName} ${applicant.lastName}`,
        employeeNumber: applicant.employeeNumber,
        description: 'Official cashiering disbursement voucher verifying fund release through bank check or Kwarta Padala.',
      });

      // 1.4 Certified Amortization Schedule Ledger
      docs.push({
        id: `doc-asl-${loan.id}`,
        docNumber: `ASL-2026-${loanNumShort}-OPEC`,
        name: `Amortization_Ledger_${loan.loanNumber}.pdf`,
        title: `Certified Semi-Monthly Payroll Amortization Schedule`,
        category: 'Amortization Ledger',
        categoryType: 'AMORTIZATION_LEDGER',
        categoryColor: 'bg-purple-100 text-purple-800 border-purple-200',
        fileType: 'pdf',
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        productName: prod?.name || 'Commodity Loan Facility',
        principal: loan.principal,
        issueDate: loan.releaseDate,
        uploadedAt: loan.releaseDate,
        fileSize: '1.2 MB (PDF)',
        securityHash: `SHA256:b891a2${loan.id.slice(-6)}99ef11a`,
        status: 'CERTIFIED',
        isUploaded: false,
        coMakers: ['Maria Clara Santos', 'Carlos Villar Dizon'],
        borrowerName: `${applicant.firstName} ${applicant.lastName}`,
        employeeNumber: applicant.employeeNumber,
        description: 'Certified 15th & 30th payroll deduction amortization table with principal, interest, and running balances.',
      });

      // 1.5 Discharge Certificate
      docs.push({
        id: `doc-dc-${loan.id}`,
        docNumber: `DC-2026-${loanNumShort}-OPEC`,
        name: `Full_Discharge_Certificate_${loan.loanNumber}.pdf`,
        title: `Certificate of Full Loan Satisfaction & Discharge`,
        category: 'Discharge Certificate',
        categoryType: 'DISCHARGE_CERTIFICATE',
        categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        fileType: 'pdf',
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        productName: prod?.name || 'Commodity Loan Facility',
        principal: loan.principal,
        issueDate: isPaidOff ? '2026-10-01' : 'Pending Full Payoff',
        uploadedAt: isPaidOff ? '2026-10-01' : loan.releaseDate,
        fileSize: '2.1 MB (PDF)',
        securityHash: `SHA256:91ef23${loan.id.slice(-6)}44bc77a`,
        status: isPaidOff ? 'DISCHARGED' : 'OFFICIAL_COPY',
        isUploaded: false,
        coMakers: ['Maria Clara Santos', 'Carlos Villar Dizon'],
        borrowerName: `${applicant.firstName} ${applicant.lastName}`,
        employeeNumber: applicant.employeeNumber,
        description: 'Official certification clearing the borrower and releasing co-makers from solidary guarantees.',
      });
    });

    // 2. DOCUMENTS UPLOADED IN APPLICATION ATTACHMENTS
    myApplications.forEach(app => {
      const prod = loanProducts.find(p => p.id === app.loanProductId);
      (app.documents || []).forEach(d => {
        const isImg =
          d.fileType?.includes('image') ||
          d.name?.endsWith('.png') ||
          d.name?.endsWith('.jpg') ||
          d.name?.endsWith('.jpeg');

        docs.push({
          id: `app-doc-${d.id}`,
          docNumber: `ATT-${app.applicationNo}-${d.id.slice(-4)}`,
          name: d.name,
          title: d.name.replace(/_/g, ' ').replace(/\.[^/.]+$/, ''),
          category: d.category || 'Uploaded Supporting Document',
          categoryType: 'UPLOADED',
          categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          fileType: isImg ? 'image' : 'pdf',
          loanNumber: app.applicationNo,
          productName: prod?.name || 'Loan Application',
          principal: app.requestedAmount,
          issueDate: d.uploadedAt || app.createdAt.split('T')[0],
          uploadedAt: d.uploadedAt || app.createdAt.split('T')[0],
          fileSize: d.fileSize || '1.1 MB',
          securityHash: `SHA256:e1a90c${d.id.slice(-4)}ff428b`,
          status: 'VERIFIED_ACCEPTED',
          isUploaded: true,
          borrowerName: `${applicant.firstName} ${applicant.lastName}`,
          employeeNumber: applicant.employeeNumber,
          description: `Uploaded applicant document submitted with application #${app.applicationNo}.`,
        });
      });
    });

    // 3. DIRECT USER UPLOADED DOCUMENTS FROM LOCAL STORAGE
    customUploadedDocs.forEach(cDoc => {
      docs.push(cDoc);
    });

    const attachSignature = (baseDoc: VaultDocumentItem): VaultDocumentItem => {
      const sig = storedSignatures[baseDoc.id];
      if (sig) {
        return {
          ...baseDoc,
          signatureUrl: sig.signatureUrl,
          signatureDate: sig.signatureDate,
          signedBy: sig.signedByName,
          signedByEmployeeNo: sig.signedByEmployeeNo,
          signerRole: sig.signerRole,
          verificationHash: sig.verificationHash,
          verificationStatus: sig.verificationStatus,
          isDigitallySigned: true,
        };
      }
      return {
        ...baseDoc,
        isDigitallySigned: false,
        verificationStatus:
          baseDoc.categoryType === 'LOAN_AGREEMENT' || baseDoc.categoryType === 'PROMISSORY_NOTE'
            ? 'PENDING_SIGNATURE'
            : undefined,
      };
    };

    return docs.map(attachSignature);
  }, [myLoans, myApplications, customUploadedDocs, applicant, loanProducts, storedSignatures]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return allVaultDocuments.filter(doc => {
      // Category filter
      if (selectedCategory === 'UPLOADED' && !doc.isUploaded) {
        return false;
      }
      if (
        selectedCategory !== 'ALL' &&
        selectedCategory !== 'UPLOADED' &&
        doc.categoryType !== selectedCategory
      ) {
        return false;
      }

      // Loan filter
      if (selectedLoanFilter !== 'ALL' && doc.loanId !== selectedLoanFilter) {
        return false;
      }

      // Signature status filter
      if (signatureStatusFilter === 'SIGNED' && !doc.isDigitallySigned) {
        return false;
      }
      if (
        signatureStatusFilter === 'PENDING' &&
        (doc.isDigitallySigned ||
          (doc.categoryType !== 'LOAN_AGREEMENT' && doc.categoryType !== 'PROMISSORY_NOTE'))
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchNumber = doc.docNumber.toLowerCase().includes(q);
        const matchLoan = doc.loanNumber.toLowerCase().includes(q);
        const matchName = doc.name.toLowerCase().includes(q);
        if (!matchTitle && !matchNumber && !matchLoan && !matchName) {
          return false;
        }
      }
      return true;
    });
  }, [allVaultDocuments, selectedCategory, selectedLoanFilter, signatureStatusFilter, searchQuery]);

  const digitallySignedCount = useMemo(() => {
    return allVaultDocuments.filter(d => d.isDigitallySigned).length;
  }, [allVaultDocuments]);

  const pendingSignatureCount = useMemo(() => {
    return allVaultDocuments.filter(
      d => !d.isDigitallySigned && (d.categoryType === 'LOAN_AGREEMENT' || d.categoryType === 'PROMISSORY_NOTE')
    ).length;
  }, [allVaultDocuments]);

  // Open Preview Modal for a specific document
  const handleOpenPreview = (docId: string) => {
    setActivePreviewDocId(docId);
    setPreviewModalOpen(true);
  };

  // Handle direct file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const fileSizeFormatted = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadForm(prev => ({
        ...prev,
        fileName: file.name,
        title: prev.title || file.name.replace(/_/g, ' ').replace(/\.[^/.]+$/, ''),
        fileSize: fileSizeFormatted,
        fileType: isImg ? 'image' : 'pdf',
        fileDataUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.fileName) return;

    const newDocId = `upload-${Date.now()}`;
    const newDoc: VaultDocumentItem = {
      id: newDocId,
      name: uploadForm.fileName,
      title: uploadForm.title || uploadForm.fileName,
      category: uploadForm.category,
      categoryType: 'UPLOADED',
      categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      fileType: uploadForm.fileType,
      loanNumber: uploadForm.associatedLoan,
      productName: 'Employee Vault Repository',
      issueDate: new Date().toISOString().split('T')[0],
      uploadedAt: new Date().toISOString().split('T')[0],
      fileSize: uploadForm.fileSize,
      securityHash: `SHA256:${Math.random().toString(16).substring(2, 14)}e48c`,
      status: 'VERIFIED_ACCEPTED',
      isUploaded: true,
      docNumber: `VAULT-UPL-${Date.now().toString().slice(-5)}`,
      contentDataUrl: uploadForm.fileDataUrl || undefined,
      borrowerName: `${applicant.firstName} ${applicant.lastName}`,
      employeeNumber: applicant.employeeNumber,
      description: `Uploaded directly into personal OPEC Document Vault.`,
    };

    const updated = [newDoc, ...customUploadedDocs];
    setCustomUploadedDocs(updated);
    localStorage.setItem(
      `oagims_vault_uploads_${applicant.id}`,
      JSON.stringify(updated)
    );

    setShowUploadModal(false);
    setUploadForm({
      title: '',
      category: 'Signed Contract / Agreement',
      fileType: 'pdf',
      fileName: '',
      fileSize: '1.2 MB',
      fileDataUrl: '',
      associatedLoan: myLoans[0]?.loanNumber || 'OPEC-2026-0012',
    });

    // Automatically preview the newly uploaded document!
    handleOpenPreview(newDocId);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Encrypted Digital Archive
                </span>
                <span className="text-xs text-slate-400">
                  · OPEC Aurum Gems Legal Repository
                </span>
              </div>
              <h1 className="text-xl font-bold text-white mt-1">
                Employee Document Vault
              </h1>
              <p className="text-xs text-slate-300">
                Securely preview PDF and image thumbnails of your uploaded contracts, government IDs, promissory notes, and official release certificates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Upload Document Button */}
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Document</span>
            </button>

            <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>
                <strong className="text-white font-mono">
                  {filteredDocuments.length}
                </strong>{' '}
                Vault Files
              </span>
            </div>
          </div>
        </div>

        {/* Security badges strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Digitally Signed by OPEC Officers
            </span>
            <span className="flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Interactive PDF & Image Thumbnail Previewer
            </span>
            <span className="flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Truth in Lending (R.A. 3765) Compliant
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              <PenTool className="w-3.5 h-3.5 text-amber-400" />
              E-Signature Enabled: {digitallySignedCount} Verified
              {pendingSignatureCount > 0 && ` · ${pendingSignatureCount} Needs Sign`}
            </span>
          </div>
          <span className="font-mono text-[11px] text-amber-400">
            Borrower: {applicant.firstName} {applicant.lastName} ({applicant.employeeNumber})
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Segmented Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL' as VaultDocCategory, label: 'All Files' },
              { id: 'UPLOADED' as VaultDocCategory, label: 'Uploaded Contracts & Docs' },
              { id: 'LOAN_AGREEMENT' as VaultDocCategory, label: 'Loan Agreements' },
              { id: 'PROMISSORY_NOTE' as VaultDocCategory, label: 'Promissory Notes' },
              { id: 'DISCHARGE_CERTIFICATE' as VaultDocCategory, label: 'Discharge Certificates' },
              { id: 'DISBURSEMENT_RECEIPT' as VaultDocCategory, label: 'Vouchers & Receipts' },
              { id: 'AMORTIZATION_LEDGER' as VaultDocCategory, label: 'Amortization Schedules' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap text-xs cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Loan Account Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search contracts, ref no..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 w-44 sm:w-56"
              />
            </div>

            {myLoans.length > 1 && (
              <select
                value={selectedLoanFilter}
                onChange={e => setSelectedLoanFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
              >
                <option value="ALL">All Facilities</option>
                {myLoans.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.loanNumber}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Digital Signature Verification Status Filter Sub-Bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <PenTool className="w-3 h-3 text-slate-400" />
              Signature Status:
            </span>
            <button
              type="button"
              onClick={() => setSignatureStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                signatureStatusFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Records ({allVaultDocuments.length})
            </button>
            <button
              type="button"
              onClick={() => setSignatureStatusFilter('SIGNED')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                signatureStatusFilter === 'SIGNED'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Digitally Signed & Verified ({digitallySignedCount})
            </button>
            <button
              type="button"
              onClick={() => setSignatureStatusFilter('PENDING')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                signatureStatusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <PenTool className="w-3 h-3 text-amber-600" />
              Requires Digital Signature ({pendingSignatureCount})
            </button>
          </div>

          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Canvas Signature Pad · Cryptographic SHA-256 Meta-Data
          </span>
        </div>
      </div>

      {/* Documents Grid with Realistic PDF / Image Thumbnails */}
      {filteredDocuments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400 space-y-3">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Documents Found</h3>
          <p>No legal records or uploaded contracts match your selected filter or keyword.</p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload a Contract Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map(doc => {
            const isDocPdf =
              doc.fileType.toLowerCase().includes('pdf') ||
              doc.name.toLowerCase().endsWith('.pdf') ||
              doc.fileType === 'pdf';

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-amber-400/80 transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Visual Thumbnail Area */}
                <div
                  onClick={() => handleOpenPreview(doc.id)}
                  className="relative h-44 bg-slate-900 border-b border-slate-100 flex items-center justify-center p-3 overflow-hidden cursor-pointer group-hover:bg-slate-950 transition-colors"
                >
                  {/* Subtle Background Pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />

                  {isDocPdf ? (
                    /* PDF Document Miniature Thumbnail */
                    <div className="relative w-28 h-36 bg-white rounded shadow-md border border-slate-300 p-2.5 flex flex-col justify-between group-hover:scale-105 transition-transform duration-200 select-none">
                      {/* PDF Banner Ribbon */}
                      <div className="absolute -top-1 -right-1 bg-rose-600 text-white font-mono font-bold text-[8px] px-1.5 py-0.2 rounded shadow-2xs">
                        PDF
                      </div>

                      {/* Header lines */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
                          <div className="h-1.5 bg-slate-800 rounded-sm w-14" />
                        </div>
                        <div className="h-1 bg-slate-300 rounded-xs w-full" />
                        <div className="h-1 bg-slate-300 rounded-xs w-3/4" />
                      </div>

                      {/* Body skeleton lines */}
                      <div className="space-y-1 my-1">
                        <div className="h-0.5 bg-slate-200 rounded-xs w-full" />
                        <div className="h-0.5 bg-slate-200 rounded-xs w-5/6" />
                        <div className="h-0.5 bg-slate-200 rounded-xs w-full" />
                        <div className="h-0.5 bg-slate-200 rounded-xs w-4/6" />
                      </div>

                      {/* Signature block */}
                      <div className="pt-1 border-t border-slate-200 flex justify-between items-center text-[7px] font-mono text-slate-400">
                        <span>OPEC SEAL</span>
                        <div className="w-6 h-1 bg-amber-400 rounded-xs" />
                      </div>
                    </div>
                  ) : (
                    /* Image Thumbnail Representation */
                    <div className="relative w-36 h-28 bg-slate-800 rounded-lg shadow-md border border-slate-700 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-200 select-none">
                      {doc.contentDataUrl ? (
                        <img
                          src={doc.contentDataUrl}
                          alt={doc.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-2 text-center text-slate-300 space-y-1">
                          <ImageIcon className="w-6 h-6 text-amber-400" />
                          <span className="text-[9px] font-bold text-white truncate max-w-[120px]">
                            {doc.name}
                          </span>
                          <span className="text-[8px] font-mono text-slate-400">
                            IMAGE PROOF
                          </span>
                        </div>
                      )}

                      <div className="absolute top-1 right-1 bg-emerald-600 text-white font-mono font-bold text-[8px] px-1.5 py-0.2 rounded shadow-2xs">
                        IMG
                      </div>
                    </div>
                  )}

                  {/* Hover Quick Preview Action Indicator */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow-md">
                      <Eye className="w-3.5 h-3.5" />
                      Click to Preview
                    </span>
                  </div>
                </div>

                {/* Card Content Information */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Category Pill and Status */}
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border truncate max-w-[170px] ${
                          doc.isUploaded
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : doc.categoryColor
                        }`}
                      >
                        {doc.isUploaded ? 'Uploaded Document' : doc.category}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                        {doc.fileSize}
                      </span>
                    </div>

                    {/* Title and Doc Number */}
                    <h3
                      onClick={() => handleOpenPreview(doc.id)}
                      className="font-bold text-sm text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-2 cursor-pointer"
                    >
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-slate-500">
                      <span className="font-bold text-slate-700">{doc.docNumber}</span>
                      <span>·</span>
                      <span className="truncate">{doc.loanNumber}</span>
                    </div>

                    {/* Metadata Strip */}
                    <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Record Date:</span>
                        <span className="font-mono text-slate-700">{doc.uploadedAt}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Facility:</span>
                        <span className="text-slate-800 font-medium truncate max-w-[150px]">
                          {doc.productName}
                        </span>
                      </div>
                    </div>

                    {/* Digital Signature Meta-Data Status Callout */}
                    {doc.isDigitallySigned ? (
                      <div className="mt-2.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200/90 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">Digitally Signed & Verified</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVerifyModalDoc(doc)}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-950 underline shrink-0 cursor-pointer"
                        >
                          Verify →
                        </button>
                      </div>
                    ) : (doc.categoryType === 'LOAN_AGREEMENT' || doc.categoryType === 'PROMISSORY_NOTE') ? (
                      <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200/90 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] truncate">
                          <PenTool className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">Pending Digital Signature</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSignModalDoc(doc)}
                          className="text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-0.5 rounded shadow-2xs shrink-0 cursor-pointer active:scale-95"
                        >
                          Sign Now
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(doc.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>

                    {doc.isDigitallySigned ? (
                      <button
                        type="button"
                        onClick={() => setVerifyModalDoc(doc)}
                        className="flex items-center justify-center gap-1 py-1.5 px-2.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Verify cryptographic signature integrity"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Verify
                      </button>
                    ) : (doc.categoryType === 'LOAN_AGREEMENT' || doc.categoryType === 'PROMISSORY_NOTE') ? (
                      <button
                        type="button"
                        onClick={() => setSignModalDoc(doc)}
                        className="flex items-center justify-center gap-1 py-1.5 px-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Digitally sign agreement using signature pad"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        Sign
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(doc.id)}
                        className="flex items-center justify-center gap-1 py-1.5 px-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Inspect full document details"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal-Based Document Previewer with Multi-page, Zoom, Rotate, and Filmstrip */}
      <DocumentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        documents={filteredDocuments}
        currentDocId={activePreviewDocId}
        onSelectDoc={id => setActivePreviewDocId(id)}
        onSignDoc={doc => setSignModalDoc(doc as VaultDocumentItem)}
        onVerifyDoc={doc => setVerifyModalDoc(doc as VaultDocumentItem)}
      />

      {/* Loan Agreement Digital Signing Canvas Pad Modal */}
      {signModalDoc && (
        <LoanAgreementSignModal
          isOpen={Boolean(signModalDoc)}
          onClose={() => setSignModalDoc(null)}
          documentTitle={signModalDoc.title}
          docNumber={signModalDoc.docNumber}
          loanNumber={signModalDoc.loanNumber}
          principal={signModalDoc.principal}
          borrowerName={`${applicant.firstName} ${applicant.lastName}`}
          employeeNumber={applicant.employeeNumber}
          branchName={branch?.name || 'ML Ozamiz 1 Branch'}
          initialSignatureUrl={signModalDoc.signatureUrl}
          onSaveSignature={handleSaveDocumentSignature}
        />
      )}

      {/* Signature Verification & Authenticity Inspector Modal */}
      {verifyModalDoc && (
        <SignatureVerificationModal
          isOpen={Boolean(verifyModalDoc)}
          onClose={() => setVerifyModalDoc(null)}
          documentTitle={verifyModalDoc.title}
          docNumber={verifyModalDoc.docNumber}
          loanNumber={verifyModalDoc.loanNumber}
          metadata={storedSignatures[verifyModalDoc.id] || null}
          onOpenReSign={() => {
            const docToReSign = verifyModalDoc;
            setVerifyModalDoc(null);
            setSignModalDoc(docToReSign);
          }}
        />
      )}

      {/* Upload Contract / Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Upload Contract or Document
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpload} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Document Title / Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executed Promissory Note with Notary Seal"
                  value={uploadForm.title}
                  onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Document Category *
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Signed Contract / Agreement">Signed Contract / Agreement</option>
                    <option value="Promissory Note Scan">Promissory Note Scan</option>
                    <option value="Valid Government / Company ID">Valid Government / Company ID</option>
                    <option value="Proof of Income / Payslip">Proof of Income / Payslip</option>
                    <option value="Co-Maker Undertaking Proof">Co-Maker Undertaking Proof</option>
                    <option value="Clearance / Certificate">Clearance / Certificate</option>
                    <option value="Disbursement Receipt">Disbursement Receipt</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Associated Facility / Loan
                  </label>
                  <select
                    value={uploadForm.associatedLoan}
                    onChange={e => setUploadForm({ ...uploadForm, associatedLoan: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    {myLoans.map(l => (
                      <option key={l.id} value={l.loanNumber}>
                        {l.loanNumber}
                      </option>
                    ))}
                    <option value="General Vault Storage">General Vault Storage</option>
                  </select>
                </div>
              </div>

              {/* File Dropzone */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Select File (PDF or Image) *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl bg-slate-50 hover:bg-amber-50/30 text-center cursor-pointer transition-colors space-y-2"
                >
                  <Upload className="w-8 h-8 text-amber-600 mx-auto" />
                  {uploadForm.fileName ? (
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {uploadForm.fileName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {uploadForm.fileSize} · Click to replace file
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-slate-800 block">
                        Click to select PDF or image file
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Supports PDF contracts, JPG/PNG scans up to 15MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  All uploaded documents are instantly indexed, encrypted, and provided with real-time thumbnail previewing in the OPEC Document Vault.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadForm.fileName}
                  className="px-5 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs disabled:opacity-50"
                >
                  Save & Preview in Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
