import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  HeartHandshake,
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  Upload,
  Camera,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

interface SubmitCSRReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab?: (tab: string) => void;
}

const PRESET_EVENT_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
    title: 'Tree Planting & Mangrove Restoration',
  },
  {
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    title: 'Brigada Eskwela & School Refurbishment',
  },
  {
    url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&auto=format&fit=crop&q=80',
    title: 'Medical & Dental Community Outreach',
  },
  {
    url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&auto=format&fit=crop&q=80',
    title: 'Relief Goods Packing & Distribution',
  },
];

export const SubmitCSRReportModal: React.FC<SubmitCSRReportModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
}) => {
  const { currentUser, employees, branches, csrProjects, updateCSRProjectStatus, notify } = useApp();

  const employee = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const branch = branches.find(b => b.id === employee.branchId);

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    csrProjects[0]?.id || 'proj-086'
  );
  const [activityName, setActivityName] = useState<string>('Brigada Eskwela Classroom Painting & School Support');
  const [activityDate, setActivityDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [volunteerHours, setVolunteerHours] = useState<number>(4);
  const [location, setLocation] = useState<string>(branch?.name ? `${branch.name}, Ozamiz City` : 'Ozamiz City, Misamis Occidental');
  const [beneficiariesCount, setBeneficiariesCount] = useState<number>(120);
  const [narrative, setNarrative] = useState<string>(
    'Participated in cleaning, desk repairs, and classroom repainting. Distributed school supplies to elementary students in coordination with the OPEC Aurum Gems volunteer corps.'
  );
  const [photoUrl, setPhotoUrl] = useState<string>(PRESET_EVENT_PHOTOS[1].url);
  const [photoTitle, setPhotoTitle] = useState<string>(PRESET_EVENT_PHOTOS[1].title);
  const [partnerLgu, setPartnerLgu] = useState<string>('Aguada Elementary School / Barangay Aguada Council');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [reportReferenceNo, setReportReferenceNo] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const refNo = `CSR-REP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setReportReferenceNo(refNo);

    // Update Project Status if existing
    if (selectedProjectId !== 'custom') {
      updateCSRProjectStatus(
        selectedProjectId,
        'ACCOMPLISHMENT_REPORT',
        `Accomplishment report filed by ${employee.firstName} ${employee.lastName} (${volunteerHours} hrs, ${beneficiariesCount} beneficiaries reached). Narrative: ${narrative.slice(0, 100)}...`
      );
    }

    // Trigger in-app notification
    notify(
      'CSR Volunteer Report Submitted',
      `Your volunteer accomplishment report for "${activityName}" (${volunteerHours} hrs) has been submitted for OPEC accreditation under Ref: ${refNo}.`,
      'INFO'
    );

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-rose-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-400/30 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/20">
                  CSR & Community Outreach
                </span>
                <span className="text-xs text-slate-400">· Section 27 Compliance</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Submit Volunteer Accomplishment Report
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          /* Success Screen */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                Volunteer Report Filed Successfully!
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Thank you for your active participation in OPEC community initiatives. Your report has been credited to your employee civic engagement record.
              </p>
              <div className="inline-block bg-slate-100 border border-slate-200 rounded-lg px-4 py-1.5 font-mono text-xs font-bold text-slate-800 mt-2">
                Reference Number: {reportReferenceNo}
              </div>
            </div>

            {/* Volunteer Badge Card */}
            <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 rounded-xl p-4 max-w-md mx-auto text-left flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 border border-amber-300">
                <Award className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-amber-950">
                  +{volunteerHours} Hours Civic Service Credited
                </div>
                <div className="text-slate-600 text-[11px] mt-0.5">
                  Volunteer: {employee.firstName} {employee.lastName} · {branch?.name || 'Main Branch'}
                </div>
                <div className="text-emerald-700 font-semibold text-[10px] mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Forwarded to OPEC CSR Project Leader & HR
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleResetAndClose}
                className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Close
              </button>
              {setActiveTab && (
                <button
                  onClick={() => {
                    handleResetAndClose();
                    setActiveTab('emp-activities');
                  }}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-xs"
                >
                  View My Community Activities
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            
            {/* Volunteer Reporter Details Strip */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                  {employee.firstName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    {employee.firstName} {employee.lastName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {employee.position} · {branch?.name || 'Main Branch'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                OPEC Volunteer
              </span>
            </div>

            {/* Project Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Select OPEC Community Project / Outreach Event *
              </label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                required
              >
                {csrProjects.map(proj => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name} ({proj.category})
                  </option>
                ))}
                <option value="custom">Other / Self-Organized Branch Community Initiative</option>
              </select>
            </div>

            {/* Activity Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Activity Title / Focus *
                </label>
                <input
                  type="text"
                  value={activityName}
                  onChange={e => setActivityName(e.target.value)}
                  placeholder="e.g. Brigada Eskwela Classroom Painting"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Date of Volunteer Activity *
                </label>
                <input
                  type="date"
                  value={activityDate}
                  onChange={e => setActivityDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Hours, Beneficiaries, and Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Volunteer Hours *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={volunteerHours}
                    onChange={e => setVolunteerHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    required
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-medium">hrs</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Beneficiaries Served *
                </label>
                <input
                  type="number"
                  min="1"
                  value={beneficiariesCount}
                  onChange={e => setBeneficiariesCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Location / Venue *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Barangay / School / Town"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Partner Beneficiary / School / LGU */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Partner LGU, School, or Organization
              </label>
              <input
                type="text"
                value={partnerLgu}
                onChange={e => setPartnerLgu(e.target.value)}
                placeholder="e.g. Aguada Elementary School / Barangay Aguada Council"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            {/* Narrative Summary */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Accomplishment Summary & Highlights *
              </label>
              <textarea
                rows={3}
                value={narrative}
                onChange={e => setNarrative(e.target.value)}
                placeholder="Describe key activities undertaken, community feedback, and impact..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 font-normal text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-hidden leading-relaxed"
                required
              />
            </div>

            {/* Photo Documentation Attachment */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Activity Photo Documentation (Attachment)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {PRESET_EVENT_PHOTOS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPhotoUrl(p.url);
                      setPhotoTitle(p.title);
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-video group text-left ${
                      photoUrl === p.url
                        ? 'border-rose-500 ring-2 ring-rose-300'
                        : 'border-slate-200 hover:border-slate-300 opacity-75'
                    }`}
                  >
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-1 text-[9px] text-white font-medium truncate">
                      {p.title.split(' ')[0]}
                    </div>
                    {photoUrl === p.url && (
                      <div className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Photo preview preview bar */}
              <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <img
                  src={photoUrl}
                  alt="Documentation thumbnail"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0 text-[11px]">
                  <span className="font-bold text-slate-800 block truncate">{photoTitle}</span>
                  <span className="text-slate-400">Attached as official photographic evidence</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 -mx-6 -mb-6 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Official OPEC CSR Form 27-B
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <HeartHandshake className="w-4 h-4" />
                  {isSubmitting ? 'Filing Report...' : 'Submit CSR Report'}
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
