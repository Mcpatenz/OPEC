import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AppNotification, NotificationCategory } from '../../types';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  CreditCard,
  Receipt,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Filter,
  Trash2,
  CheckCheck,
  Search,
  ArrowRight,
  Info,
  Calendar,
  PenTool,
  Mail,
  KeyRound,
} from 'lucide-react';

interface InAppNotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  setPortalMode?: (mode: 'admin' | 'employee') => void;
}

export const InAppNotificationCenterModal: React.FC<InAppNotificationCenterModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  setPortalMode,
}) => {
  const {
    currentUser,
    notifications,
    currentUserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    sendTestNotification,
    registeredGmail,
    isGmailVerified,
    openGmailOtpModal,
  } = useApp();

  const [filterCategory, setFilterCategory] = useState<'ALL' | NotificationCategory>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewScope, setViewScope] = useState<'MY_ALERTS' | 'ALL_SYSTEM'>('MY_ALERTS');

  const baseList = viewScope === 'MY_ALERTS' ? currentUserNotifications : notifications;

  const filteredNotifications = useMemo(() => {
    return baseList.filter(item => {
      // Category filter
      if (filterCategory !== 'ALL' && item.category !== filterCategory) {
        return false;
      }
      // Unread only filter
      if (unreadOnly && item.read) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesMessage = item.message.toLowerCase().includes(query);
        const matchesActor = item.actorName?.toLowerCase().includes(query) || false;
        const matchesId = item.relatedId?.toLowerCase().includes(query) || false;
        return matchesTitle || matchesMessage || matchesActor || matchesId;
      }
      return true;
    });
  }, [baseList, filterCategory, unreadOnly, searchQuery]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: baseList.length,
      loanStatus: baseList.filter(n => n.category === 'LOAN_STATUS').length,
      coMaker: baseList.filter(n => n.category === 'COMAKER_REQUEST').length,
      upcomingPayment: baseList.filter(n => n.category === 'UPCOMING_PAYMENT').length,
      paymentCredited: baseList.filter(n => n.category === 'PAYMENT_CREDITED').length,
      unread: baseList.filter(n => !n.read).length,
    };
  }, [baseList]);

  if (!isOpen) return null;

  const handleNotificationAction = (notif: AppNotification) => {
    markNotificationRead(notif.id);
    onClose();

    if (notif.linkAction) {
      if (notif.linkAction.startsWith('emp-') && setPortalMode) {
        setPortalMode('employee');
      } else if (notif.linkAction.startsWith('adm-') && setPortalMode) {
        setPortalMode('admin');
      }
      setActiveTab(notif.linkAction);
    }
  };

  const getCategoryConfig = (category?: NotificationCategory) => {
    switch (category) {
      case 'LOAN_STATUS':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          border: 'border-l-4 border-l-emerald-500',
          label: 'Loan Status',
          actionText: 'View Application Timeline',
        };
      case 'COMAKER_REQUEST':
        return {
          icon: <UserCheck className="w-4 h-4 text-amber-600" />,
          pill: 'bg-amber-50 text-amber-800 border-amber-200',
          border: 'border-l-4 border-l-amber-500',
          label: 'Co-Maker Request',
          actionText: 'Review Undertaking & Sign',
        };
      case 'UPCOMING_PAYMENT':
        return {
          icon: <Clock className="w-4 h-4 text-rose-600" />,
          pill: 'bg-rose-50 text-rose-700 border-rose-200',
          border: 'border-l-4 border-l-rose-500',
          label: 'Upcoming Payment',
          actionText: 'View Repayment Schedule',
        };
      case 'PAYMENT_CREDITED':
        return {
          icon: <Receipt className="w-4 h-4 text-teal-600" />,
          pill: 'bg-teal-50 text-teal-700 border-teal-200',
          border: 'border-l-4 border-l-teal-500',
          label: 'Payment Credited',
          actionText: 'View Loan Ledger',
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-blue-600" />,
          pill: 'bg-blue-50 text-blue-700 border-blue-200',
          border: 'border-l-4 border-l-blue-500',
          label: 'System Alert',
          actionText: 'View Details',
        };
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-center-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="notification-center-title" className="text-base font-bold text-white tracking-tight">
                  In-App Notification Center
                </h3>
                {counts.unread > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                    {counts.unread} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Active alerts for <strong className="text-amber-400">{currentUser.name}</strong> ({currentUser.role.replace(/_/g, ' ')})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {counts.unread > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Mark All Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Simulation Testing Bar (allows instant testing of all notification categories) */}
        <div className="bg-amber-50/80 px-4 py-3 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Simulate Live In-App Alerts:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => sendTestNotification('LOAN_STATUS', currentUser.employeeId)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              + Loan Status
            </button>
            <button
              onClick={() => sendTestNotification('COMAKER_REQUEST', currentUser.employeeId)}
              className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-md font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
            >
              <UserCheck className="w-3 h-3 text-amber-600" />
              + Co-Maker Request
            </button>
            <button
              onClick={() => sendTestNotification('UPCOMING_PAYMENT', currentUser.employeeId)}
              className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 rounded-md font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Clock className="w-3 h-3 text-rose-600" />
              + Upcoming Payment
            </button>
            <button
              onClick={() => sendTestNotification('PAYMENT_CREDITED', currentUser.employeeId)}
              className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-md font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Receipt className="w-3 h-3 text-teal-600" />
              + Credited
            </button>
          </div>
        </div>

        {/* Gmail Delivery & OTP Verification Strip */}
        <div className="bg-slate-900 text-white px-4 py-2.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <Mail className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300 text-[11px] truncate">
              Registered Notification Gmail: <strong className="text-white font-mono">{registeredGmail}</strong>
            </span>
            {isGmailVerified ? (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                VERIFIED
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                UNVERIFIED
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                onClose();
                openGmailOtpModal({ defaultTab: 'OTP', defaultPurpose: 'Notification Recipient Verification' });
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3 h-3" />
              <span>Send Gmail OTP to Verify</span>
            </button>
            <button
              onClick={() => {
                onClose();
                openGmailOtpModal({ defaultTab: 'NOTIF' });
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-md text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Mail className="w-3 h-3 text-amber-400" />
              <span>Dispatch Gmail Alerts</span>
            </button>
          </div>
        </div>

        {/* Filters & Tabs Strip */}
        <div className="p-3 sm:px-5 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
              <button
                onClick={() => setFilterCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  filterCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                All Alerts ({counts.all})
              </button>
              <button
                onClick={() => setFilterCategory('LOAN_STATUS')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterCategory === 'LOAN_STATUS'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Loan Status ({counts.loanStatus})
              </button>
              <button
                onClick={() => setFilterCategory('COMAKER_REQUEST')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterCategory === 'COMAKER_REQUEST'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Co-Maker Requests ({counts.coMaker})
              </button>
              <button
                onClick={() => setFilterCategory('UPCOMING_PAYMENT')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterCategory === 'UPCOMING_PAYMENT'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Upcoming Payments ({counts.upcomingPayment})
              </button>
            </div>

            {/* Scope Toggle (My Alerts vs All System) */}
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={e => setUnreadOnly(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                />
                <span>Unread only</span>
              </label>

              <span className="text-slate-300">|</span>

              <select
                value={viewScope}
                onChange={e => setViewScope(e.target.value as any)}
                className="text-xs bg-white border border-slate-300 rounded-md px-2 py-1 font-medium text-slate-700"
              >
                <option value="MY_ALERTS">My Persona Alerts</option>
                <option value="ALL_SYSTEM">All Organization Alerts</option>
              </select>
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter alerts by keyword, application #, employee name, or amount..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-100">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No notifications found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {unreadOnly
                  ? 'All notifications in this category have been marked as read.'
                  : 'No notification records match your selected filters. Use the simulation buttons above to trigger live test alerts.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notif => {
              const cfg = getCategoryConfig(notif.category);
              return (
                <div
                  key={notif.id}
                  className={`pt-3 first:pt-0 transition-all ${
                    !notif.read ? 'bg-amber-50/30 -mx-2 px-2 py-3 rounded-xl' : ''
                  }`}
                >
                  <div
                    className={`bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition-all ${cfg.border}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                          {cfg.icon}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.pill}`}
                            >
                              {cfg.label}
                            </span>

                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-200" />
                            )}

                            {notif.actorName && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                From: <strong className="text-slate-700">{notif.actorName}</strong>
                              </span>
                            )}

                            {notif.relatedId && (
                              <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {notif.relatedId}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {notif.title}
                          </h4>

                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {notif.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Bottom toolbar for item */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {notif.read ? (
                          <button
                            onClick={() => {
                              // Toggle read
                              markNotificationRead(notif.id);
                            }}
                            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            Marked as read
                          </button>
                        ) : (
                          <button
                            onClick={() => markNotificationRead(notif.id)}
                            className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Mark as read
                          </button>
                        )}

                        <span className="text-slate-200">·</span>

                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>

                      {notif.linkAction && (
                        <button
                          onClick={() => handleNotificationAction(notif)}
                          className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-2xs active:scale-95"
                        >
                          <span>{cfg.actionText}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Real-time notifications sync across organizational hierarchy & employee portal
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
