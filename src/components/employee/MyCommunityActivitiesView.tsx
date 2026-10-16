import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HeartHandshake,
  Calendar,
  MapPin,
  QrCode,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  X,
  ExternalLink,
} from 'lucide-react';

export const MyCommunityActivitiesView: React.FC = () => {
  const { currentUser, employees, branches, csrProjects } = useApp();
  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const branch = branches.find(b => b.id === applicant.branchId);

  const [joinedProjects, setJoinedProjects] = useState<string[]>(['proj-086']);
  const [showQRPass, setShowQRPass] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string; isFile?: boolean } | null>(null);

  const toggleJoin = (projId: string) => {
    if (joinedProjects.includes(projId)) {
      setJoinedProjects(prev => prev.filter(id => id !== projId));
    } else {
      setJoinedProjects(prev => [...prev, projId]);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">OPEC Community & Volunteer Activities</h1>
          <p className="text-xs text-slate-500 mt-1">
            Official OPEC community outreach initiatives, Brigada Eskwela, tree planting drives, and volunteer attendance tracking.
          </p>
        </div>

        <button
          onClick={() => setShowQRPass(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
        >
          <QrCode className="w-4 h-4" />
          My Volunteer QR Pass
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-5">
        {csrProjects.map(proj => {
          const isJoined = joinedProjects.includes(proj.id);
          const title = proj.projectTitle || proj.name;
          const address = proj.projectAddress || proj.location;
          const beneficiaries = proj.projectBeneficiaries || (proj.beneficiaries?.map(b => b.name).join(', ') || 'Community residents');
          const photos = proj.photos || [];
          const videoLink = proj.videoLink || '';
          const hasVideoFile = proj.videos && proj.videos.length > 0;

          return (
            <div
              key={proj.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 max-w-2xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {proj.projectNumber}
                    </span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {proj.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-emerald-700 font-bold ml-1">{proj.status}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{proj.description}</p>

                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Address: <strong className="text-slate-900 dark:text-white">{address}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Users className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Beneficiaries: <strong className="text-slate-900 dark:text-white">{beneficiaries}</strong></span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {proj.startDate} to {proj.endDate}
                      </span>
                      <span>·</span>
                      <span>Project Coordinator: <strong className="text-slate-700 dark:text-slate-300">{proj.projectLeader}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-center shrink-0">
                  <button
                    onClick={() => toggleJoin(proj.id)}
                    className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                      isJoined
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                    }`}
                  >
                    {isJoined ? '✓ Registered Volunteer' : 'Join as Volunteer'}
                  </button>
                  {isJoined && (
                    <span className="text-[10px] text-slate-400 mt-1">Show QR Pass at event check-in</span>
                  )}
                </div>
              </div>

              {/* Photo & Video Showcase strip */}
              {(photos.length > 0 || videoLink || hasVideoFile) && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
                  {/* Photo Thumbnails */}
                  {photos.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                        Documentation ({photos.length}):
                      </span>
                      {photos.map((photo, i) => (
                        <img
                          key={i}
                          src={photo}
                          alt="Activity photo"
                          onClick={() => setSelectedPhoto(photo)}
                          className="h-12 w-16 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 hover:scale-105 transition-all shrink-0"
                        />
                      ))}
                    </div>
                  )}

                  {/* Video Watch Button */}
                  {(videoLink || hasVideoFile) && (
                    <button
                      onClick={() =>
                        setSelectedVideo({
                          url: videoLink || (proj.videos ? proj.videos[0] : ''),
                          title,
                          isFile: !videoLink && hasVideoFile,
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all ml-auto"
                    >
                      <Play className="w-3.5 h-3.5 fill-rose-600" />
                      Watch Outreach Video
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedPhoto} alt="Activity Large" className="rounded-xl max-h-[85vh] w-auto mx-auto object-contain shadow-2xl" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-3 -right-3 bg-white text-black rounded-full p-1.5 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Video Modal Player */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {selectedVideo.title} — Video Documentation
              </h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedVideo.isFile ? (
              <video controls src={selectedVideo.url} className="w-full rounded-xl max-h-96 bg-black">
                Your browser does not support HTML5 video tag.
              </video>
            ) : getYouTubeEmbedUrl(selectedVideo.url) ? (
              <div className="relative pt-[56.25%] rounded-xl overflow-hidden bg-black shadow-lg">
                <iframe
                  src={getYouTubeEmbedUrl(selectedVideo.url)!}
                  title="OPEC Video Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <VideoIcon className="w-12 h-12 text-rose-500 mx-auto" />
                <p className="text-slate-600 dark:text-slate-300 text-xs">External Video Resource</p>
                <a
                  href={selectedVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Video in New Tab
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Volunteer QR Pass Modal */}
      {showQRPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Volunteer Attendance Pass</h3>
              <p className="text-xs text-slate-500 mt-0.5">Present this QR code to the field coordinator</p>
            </div>

            {/* QR Mock graphic */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 inline-block mx-auto">
              <div className="w-48 h-48 bg-slate-900 p-3 rounded-lg flex items-center justify-center">
                <div className="grid grid-cols-6 gap-1 w-full h-full bg-white p-2 rounded">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        (i * 7) % 3 === 0 || i === 0 || i === 5 || i === 30 || i === 35
                          ? 'bg-slate-950'
                          : 'bg-slate-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">{applicant.firstName} {applicant.lastName}</span>
              <span className="font-mono text-slate-500 block">{applicant.employeeNumber} · {branch?.name}</span>
            </div>

            <button
              onClick={() => setShowQRPass(false)}
              className="w-full py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
