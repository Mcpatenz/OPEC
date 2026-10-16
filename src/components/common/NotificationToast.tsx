import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
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
} from 'lucide-react';

interface NotificationToastProps {
  setActiveTab?: (tab: string) => void;
  onOpenNotificationsModal?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  setActiveTab,
  onOpenNotificationsModal,
}) => {
  const { latestToast, dismissToast, markNotificationRead } = useApp();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!latestToast) return;

    setProgress(100);
    const duration = 6000; // 6 seconds
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          if (prev <= step) {
            clearInterval(timer);
            dismissToast();
            return 0;
          }
          return prev - step;
        });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [latestToast, isPaused, dismissToast]);

  if (!latestToast) return null;

  const handleAction = () => {
    markNotificationRead(latestToast.id);
    dismissToast();
    if (latestToast.linkAction && setActiveTab) {
      setActiveTab(latestToast.linkAction);
    } else if (onOpenNotificationsModal) {
      onOpenNotificationsModal();
    }
  };

  const getCategoryTheme = () => {
    switch (latestToast.category) {
      case 'LOAN_STATUS':
        return {
          bg: 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          accent: 'bg-emerald-500',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />,
          label: 'Loan Status Update',
        };
      case 'COMAKER_REQUEST':
        return {
          bg: 'bg-amber-950/95 border-amber-500/40 text-amber-100',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          accent: 'bg-amber-500',
          icon: <UserCheck className="w-5 h-5 text-amber-400 shrink-0" />,
          label: 'Co-Maker Request Received',
        };
      case 'UPCOMING_PAYMENT':
        return {
          bg: 'bg-rose-950/95 border-rose-500/40 text-rose-100',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          accent: 'bg-rose-500',
          icon: <Clock className="w-5 h-5 text-rose-400 shrink-0" />,
          label: 'Upcoming Payment Alert',
        };
      case 'PAYMENT_CREDITED':
        return {
          bg: 'bg-teal-950/95 border-teal-500/40 text-teal-100',
          badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
          accent: 'bg-teal-500',
          icon: <Receipt className="w-5 h-5 text-teal-400 shrink-0" />,
          label: 'Payment Credited',
        };
      default:
        return {
          bg: 'bg-slate-900/95 border-slate-700 text-slate-100',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          accent: 'bg-amber-500',
          icon: <Bell className="w-5 h-5 text-amber-400 shrink-0" />,
          label: 'System Notification',
        };
    }
  };

  const theme = getCategoryTheme();

  return (
    <div
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="fixed bottom-22 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full px-2 sm:px-0 animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div
        className={`${theme.bg} rounded-2xl border backdrop-blur-md shadow-2xl p-4 text-xs overflow-hidden relative transition-all`}
      >
        {/* Progress bar countdown */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/20">
          <div
            className={`h-full ${theme.accent} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-start gap-3 mt-1">
          <div className="p-2 rounded-xl bg-black/30 border border-white/10 shrink-0">
            {theme.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.badge} inline-flex items-center gap-1`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                {theme.label}
              </span>
              <button
                onClick={dismissToast}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                title="Dismiss"
                aria-label="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <h4 className="font-bold text-sm text-white leading-snug line-clamp-1">
              {latestToast.title}
            </h4>
            <p className="mt-1 text-slate-300 text-[11px] leading-relaxed line-clamp-3">
              {latestToast.message}
            </p>

            {/* Quick Actions */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">
                {latestToast.timestamp.split(' ')[1] || 'Just now'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    markNotificationRead(latestToast.id);
                    dismissToast();
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Mark read
                </button>
                <button
                  onClick={handleAction}
                  className="flex items-center gap-1 px-3 py-1 bg-white text-slate-950 hover:bg-slate-100 font-bold rounded-lg text-[11px] transition-all active:scale-95 shadow-sm"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
