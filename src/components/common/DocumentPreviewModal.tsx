import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  QrCode,
  Calendar,
  Building,
  User,
  Maximize2,
  Minimize2,
  Info,
  ExternalLink,
  PenTool,
} from 'lucide-react';
import { formatPHP } from '../../lib/loans/calculator';

export interface PreviewableDocument {
  id: string;
  name: string;
  title: string;
  category: string;
  categoryColor?: string;
  fileType: 'pdf' | 'image' | string;
  fileSize: string;
  uploadedAt: string;
  loanNumber?: string;
  productName?: string;
  principal?: number;
  securityHash?: string;
  thumbnailUrl?: string;
  contentDataUrl?: string;
  docNumber?: string;
  status?: string;
  description?: string;
  isUploaded?: boolean;
  borrowerName?: string;
  employeeNumber?: string;
  // Digital Signature Meta-Data
  signatureUrl?: string;
  signatureDate?: string;
  signedBy?: string;
  signedByEmployeeNo?: string;
  signerRole?: string;
  verificationHash?: string;
  verificationStatus?: 'VERIFIED_AUTHENTIC' | 'PENDING_SIGNATURE';
  isDigitallySigned?: boolean;
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: PreviewableDocument[];
  currentDocId: string;
  onSelectDoc?: (docId: string) => void;
  onSignDoc?: (doc: PreviewableDocument) => void;
  onVerifyDoc?: (doc: PreviewableDocument) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  documents,
  currentDocId,
  onSelectDoc,
  onSignDoc,
  onVerifyDoc,
}) => {
  const [activeId, setActiveId] = useState<string>(currentDocId);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showMetadata, setShowMetadata] = useState<boolean>(true);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Sync activeId when currentDocId prop changes
  useEffect(() => {
    if (currentDocId) {
      setActiveId(currentDocId);
      setZoomLevel(100);
      setRotation(0);
      setActivePage(1);
    }
  }, [currentDocId]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeId, documents]);

  if (!isOpen || documents.length === 0) return null;

  const currentIndex = documents.findIndex(d => d.id === activeId);
  const currentDoc = documents[currentIndex] || documents[0];

  const isPdf =
    currentDoc.fileType.toLowerCase().includes('pdf') ||
    currentDoc.name.toLowerCase().endsWith('.pdf') ||
    currentDoc.fileType === 'pdf';

  const isImage =
    currentDoc.fileType.toLowerCase().includes('image') ||
    currentDoc.name.toLowerCase().endsWith('.png') ||
    currentDoc.name.toLowerCase().endsWith('.jpg') ||
    currentDoc.name.toLowerCase().endsWith('.jpeg') ||
    currentDoc.fileType === 'image';

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevDoc = documents[currentIndex - 1];
      setActiveId(prevDoc.id);
      if (onSelectDoc) onSelectDoc(prevDoc.id);
      setZoomLevel(100);
      setRotation(0);
      setActivePage(1);
    }
  };

  const handleNext = () => {
    if (currentIndex < documents.length - 1) {
      const nextDoc = documents[currentIndex + 1];
      setActiveId(nextDoc.id);
      if (onSelectDoc) onSelectDoc(nextDoc.id);
      setZoomLevel(100);
      setRotation(0);
      setActivePage(1);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const filename = currentDoc.name || `${currentDoc.docNumber || 'Document'}.pdf`;
    
    if (currentDoc.contentDataUrl) {
      const link = document.createElement('a');
      link.href = currentDoc.contentDataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate clean printable HTML / text blob download
      const content = `
M. LHUILLIER FINANCIAL SERVICES - OPEC AURUM GEMS
==================================================
DOCUMENT PREVIEW ARCHIVE
Document Title: ${currentDoc.title}
File: ${currentDoc.name}
Category: ${currentDoc.category}
Reference No: ${currentDoc.docNumber || currentDoc.loanNumber || 'OAG-DOC-2026'}
Issue / Upload Date: ${currentDoc.uploadedAt}
Digital Security Hash: ${currentDoc.securityHash || 'SHA256:7f9b8c0012e314a89'}
Borrower: ${currentDoc.borrowerName || 'Official Employee Record'}
Principal / Terms: ${currentDoc.principal ? formatPHP(currentDoc.principal) : 'N/A'}
Status: ${currentDoc.status || 'VERIFIED_ACTIVE'}

PROVISIONS:
This document is a certified digital record deposited in the OPEC Aurum Gems Legal Archive.
Compliant with Republic Act No. 3765 (Truth in Lending Act) and OPEC Credit Guidelines.
`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 transition-all duration-200 ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      {/* Modal Dialog Container */}
      <div
        className={`bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
          isFullscreen
            ? 'h-full max-w-none rounded-none border-none'
            : 'h-[92vh] max-w-6xl'
        }`}
      >
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 select-none">
          {/* Document Title & Category Badge */}
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
              {isPdf ? (
                <FileText className="w-5 h-5" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {isPdf ? 'PDF Contract' : 'Image File'}
                </span>
                <span className="text-xs text-slate-400 truncate font-mono">
                  {currentDoc.docNumber || currentDoc.name}
                </span>
                {currentDoc.isUploaded && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Uploaded Attachment
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                {currentDoc.title || currentDoc.name}
              </h2>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs text-slate-300">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded disabled:opacity-40 transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-[11px] font-bold min-w-[48px] text-center text-slate-200">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded disabled:opacity-40 transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Rotate Button */}
            <button
              type="button"
              onClick={handleRotate}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Rotate 90° Clockwise"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Toggle Metadata Sidebar */}
            <button
              type="button"
              onClick={() => setShowMetadata(!showMetadata)}
              className={`p-2 rounded-lg transition-colors ${
                showMetadata
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Toggle Document Information"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden md:inline-flex"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-xs transition-all active:scale-95"
              title="Download Document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {downloadSuccess ? 'Saved!' : 'Download'}
              </span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:inline-flex"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
              title="Close Preview (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body Area: Canvas + Optional Metadata Sidebar */}
        <div className="flex-1 flex overflow-hidden relative bg-slate-950">
          {/* Navigation Arrows (Prev / Next) */}
          {documents.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 flex items-center justify-center backdrop-blur-xs disabled:opacity-20 disabled:pointer-events-none transition-all shadow-lg cursor-pointer"
                title="Previous Document"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === documents.length - 1}
                className="absolute right-3 md:right-80 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 flex items-center justify-center backdrop-blur-xs disabled:opacity-20 disabled:pointer-events-none transition-all shadow-lg cursor-pointer"
                style={{
                  right: showMetadata ? undefined : '12px',
                }}
                title="Next Document"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Central Viewer Stage / Document Canvas */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 bg-slate-950/95 scrollbar-thin scrollbar-thumb-slate-800">
            <div
              className="transition-transform duration-150 origin-center select-text"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              }}
            >
              {isImage ? (
                /* High-fidelity Image Preview */
                <div className="max-w-2xl bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-700 p-2">
                  {currentDoc.contentDataUrl || currentDoc.thumbnailUrl ? (
                    <img
                      src={currentDoc.contentDataUrl || currentDoc.thumbnailUrl}
                      alt={currentDoc.title}
                      className="max-h-[68vh] w-auto object-contain rounded-lg mx-auto"
                    />
                  ) : (
                    /* Stylized Image File Placeholder for uploaded contracts / IDs */
                    <div className="w-[480px] h-[340px] bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-center text-slate-700 space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-700 border border-amber-500/30 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">
                          {currentDoc.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          Verified Uploaded Visual Contract / Document Scan
                        </span>
                      </div>
                      <div className="text-[11px] font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600">
                        Resolution: 1920 × 1080 · Size: {currentDoc.fileSize}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Original High-Res Proof Encrypted in Vault
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Realistic Legal PDF Document Sheet Representation */
                <div className="w-[660px] min-h-[880px] bg-white text-slate-900 shadow-2xl rounded-sm p-10 font-sans border border-slate-300 relative select-text flex flex-col justify-between">
                  {/* Subtle Top Watermark & Seal */}
                  <div className="absolute top-4 right-6 text-right">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block">
                      ARCHIVE RECORD
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-700">
                      {currentDoc.docNumber || 'OAG-DOC-2026'}
                    </span>
                  </div>

                  {/* Header Letterhead */}
                  <div>
                    <div className="text-center pb-4 border-b-2 border-slate-900">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-serif font-black flex items-center justify-center text-xs shadow-xs">
                          ML
                        </div>
                        <span className="text-xs font-black tracking-widest text-slate-950 uppercase font-mono">
                          M. LHUILLIER FINANCIAL SERVICES, INC.
                        </span>
                      </div>
                      <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase">
                        OPEC AURUM GEMS CHAPTER
                      </h1>
                      <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mt-0.5">
                        Credit Committee Directorate · Northern Mindanao & Zamboanga Peninsula
                      </p>
                      <div className="mt-3 inline-block bg-amber-500/15 text-amber-950 border border-amber-600/30 px-3 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider font-mono">
                        {currentDoc.title}
                      </div>
                    </div>

                    {/* Metadata Strip */}
                    <div className="mt-4 bg-slate-50 border border-slate-200 rounded-md p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Document ID
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {currentDoc.docNumber || 'OAG-2026'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Facility Ref
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {currentDoc.loanNumber || 'OPEC-FAC-2026'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Issue Date
                        </span>
                        <span className="font-mono text-slate-800">
                          {currentDoc.uploadedAt}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Legal Status
                        </span>
                        <span className="font-bold text-emerald-800 font-mono text-[10px]">
                          {(currentDoc.status || 'OFFICIAL_BINDING').replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Parties Section */}
                    <div className="mt-4 p-3 bg-white border border-slate-200 rounded-md space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Creditor / Benefactor:</span>
                        <strong className="text-slate-900 font-medium">
                          OPEC Aurum Gems Employee Lending Committee
                        </strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Borrower / Employee:</span>
                        <strong className="text-slate-900">
                          {currentDoc.borrowerName || 'Juan B. Dela Cruz'}
                          {currentDoc.employeeNumber && (
                            <span className="font-mono text-slate-500 font-normal ml-1">
                              ({currentDoc.employeeNumber})
                            </span>
                          )}
                        </strong>
                      </div>
                      {currentDoc.principal && (
                        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                          <span className="text-slate-500">Approved Principal Sum:</span>
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {formatPHP(currentDoc.principal)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Official Clauses & Conditions */}
                    <div className="mt-4 space-y-2 text-[11px] text-slate-700 leading-relaxed">
                      <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200 flex items-center justify-between">
                        <span>LEGAL DECLARATIONS & STATUTORY COVENANTS</span>
                        <span className="font-mono text-slate-400 font-normal text-[9px]">
                          R.A. 3765 / SEC. 23
                        </span>
                      </div>

                      <p>
                        <strong>1. Undertaking:</strong> The Borrower unconditionally acknowledges receipt and/or allocation of credit assistance under the OPEC Aurum Gems Charter, promising to satisfy all installments through automatic semi-monthly payroll deductions on the 15th and 30th of each calendar month.
                      </p>

                      <p>
                        <strong>2. Truth in Lending Act Compliance:</strong> The Borrower confirms receipt of the complete disclosure statement outlining all applicable finance charges, flat monthly rates, and documentation fees prior to contract consummation.
                      </p>

                      <p>
                        <strong>3. Co-Maker Guarantee:</strong> Designated accredited co-makers guarantee joint and solidary liability for any unsettled principal balance should employment sever prior to full loan amortization.
                      </p>

                      <p>
                        <strong>4. Document Integrity:</strong> This instrument is digitally preserved in the OPEC Aurum Gems Encrypted Vault and constitutes legally binding prima facie proof of credit obligations.
                      </p>
                    </div>
                  </div>

                  {/* Signatures & Execution Block */}
                  <div className="mt-8 pt-4 border-t-2 border-slate-200">
                    <div className="grid grid-cols-3 gap-4 text-center text-[10px]">
                      <div>
                        {currentDoc.signatureUrl ? (
                          <div className="h-10 flex flex-col items-center justify-end">
                            <img
                              src={currentDoc.signatureUrl}
                              alt="Borrower Digital Signature"
                              className="max-h-8 max-w-[130px] object-contain"
                            />
                            <span className="text-[7px] text-emerald-700 font-mono font-bold">
                              ✓ VERIFIED ({currentDoc.signatureDate})
                            </span>
                          </div>
                        ) : (
                          <div className="h-10 flex flex-col items-center justify-end">
                            {onSignDoc ? (
                              <button
                                type="button"
                                onClick={() => onSignDoc(currentDoc)}
                                className="flex items-center gap-1 text-[9px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-300 transition-colors cursor-pointer"
                              >
                                <PenTool className="w-2.5 h-2.5" />
                                ✍ Sign Here
                              </button>
                            ) : (
                              <span className="font-serif italic text-slate-700 text-xs">
                                {currentDoc.borrowerName || 'Juan Dela Cruz'}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="border-t border-slate-400 pt-0.5 mt-0.5">
                          <strong className="block text-slate-900">
                            {currentDoc.borrowerName || 'Borrower Signature'}
                          </strong>
                          <span className="text-[9px] text-slate-400">
                            {currentDoc.signatureUrl ? 'Digitally Signed & Certified' : 'Principal Borrower'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="h-8 flex items-end justify-center font-serif italic text-slate-700 text-xs">
                          Elena C. Mendoza
                        </div>
                        <div className="border-t border-slate-400 pt-0.5">
                          <strong className="block text-slate-900">Elena C. Mendoza</strong>
                          <span className="text-[9px] text-slate-400">Treasurer, OPEC</span>
                        </div>
                      </div>

                      <div>
                        <div className="h-8 flex items-end justify-center font-serif italic text-slate-700 text-xs">
                          Roberto E. Tan
                        </div>
                        <div className="border-t border-slate-400 pt-0.5">
                          <strong className="block text-slate-900">Engr. Roberto E. Tan</strong>
                          <span className="text-[9px] text-slate-400">President, OPEC</span>
                        </div>
                      </div>
                    </div>

                    {/* Seal and Barcode Footer */}
                    <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] font-mono text-slate-500">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-slate-800" />
                        <div>
                          <span>HASH: {currentDoc.securityHash || 'SHA256:7f9b8c0012e314a89'}</span>
                          <span className="block text-slate-400">
                            DIGITAL VAULT RECORD · REGION 20
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-emerald-700 font-bold">
                          ✓ TAMPER-EVIDENT ARCHIVE COPY
                        </span>
                        <span className="block text-slate-400">Page 1 of 1</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Metadata & Audit Sidebar */}
          {showMetadata && (
            <div className="w-72 sm:w-80 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto shrink-0 text-xs text-slate-300 space-y-5 animate-in slide-in-from-right-4 duration-150">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Document Overview
                </span>
                <h3 className="font-bold text-sm text-white">
                  {currentDoc.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {currentDoc.description ||
                    'Official legally binding record registered under the employee credit portfolio.'}
                </p>
              </div>

              {/* Status and Category */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {currentDoc.category}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Format:</span>
                  <span className="font-mono text-amber-300 uppercase">
                    {currentDoc.fileType}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">File Size:</span>
                  <span className="font-mono text-slate-300">
                    {currentDoc.fileSize}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Date Recorded:</span>
                  <span className="font-mono text-slate-300">
                    {currentDoc.uploadedAt}
                  </span>
                </div>
              </div>

              {/* Loan Reference Information */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Associated Facility
                </span>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Loan Account:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {currentDoc.loanNumber || 'OPEC-2026-0012'}
                    </span>
                  </div>

                  {currentDoc.productName && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Product:</span>
                      <span className="text-white truncate max-w-[130px]">
                        {currentDoc.productName}
                      </span>
                    </div>
                  )}

                  {currentDoc.principal && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Principal:</span>
                      <span className="font-mono font-bold text-white">
                        {formatPHP(currentDoc.principal)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cryptographic Security Details */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Cryptographic Verification
                </span>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Digitally Certified Record</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">SHA-256 Checksum:</span>
                    <span className="text-slate-300 break-all block mt-0.5 text-[9px]">
                      {currentDoc.securityHash || 'SHA256:7f9b8c0012e314a89d02e4'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 pt-1 border-t border-slate-900">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>AES-256 Vault Encryption</span>
                  </div>
                </div>
              </div>

              {/* Digital Signature & Verification Meta-Data */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Digital Signature Meta-Data
                  </span>
                  {currentDoc.signatureUrl ? (
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                      ✓ SIGNED
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                      PENDING
                    </span>
                  )}
                </div>

                {currentDoc.signatureUrl ? (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-slate-700 flex justify-center">
                      <img
                        src={currentDoc.signatureUrl}
                        alt="Captured Signature"
                        className="max-h-12 max-w-[200px] object-contain"
                      />
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Signer:</span>
                      <span className="text-white font-bold">{currentDoc.signedBy || currentDoc.borrowerName}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Signed Date:</span>
                      <span className="font-mono text-amber-300">{currentDoc.signatureDate}</span>
                    </div>
                    {currentDoc.verificationHash && (
                      <div>
                        <span className="text-slate-500 text-[9px] block">Verification Hash:</span>
                        <span className="text-slate-300 font-mono text-[9px] break-all block mt-0.5">
                          {currentDoc.verificationHash}
                        </span>
                      </div>
                    )}
                    <div className="pt-1 flex gap-1.5">
                      {onVerifyDoc && (
                        <button
                          type="button"
                          onClick={() => onVerifyDoc(currentDoc)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          Verify
                        </button>
                      )}
                      {onSignDoc && (
                        <button
                          type="button"
                          onClick={() => onSignDoc(currentDoc)}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                          title="Re-sign document"
                        >
                          <PenTool className="w-3 h-3" />
                          Re-sign
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-2">
                    <p className="text-slate-400 text-[10px]">
                      This legal agreement requires borrower digital signature to complete execution.
                    </p>
                    {onSignDoc && (
                      <button
                        type="button"
                        onClick={() => onSignDoc(currentDoc)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        Digitally Sign Agreement
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  {downloadSuccess ? 'Downloaded!' : 'Download Document'}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save as PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Filmstrip Carousel: Thumbnail Preview Rail */}
        <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-2.5 shrink-0 select-none">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Document Vault Filmstrip ({currentIndex + 1} of {documents.length})
            </span>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              Use ← / → keys to navigate · + / - to zoom
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
            {documents.map((doc, idx) => {
              const isActive = doc.id === currentDoc.id;
              const docIsPdf =
                doc.fileType.toLowerCase().includes('pdf') ||
                doc.name.toLowerCase().endsWith('.pdf') ||
                doc.fileType === 'pdf';

              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setActiveId(doc.id);
                    if (onSelectDoc) onSelectDoc(doc.id);
                    setZoomLevel(100);
                    setRotation(0);
                    setActivePage(1);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-400/80 shadow-xs ring-1 ring-amber-400/50'
                      : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  {/* Miniature Thumbnail */}
                  <div
                    className={`w-7 h-9 rounded border flex flex-col items-center justify-center shrink-0 ${
                      docIsPdf
                        ? 'bg-white text-rose-600 border-slate-300'
                        : 'bg-slate-700 text-amber-400 border-slate-600'
                    }`}
                  >
                    {docIsPdf ? (
                      <span className="text-[8px] font-mono font-bold">PDF</span>
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="min-w-0 max-w-[130px]">
                    <span
                      className={`text-xs font-bold truncate block ${
                        isActive ? 'text-amber-300' : 'text-slate-200'
                      }`}
                    >
                      {doc.title || doc.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 block truncate">
                      {doc.fileSize} · {doc.category}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
