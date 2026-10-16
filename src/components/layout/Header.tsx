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
  Mail,
  KeyRound,
  ShieldCheck,
  Moon,
  Sun,
} from 'lucide-react';
import { GlobalHeaderSearch } from './GlobalHeaderSearch';

interface HeaderProps {
  portalMode: 'admin' | 'employee';
  setPortalMode: (mode: 'admin' | 'employee') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenApplyModal: () => void;
  onOpenNotificationCenter?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  portalMode,
  setPortalMode,
  setActiveTab,
  onOpenApplyModal,
  onOpenNotificationCenter,
}) => {
  const {
    currentUser,
    setCurrentUser,
    notifications,
    currentUserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    registeredGmail,
    isGoogleConnected,
    isGmailVerified,
    openGmailOtpModal,
    isDarkMode,
    toggleDarkMode,
  } = useApp();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isBannerCollapsed, setIsBannerCollapsed] = useState(false);

  const displayList = portalMode === 'employee' ? currentUserNotifications : notifications;
  const unreadNotifs = displayList.filter(n => !n.read);

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
          
          {/* Brand Info with Official Logo */}
          <div className="flex items-center gap-3">
            <div className="relative group shrink-0">
              <img
                src="/src/assets/images/opec_logo_1791532750142.jpg"
                alt="OPEC Aurum Gems Official Crest Logo"
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover shadow-lg border-2 border-amber-400 shrink-0 ring-2 ring-amber-500/30 transition-transform group-hover:scale-105"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  OA-GIMS
                  <span className="text-amber-300 text-xs font-bold px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/30 shadow-2xs">
                    OPEC Aurum Gems
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block font-medium">
                ZASURMIS Region · M Lhuillier Cooperative Organization
              </p>
            </div>
          </div>

          {/* Global Header Search Bar for Administrators & System Search */}
          <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-2 sm:mx-4">
            <GlobalHeaderSearch
              portalMode={portalMode}
              setPortalMode={setPortalMode}
              setActiveTab={setActiveTab}
            />
          </div>

          {/* Center: Portal Mode Switcher */}
          <div className="hidden lg:flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 shrink-0">
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

          {/* Right: Notifications, Gmail/OTP & Persona Switcher */}
          <div className="flex items-center gap-3">

            {/* Gmail & OTP Center Quick Button */}
            <button
              onClick={() => openGmailOtpModal()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white transition-all shadow-xs cursor-pointer"
              title="Gmail Notifications & 6-Digit OTP Verification Center"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline text-[11px]">
                {isGoogleConnected ? 'Gmail Connected' : 'Gmail & OTP'}
              </span>
              {isGmailVerified ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 ring-1 ring-slate-900" />
              )}
            </button>

            {/* Notification Popover Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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
                      <span className="text-xs text-amber-400 font-medium">({unreadNotifs.length} unread)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadNotifs.length > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Registered Gmail Delivery Banner */}
                  <div className="px-4 py-2 bg-slate-800/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[11px] text-slate-300 truncate">
                        Gmail: <strong className="text-white font-mono">{registeredGmail}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        openGmailOtpModal();
                      }}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 whitespace-nowrap ml-2 cursor-pointer"
                    >
                      {isGmailVerified ? 'Verified OTP' : 'Verify OTP'}
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {displayList.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No notifications</div>
                    ) : (
                      displayList.slice(0, 8).map(n => {
                        const getCategoryPill = () => {
                          switch (n.category) {
                            case 'LOAN_STATUS':
                              return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                            case 'COMAKER_REQUEST':
                              return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                            case 'UPCOMING_PAYMENT':
                              return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                            case 'PAYMENT_CREDITED':
                              return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
                            default:
                              return 'bg-slate-800 text-slate-300 border-slate-700';
                          }
                        };

                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationRead(n.id);
                              setShowNotifications(false);
                              if (n.linkAction) {
                                if (n.linkAction.startsWith('emp-')) setPortalMode('employee');
                                else if (n.linkAction.startsWith('adm-')) setPortalMode('admin');
                                setActiveTab(n.linkAction);
                              }
                            }}
                            className={`p-3.5 text-xs transition-colors hover:bg-slate-800/80 cursor-pointer ${
                              !n.read ? 'bg-slate-800/40' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${getCategoryPill()}`}
                                >
                                  {n.category?.replace(/_/g, ' ') || 'ALERT'}
                                </span>
                                <span className="font-medium text-white">{n.title}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {n.timestamp.split(' ')[1] || n.timestamp}
                              </span>
                            </div>
                            <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="px-3 py-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {portalMode === 'employee' ? 'Employee alerts' : 'Administrative alerts'}
                    </span>
                    {onOpenNotificationCenter && (
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          onOpenNotificationCenter();
                        }}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      >
                        <span>Open Notification Center</span>
                        <Sparkles className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-xs shadow-amber-500/10'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700/80 text-slate-300 hover:text-white'
              }`}
              title={
                isDarkMode
                  ? 'Switch to Light Theme'
                  : 'Switch to Dark Theme (persisted preference to reduce eye strain during late-hour work)'
              }
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                  <span className="hidden sm:inline text-[11px] text-amber-300 font-bold">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline text-[11px] text-slate-300 font-bold">Light</span>
                </>
              )}
            </button>

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
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      System Role Switcher
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      7 Core Roles: Admin, President, Secretary, Treasurer, Area Manager, Regional Manager, Member
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50 py-1">
                    {AVAILABLE_PERSONAS.map(p => {
                      const getRoleBadgeStyle = (role: string) => {
                        switch (role) {
                          case 'SUPER_ADMIN':
                          case 'ADMIN':
                            return 'bg-slate-700 text-slate-200 border-slate-600';
                          case 'OPEC_PRESIDENT':
                          case 'PRESIDENT':
                            return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                          case 'SECRETARY':
                          case 'OPEC_SECRETARY':
                            return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
                          case 'TREASURER':
                            return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                          case 'AREA_MANAGER':
                            return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
                          case 'REGIONAL_MANAGER':
                            return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
                          case 'MEMBER':
                            return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
                          default:
                            return 'bg-slate-800 text-slate-300 border-slate-700';
                        }
                      };

                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPersona(p)}
                          className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-850 transition-colors flex items-center justify-between cursor-pointer ${
                            currentUser.id === p.id ? 'bg-slate-800/90 text-white' : 'text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{p.name}</span>
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(
                                  p.role
                                )}`}
                              >
                                {p.role.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{p.branchName}</div>
                          </div>
                          {currentUser.id === p.id && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Official OPEC Aurum Gems Regional Header Banner */}
      {!isBannerCollapsed ? (
        <div className="relative border-t border-b border-amber-500/25 bg-slate-950 overflow-hidden shadow-inner">
          {/* Background image from user-specified header picture */}
          <div className="absolute inset-0 z-0">
            <img
              src="/src/assets/images/opec_header_banner_1791532764943.jpg"
              alt="OPEC Aurum Gems - ZASURMIS Region Header Banner"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center opacity-35 brightness-110 filter saturate-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-slate-950/90" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/60" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <img
                  src="/src/assets/images/opec_logo_1791532750142.jpg"
                  alt="OPEC Aurum Gems Official Emblem"
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 sm:w-13 sm:h-13 rounded-full object-cover border-2 border-amber-400 shadow-xl ring-2 ring-amber-500/20 shrink-0"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm sm:text-base tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 uppercase font-serif">
                    OPEC AURUM GEMS · ZASURMIS REGION
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    Official Cooperative
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hidden sm:inline-block">
                    Credit & Welfare Union
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium tracking-normal mt-0.5">
                  M LHUILLIER Tulay ng PaMLyang Pilipino · Pagtutulungan Tungo sa Kinabukasan
                </p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Zamboanga del Sur & Misamis Occidental Chapter
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-300 font-mono">
                    Payroll Cutoff: 15th & 30th Monthly
                  </span>
                  <span className="hidden sm:inline text-slate-600">•</span>
                  <span className="hidden sm:inline text-slate-300">
                    CBU: <strong className="text-amber-300 font-mono">₱100/payday</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <span className="text-[11px] font-semibold text-slate-300 hidden lg:inline">
                Retainer Fee: <strong className="text-emerald-300 font-mono">10% Open Equity</strong>
              </span>
              <button
                onClick={() => setIsBannerCollapsed(true)}
                title="Minimize Header Banner"
                className="text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-md hover:bg-slate-800/80 border border-slate-700/60 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Compact</span>
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 py-1 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <img
              src="/src/assets/images/opec_logo_1791532750142.jpg"
              alt="Logo"
              referrerPolicy="no-referrer"
              className="w-4 h-4 rounded-full object-cover"
            />
            <span>OPEC Aurum Gems · ZASURMIS Region</span>
          </div>
          <button
            onClick={() => setIsBannerCollapsed(false)}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            Show Regional Header Banner
          </button>
        </div>
      )}
    </header>
  );
};
