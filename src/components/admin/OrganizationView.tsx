import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  MapPin,
  Users,
  Shield,
  Layers,
  ChevronRight,
  Phone,
} from 'lucide-react';

export const OrganizationView: React.FC = () => {
  const { regions, areas, branches, employees } = useApp();
  const [selectedRegionId, setSelectedRegionId] = useState<string>(regions[0]?.id || '');
  const [selectedAreaId, setSelectedAreaId] = useState<string>(areas[0]?.id || '');

  const currentAreas = areas.filter(a => a.regionId === selectedRegionId);
  const currentBranches = branches.filter(b => b.areaId === selectedAreaId);

  // Officers list
  const officers = employees.filter(e => e.opecPosition && e.opecPosition !== 'Member');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Organization Structure & Branches</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Region → Area → Branch
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 1 & 30: Organizational hierarchy linking M Lhuillier branches, chapters, and executive leadership.
          </p>
        </div>
      </div>

      {/* Officers & Board of Directors */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-1">OPEC Aurum Gems Executive Directorate</h2>
        <p className="text-xs text-slate-500 mb-4">Governing officers for loan committee sign-offs and organization administration</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {officers.map(off => {
            const branch = branches.find(b => b.id === off.branchId);

            return (
              <div key={off.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-500 shrink-0">
                  {off.avatarUrl ? (
                    <img src={off.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold">
                      {off.firstName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <span className="font-bold text-slate-900 block truncate">
                    {off.firstName} {off.lastName}
                  </span>
                  <span className="font-semibold text-amber-700 block truncate">
                    {off.opecPosition}
                  </span>
                  <span className="text-slate-400 text-[11px] block truncate">
                    {branch?.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Region -> Area -> Branch Explorer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Regions Column */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>1. Regions ({regions.length})</span>
          </div>

          <div className="space-y-2">
            {regions.map(r => (
              <div
                key={r.id}
                onClick={() => {
                  setSelectedRegionId(r.id);
                  const firstArea = areas.find(a => a.regionId === r.id);
                  if (firstArea) setSelectedAreaId(firstArea.id);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                  selectedRegionId === r.id
                    ? 'border-amber-500 bg-amber-50/50 text-slate-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="block font-semibold">{r.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">{r.code}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Areas Column */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>2. Areas ({currentAreas.length})</span>
          </div>

          <div className="space-y-2">
            {currentAreas.map(a => (
              <div
                key={a.id}
                onClick={() => setSelectedAreaId(a.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                  selectedAreaId === a.id
                    ? 'border-amber-500 bg-amber-50/50 text-slate-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="block font-semibold">{a.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">{a.code}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Branches Column */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>3. Branches ({currentBranches.length})</span>
          </div>

          <div className="space-y-2">
            {currentBranches.map(b => {
              const staffCount = employees.filter(e => e.branchId === b.id).length;

              return (
                <div key={b.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{b.name}</span>
                    <span className="font-mono text-[10px] text-slate-400 font-semibold">{b.code}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{b.address}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {b.contactNumber}
                    </span>
                    <span className="font-semibold text-emerald-700">{staffCount} Personnel</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
