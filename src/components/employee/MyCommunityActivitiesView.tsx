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
} from 'lucide-react';

export const MyCommunityActivitiesView: React.FC = () => {
  const { currentUser, employees, branches, csrProjects } = useApp();
  const applicant = employees.find(e => e.id === currentUser.employeeId) || employees[0];
  const branch = branches.find(b => b.id === applicant.branchId);

  const [joinedProjects, setJoinedProjects] = useState<string[]>(['proj-086']);
  const [showQRPass, setShowQRPass] = useState(false);

  const toggleJoin = (projId: string) => {
    if (joinedProjects.includes(projId)) {
      setJoinedProjects(prev => prev.filter(id => id !== projId));
    } else {
      setJoinedProjects(prev => [...prev, projId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">OPEC Community & Volunteer Activities</h1>
          <p className="text-xs text-slate-500 mt-1">
            Section 27: Community outreach, Brigada Eskwela, tree planting, and volunteer attendance tracking.
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
      <div className="space-y-4">
        {csrProjects.map(proj => {
          const isJoined = joinedProjects.includes(proj.id);

          return (
            <div
              key={proj.id}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 max-w-2xl text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {proj.projectNumber}
                  </span>
                  <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {proj.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-emerald-700 font-bold ml-1">{proj.status}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{proj.name}</h3>
                <p className="text-slate-600 leading-relaxed">{proj.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {proj.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {proj.startDate} to {proj.endDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Lead: {proj.projectLeader}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end justify-center shrink-0">
                <button
                  onClick={() => toggleJoin(proj.id)}
                  className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                    isJoined
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                  }`}
                >
                  {isJoined ? '✓ Registered Volunteer' : 'Join as Volunteer'}
                </button>
                {isJoined && (
                  <span className="text-[10px] text-slate-400 mt-1">Show QR Pass at event</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Volunteer QR Pass Modal */}
      {showQRPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">Volunteer Attendance Pass</h3>
              <p className="text-xs text-slate-500 mt-0.5">Present this QR code to the field coordinator</p>
            </div>

            {/* QR Mock graphic */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 inline-block mx-auto">
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
              <span className="font-bold text-slate-900 block">{applicant.firstName} {applicant.lastName}</span>
              <span className="font-mono text-slate-500 block">{applicant.employeeNumber} · {branch?.name}</span>
            </div>

            <button
              onClick={() => setShowQRPass(false)}
              className="w-full py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
