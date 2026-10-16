import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool,
  Upload,
  RotateCcw,
  CheckCircle2,
  X,
  Calendar,
  Sparkles,
  FileCheck,
  Trash2,
} from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { signatureUrl: string; signatureDate: string }) => void;
  title?: string;
  signerName?: string;
  signerRole?: string;
  initialDate?: string;
  initialSignature?: string;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title = 'Attach or Draw Official Signature',
  signerName = 'Authorized Signer',
  signerRole = 'Signer',
  initialDate,
  initialSignature,
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'upload' | 'preset'>('draw');
  const [signatureDate, setSignatureDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [uploadedUrl, setUploadedUrl] = useState<string>(initialSignature || '');
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [penColor, setPenColor] = useState<string>('#1e3a8a'); // Professional dark blue
  const [strokeWidth, setStrokeWidth] = useState<number>(2.5);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const historyRef = useRef<ImageData[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Reset canvas size with device pixel ratio
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = strokeWidth;

        // If initialSignature was provided and we haven't drawn, we can render it
        if (initialSignature && !hasDrawn) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 20, 20, rect.width - 40, rect.height - 40);
            setHasDrawn(true);
          };
          img.src = initialSignature;
        } else {
          // Clear canvas
          ctx.clearRect(0, 0, rect.width, rect.height);
        }
      }, 50);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Drawing helpers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save history for undo
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (historyRef.current.length > 10) historyRef.current.shift();

    isDrawingRef.current = true;
    setHasDrawn(true);

    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.strokeStyle = penColor;
    ctx.lineWidth = strokeWidth;
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    historyRef.current = [];
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || historyRef.current.length === 0) return;
    const prev = historyRef.current.pop();
    if (prev) {
      ctx.putImageData(prev, 0, 0);
    }
  };

  // Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Generate clean cursive svg signature for preset
  const generatePresetSignature = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 450;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 450, 180);
    ctx.font = 'italic 44px "Brush Script MT", "Caveat", "Segoe Script", cursive';
    ctx.fillStyle = penColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(signerName, 225, 80);

    // Subtle flourish underline
    ctx.beginPath();
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.moveTo(80, 120);
    ctx.bezierCurveTo(160, 135, 290, 105, 370, 125);
    ctx.stroke();

    const url = canvas.toDataURL('image/png');
    setUploadedUrl(url);
    setActiveTab('upload');
  };

  const handleSaveSignature = () => {
    let finalUrl = '';
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        alert('Please draw your signature before confirming.');
        return;
      }
      finalUrl = canvas.toDataURL('image/png');
    } else {
      if (!uploadedUrl) {
        alert('Please upload or generate a signature image.');
        return;
      }
      finalUrl = uploadedUrl;
    }

    if (!signatureDate) {
      alert('Please specify the signature date.');
      return;
    }

    onSave({
      signatureUrl: finalUrl,
      signatureDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Official Signature & Seal
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {signerRole}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{title}</h3>
            <p className="text-xs text-slate-500">
              Signer: <strong className="text-slate-800">{signerName}</strong> · Validates OPEC authorization
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection: Draw vs Attach */}
        <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-md transition-all ${
              activeTab === 'draw'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-amber-600" />
            Draw Signature
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-md transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            Attach Image File
          </button>
          <button
            type="button"
            onClick={generatePresetSignature}
            className="px-3 py-1.5 flex items-center gap-1 text-amber-700 hover:text-amber-900 font-bold hover:bg-amber-100/50 rounded-md transition-all"
            title="Auto-generate official signature for testing"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Quick Preset
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'draw' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Sign inside the box using mouse or finger:</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium">Ink:</span>
                <button
                  type="button"
                  onClick={() => setPenColor('#1e3a8a')}
                  className={`w-4 h-4 rounded-full bg-blue-900 transition-all ${
                    penColor === '#1e3a8a' ? 'ring-2 ring-blue-500 scale-110' : ''
                  }`}
                  title="Official Blue Ink"
                />
                <button
                  type="button"
                  onClick={() => setPenColor('#0f172a')}
                  className={`w-4 h-4 rounded-full bg-slate-900 transition-all ${
                    penColor === '#0f172a' ? 'ring-2 ring-slate-600 scale-110' : ''
                  }`}
                  title="Black Ink"
                />
              </div>
            </div>

            {/* Drawing Canvas */}
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/60 overflow-hidden select-none touch-none h-44 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full cursor-crosshair"
              />
              {!hasDrawn && (
                <div className="absolute pointer-events-none text-center text-slate-400 text-xs">
                  <PenTool className="w-6 h-6 mx-auto mb-1 opacity-40 text-slate-500" />
                  <span>Click and drag here to sign</span>
                </div>
              )}
              {/* Baseline indicator */}
              <div className="absolute bottom-6 left-8 right-8 border-b border-slate-300/80 pointer-events-none flex justify-between text-[10px] text-slate-400">
                <span>Sign Above Line</span>
                <span>✖</span>
              </div>
            </div>

            {/* Canvas Actions */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Undo
                </button>
                <button
                  type="button"
                  onClick={handleClearCanvas}
                  className="flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
              <span className="text-[11px] text-slate-400">
                Resolution: 300 DPI Electronic Capture
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
            />

            {uploadedUrl ? (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-center space-y-3">
                <div className="h-36 flex items-center justify-center bg-white rounded-lg p-2 border border-slate-200 shadow-2xs">
                  <img
                    src={uploadedUrl}
                    alt="Uploaded Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                  >
                    Replace Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadedUrl('')}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-6 bg-slate-50/50 hover:bg-amber-50/30 text-center cursor-pointer transition-all space-y-2 h-44 flex flex-col items-center justify-center"
              >
                <Upload className="w-8 h-8 text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Click to browse or drop signature image
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    PNG, JPG, or SVG with transparent background recommended
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date Selector */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Signature Date:</span>
          </div>
          <input
            type="date"
            value={signatureDate}
            onChange={e => setSignatureDate(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSignature}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Attach Signature & Date
          </button>
        </div>
      </div>
    </div>
  );
};
