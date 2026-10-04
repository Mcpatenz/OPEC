import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AVAILABLE_PERSONAS } from '../../lib/constants';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Shield,
  User,
  Building2,
  ArrowRightLeft,
  X,
  Clock,
  Sparkles,
  FileText,
} from 'lucide-react';

interface HeaderProps {
  portalMode: 'admin' | 'employee';
  setPortalMode: (mode: 'admin' | 'employee') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenApplyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  portalMode,
  setPortalMode,
  setActiveTab,
  onOpenApplyModal,
}) => {
  const { currentUser, setCurrentUser, notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.read);

  const handleSelectPersona = (persona: typeof AVAILABLE_PERSONAS[0]) => {
    setCurrentUser(persona);
    setShowPersonaMenu(false);
    if (persona.role === 'MEMBER' || persona.role === 'VIEWER') {
      setPortalMode('employee');
      setActiveTab('emp-dashboard');
    } else {
      setPortalMode('admin');
      setActiveTab('admin-dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold tracking-tight">
              <span className="text-lg">OA</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  OA-GIMS
                  <span className="text-amber-400 text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                    OPEC Aurum Gems
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Empowering Members · Managing Loans · Building Communities
              </p>
            </div>
          </div>

          {/* Center: Portal Mode Switcher */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => {
                setPortalMode('employee');
                setActiveTab('emp-dashboard');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                portalMode === 'employee'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Employee Portal
            </button>
            <button
              onClick={() => {
                setPortalMode('admin');
                setActiveTab('admin-dashboard');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                portalMode === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Portal
            </button>
          </div>

          {/* Right: Quick Apply Button, Notification & Persona Switcher */}
          <div className="flex items-center gap-3">
            {portalMode === 'employee' && (
              <button
                onClick={onOpenApplyModal}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-sm transition-all active:scale-95"
              >
                <FileText className="w-3.5 h-3.5" />
                Apply for Loan
              </button>
            )}

            {/* Notification Popover Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse ring-2 ring-slate-900" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-slate-200">
                  <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">System Alerts</span>
                      <span className="text-xs text-amber-400 font-medium">({unreadNotifs.length} new)</span>
                    </div>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No notifications</div>
                    ) : (
                      notifications.slice(0, 8).map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3.5 text-xs transition-colors hover:bg-slate-800/70 cursor-pointer ${
                            !n.read ? 'bg-slate-800/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-white">{n.title}</span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.timestamp.split(' ')[1] || n.timestamp}</span>
                          </div>
                          <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400">Notifications sync across committee & employees</span>
                  </div>
                </div>
              )}
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 transition-all text-left"
              >
                <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-amber-400/90 font-mono tracking-wider">
                    {currentUser.role.replace(/_/g, ' ')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Persona selection menu */}
              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Switch Role / Testing Persona
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Test multi-role approval, releasing & applicant views
                    </p>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50 py-1">
                    {AVAILABLE_PERSONAS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPersona(p)}
                        className={`w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors flex items-center justify-between ${
                          currentUser.id === p.id ? 'bg-slate-800/90 text-white' : 'text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">{p.name}</div>
                          <div className="text-[10px] text-amber-400 font-mono">{p.role.replace(/_/g, ' ')}</div>
                          <div className="text-[10px] text-slate-400">{p.branchName}</div>
                        </div>
                        {currentUser.id === p.id && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
