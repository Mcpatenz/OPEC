import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  Upload,
  RotateCcw,
  CheckCircle2,
  Calendar,
  X,
  FileCheck,
  Check,
} from 'lucide-react';

interface SignatureInputProps {
  label?: string;
  signerName?: string;
  signerRole?: string;
  signatureUrl?: string;
  signatureDate?: string;
  onChange: (signatureUrl: string, signatureDate: string) => void;
  required?: boolean;
}

export const SignatureInput: React.FC<SignatureInputProps> = ({
  label = 'Attach or Draw Official Signature',
  signerName,
  signerRole,
  signatureUrl = '',
  signatureDate = '2026-10-06',
  onChange,
  required = true,
}) => {
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [currentSignature, setCurrentSignature] = useState<string>(signatureUrl);
  const [currentDate, setCurrentDate] = useState<string>(signatureDate || '2026-10-06');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnContent, setHasDrawnContent] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync internal state with props if provided
  useEffect(() => {
    if (signatureUrl && signatureUrl !== currentSignature) {
      setCurrentSignature(signatureUrl);
    }
  }, [signatureUrl]);

  useEffect(() => {
    if (signatureDate && signatureDate !== currentDate) {
      setCurrentDate(signatureDate);
    }
  }, [signatureDate]);

  // Canvas drawing setup
  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#0f172a'; // Navy/Slate ink
      }
    }
  }, [mode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasDrawnContent(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasDrawnContent) {
      const dataUrl = canvas.toDataURL('image/png');
      setCurrentSignature(dataUrl);
      onChange(dataUrl, currentDate);
    }
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasDrawnContent(false);
    setCurrentSignature('');
    onChange('', currentDate);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      setCurrentSignature(dataUrl);
      onChange(dataUrl, currentDate);
    };
    reader.readAsDataURL(file);
  };

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    onChange(currentSignature, newDate);
  };

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
      {/* Title & Signer Details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <PenTool className="w-4 h-4 text-amber-600" />
            {label}
            {required && <span className="text-rose-500 font-bold">*</span>}
          </span>
          {(signerName || signerRole) && (
            <p className="text-[11px] text-slate-500 mt-0.5">
              Signer: <strong className="text-slate-800">{signerName}</strong> {signerRole && `(${signerRole})`}
            </p>
          )}
        </div>

        {/* Mode Selector Tabs: Draw vs Upload */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              mode === 'draw'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PenTool className="w-3 h-3" />
            Draw Signature
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              mode === 'upload'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-3 h-3" />
            Attach Image
          </button>
        </div>
      </div>

      {/* Signature Input Workspace */}
      {mode === 'draw' ? (
        <div className="space-y-2">
          <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
            <canvas
              ref={canvasRef}
              width={480}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-32 cursor-crosshair touch-none bg-white"
            />

            {!hasDrawnContent && !currentSignature && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
                <PenTool className="w-5 h-5 mb-1 text-slate-300" />
                <span className="text-[11px]">Draw signature with mouse or touch here</span>
                <div className="w-48 h-0.5 border-b border-dashed border-slate-300 mt-4" />
                <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Signature Line</span>
              </div>
            )}

            {currentSignature && (
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearCanvas}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-white/90 hover:bg-slate-100 text-rose-700 rounded-md border border-slate-200 shadow-2xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear & Redraw
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-white hover:bg-slate-50 cursor-pointer transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {currentSignature ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="h-20 max-w-xs border border-slate-200 rounded-lg p-2 bg-white flex items-center justify-center">
                  <img
                    src={currentSignature}
                    alt="Attached Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="text-[11px] font-bold text-amber-700 hover:underline"
                >
                  Replace Signature Image
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500">
                <Upload className="w-6 h-6 text-amber-600 mb-1" />
                <span className="text-xs font-bold text-slate-800">
                  Click to upload scanned or digital signature
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Supports PNG, JPG, or SVG with transparent or white background
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Date & Verification Status Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Signature Date:
          </label>
          <input
            type="date"
            value={currentDate}
            onChange={e => handleDateChange(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono text-slate-800"
          />
        </div>

        <div className="flex items-end">
          {currentSignature ? (
            <div className="w-full p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900">
              <span className="text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Signature Attached
              </span>
              <span className="text-[10px] font-mono text-emerald-700">{currentDate}</span>
            </div>
          ) : (
            <div className="w-full p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
              Signature required to execute approval.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
