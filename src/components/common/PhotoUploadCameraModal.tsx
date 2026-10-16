import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  User,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface PhotoUploadCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (photoUrl: string) => void;
  currentPhoto?: string;
  employeeName?: string;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534751516642-a171edd270f2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
];

export const PhotoUploadCameraModal: React.FC<PhotoUploadCameraModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentPhoto,
  employeeName = 'Employee',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'presets'>('upload');
  const [selectedPhoto, setSelectedPhoto] = useState<string>(currentPhoto || '');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedFromCamera, setCapturedFromCamera] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream helper
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start camera
  const startCamera = async () => {
    setCameraError(null);
    setCapturedFromCamera(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this browser or environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        err.message || 'Unable to access web camera. Please check camera permissions or upload a photo file.'
      );
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally for natural mirror feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setSelectedPhoto(dataUrl);
    setCapturedFromCamera(true);
    stopCameraStream();
  };

  const handleRetakeCamera = () => {
    setCapturedFromCamera(false);
    startCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!selectedPhoto) {
      alert('Please upload, take a photo, or select an avatar.');
      return;
    }
    onSave(selectedPhoto);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Employee Photo & ID Badge
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Upload Photo or Take Camera Snapshot
            </h3>
            <p className="text-xs text-slate-500">
              Employee: <strong className="text-slate-800">{employeeName}</strong>
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

        {/* Tab buttons */}
        <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-md transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-amber-600" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-md transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            Live Camera
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-md transition-all ${
              activeTab === 'presets'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Gallery
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-6 bg-slate-50/50 hover:bg-amber-50/20 text-center cursor-pointer transition-all flex flex-col items-center justify-center h-48 space-y-2"
            >
              <Upload className="w-8 h-8 text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Click to select photo or drag and drop
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  JPG, PNG, or WEBP (Max 5MB)
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'camera' && (
          <div className="space-y-3">
            {cameraError ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Camera Access Unavailable
                </div>
                <p className="text-[11px]">{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-semibold hover:bg-rose-100"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Access
                </button>
              </div>
            ) : capturedFromCamera ? (
              <div className="text-center space-y-3">
                <div className="relative mx-auto w-48 h-48 rounded-full overflow-hidden border-4 border-emerald-500 shadow-md">
                  <img
                    src={selectedPhoto}
                    alt="Captured preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-emerald-700 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Photo Snapshot Captured!
                </p>
                <button
                  type="button"
                  onClick={handleRetakeCamera}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retake Photo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative bg-slate-900 rounded-xl overflow-hidden h-52 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  {/* Portrait guide overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-36 h-36 border-2 border-dashed border-amber-400/70 rounded-full" />
                  </div>
                  <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                    <span className="text-[10px] bg-slate-900/80 text-white px-2 py-0.5 rounded font-mono">
                      Align face within frame
                    </span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    disabled={!cameraActive}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    Capture Photo Snapshot
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'presets' && (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500">
              Select a professional employee portrait template:
            </p>
            <div className="grid grid-cols-4 gap-2.5">
              {PRESET_AVATARS.map((url, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedPhoto(url)}
                  className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all aspect-square ${
                    selectedPhoto === url
                      ? 'border-amber-500 ring-2 ring-amber-400 scale-105 shadow-sm'
                      : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Preview Bar */}
        {selectedPhoto && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <img
              src={selectedPhoto}
              alt="Preview"
              className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 shrink-0 shadow-2xs"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Preview Ready
              </span>
              <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{employeeName}</p>
              <p className="text-[10px] text-slate-400">Photo successfully staged for employee record</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPhoto('')}
              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Use This Photo
          </button>
        </div>
      </div>
    </div>
  );
};
