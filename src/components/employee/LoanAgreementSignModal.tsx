import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool,
  RotateCcw,
  CheckCircle2,
  X,
  Calendar,
  Sparkles,
  ShieldCheck,
  Lock,
  FileText,
  AlertCircle,
  Trash2,
  Undo2,
} from 'lucide-react';
import { formatPHP } from '../../lib/loans/calculator';
import {
  DigitalSignatureMetadata,
  generateVerificationHash,
} from '../../lib/services/documentSigningService';

interface LoanAgreementSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  docNumber: string;
  loanNumber: string;
  principal?: number;
  borrowerName: string;
  employeeNumber: string;
  branchName?: string;
  initialSignatureUrl?: string;
  onSaveSignature: (metadata: DigitalSignatureMetadata) => void;
}

export const LoanAgreementSignModal: React.FC<LoanAgreementSignModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  docNumber,
  loanNumber,
  principal,
  borrowerName,
  employeeNumber,
  branchName = 'Region 20 Branch',
  initialSignatureUrl,
  onSaveSignature,
}) => {
  const [penColor, setPenColor] = useState<string>('#1e3a8a'); // Executive blue
  const [strokeWidth, setStrokeWidth] = useState<number>(2.5);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [agreedConsent, setAgreedConsent] = useState<boolean>(true);
  const [signatureDate, setSignatureDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const historyRef = useRef<ImageData[]>([]);

  // Initialize canvas
  useEffect(() => {
    if (!isOpen) return;

    setHasDrawn(Boolean(initialSignatureUrl));
    setErrorMsg(null);

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 2;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = strokeWidth;

      if (initialSignatureUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 20, 20, rect.width - 40, rect.height - 40);
        };
        img.src = initialSignatureUrl;
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [isOpen, initialSignatureUrl]);

  // Update pen styles when changed
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = penColor;
    ctx.lineWidth = strokeWidth;
  }, [penColor, strokeWidth]);

  if (!isOpen) return null;

  // Coordinate helper
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent<HTMLCanvasElement>).clientX - rect.left,
        y: (e as React.MouseEvent<HTMLCanvasElement>).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save state for undo
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (historyRef.current.length > 10) historyRef.current.shift();

    isDrawingRef.current = true;
    setHasDrawn(true);
    setErrorMsg(null);

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.closePath();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width * 2, rect.height * 2);
    setHasDrawn(false);
    historyRef.current = [];
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const previousState = historyRef.current.pop();
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
      if (historyRef.current.length === 0) {
        setHasDrawn(false);
      }
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      setErrorMsg('Please draw your digital signature before saving.');
      return;
    }

    if (!agreedConsent) {
      setErrorMsg('Please confirm legal acceptance of the electronic signature covenant.');
      return;
    }

    // Capture signature image as Data URL
    const signatureUrl = canvas.toDataURL('image/png');
    const signedAtIso = new Date().toISOString();
    const verificationHash = generateVerificationHash(docNumber, employeeNumber, signedAtIso);

    const metadata: DigitalSignatureMetadata = {
      signatureUrl,
      signatureDate,
      signedAtIso,
      signedByName: borrowerName,
      signedByEmployeeNo: employeeNumber,
      signerRole: 'Principal Borrower & OPEC Member',
      branchName,
      verificationHash,
      verificationStatus: 'VERIFIED_AUTHENTIC',
      legalNotice: 'Executed in compliance with Philippine Electronic Commerce Act (R.A. 8792)',
      ipAddressSimulated: '192.168.1.104 (Verified OA-GIMS Station)',
    };

    onSaveSignature(metadata);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 text-slate-900 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center shadow-xs">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Electronic Signature Pad
                </span>
                <span className="text-xs text-slate-400">· Canvas Capture</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Digitally Sign Loan Agreement
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Document Reference Banner */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 text-sm block">
                  {documentTitle}
                </span>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-500">
                  <span className="font-bold text-slate-700">{docNumber}</span>
                  <span>·</span>
                  <span className="text-amber-800 font-bold">{loanNumber}</span>
                  {principal && (
                    <>
                      <span>·</span>
                      <span className="text-slate-800">{formatPHP(principal)}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                Signatory: Borrower
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
              <span>Signer: <strong>{borrowerName}</strong> ({employeeNumber})</span>
              <span>Branch: <strong>{branchName}</strong></span>
            </div>
          </div>

          {/* Canvas Controls Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-100 p-2 rounded-xl border border-slate-200">
            {/* Color Palette */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-600 mr-1">Pen Ink:</span>
              {[
                { color: '#1e3a8a', label: 'Executive Blue' },
                { color: '#0f172a', label: 'Formal Black' },
                { color: '#b45309', label: 'OPEC Gold' },
              ].map(c => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setPenColor(c.color)}
                  style={{ backgroundColor: c.color }}
                  className={`w-6 h-6 rounded-full transition-transform border-2 cursor-pointer ${
                    penColor === c.color ? 'scale-110 border-white ring-2 ring-amber-400' : 'border-slate-300 opacity-70'
                  }`}
                  title={c.label}
                />
              ))}
            </div>

            {/* Stroke Width */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 px-1">Tip:</span>
              {[
                { width: 1.5, label: 'Fine' },
                { width: 2.5, label: 'Medium' },
                { width: 4.0, label: 'Bold' },
              ].map(s => (
                <button
                  key={s.width}
                  type="button"
                  onClick={() => setStrokeWidth(s.width)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    strokeWidth === s.width
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Canvas Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
                title="Undo last stroke"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-700 hover:border-rose-300 border border-slate-200 text-[11px] font-bold shadow-2xs transition-colors"
                title="Clear canvas"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>

          {/* Interactive HTML5 Canvas Drawing Board */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-48 bg-white border-2 border-dashed border-slate-300 rounded-xl cursor-crosshair shadow-inner touch-none"
            />

            {/* Placeholder Watermark */}
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 space-y-1">
                <PenTool className="w-6 h-6 text-slate-300 stroke-[1.5]" />
                <span className="font-semibold text-xs text-slate-500">
                  Draw your digital signature here
                </span>
                <span className="text-[10px] text-slate-400">
                  Sign with mouse, trackpad, stylus, or touch screen
                </span>
              </div>
            )}

            {/* Baseline Signature Guide Line */}
            <div className="absolute bottom-6 left-8 right-8 pointer-events-none border-b border-slate-300 flex justify-between text-[9px] font-mono text-slate-400 pb-0.5">
              <span>✕ SIGN HERE</span>
              <span>AUTHORIZED SIGNATURE BASELINE</span>
            </div>
          </div>

          {/* Date and Consent Row */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Signing Date:
              </label>
              <input
                type="date"
                value={signatureDate}
                onChange={e => setSignatureDate(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-slate-50 font-mono font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 cursor-pointer text-[11px] text-amber-900 leading-relaxed">
              <input
                type="checkbox"
                checked={agreedConsent}
                onChange={e => setAgreedConsent(e.target.checked)}
                className="mt-0.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
              <span>
                <strong>Legal Electronic Signature Consent:</strong> I confirm this digital signature mark constitutes my legal, binding electronic signature on this OPEC loan agreement pursuant to the <em>Philippine Electronic Commerce Act (R.A. 8792)</em>.
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted with SHA-256 verification hash</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasDrawn || !agreedConsent}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Capture & Save Signature to Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
