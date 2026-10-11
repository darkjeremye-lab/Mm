import React from 'react';
import { TriggeredReminderAlert, ThemeConfig } from '../types';
import { Bell, CheckCircle2, Clock, X } from 'lucide-react';
import { formatTime12h } from '../utils/notificationService';

interface TriggeredAlertBannerProps {
  alerts: TriggeredReminderAlert[];
  theme: ThemeConfig;
  onDismiss: (alertId: string) => void;
  onCompleteTask?: (day: string, taskId: string) => void;
  onSnooze: (alert: TriggeredReminderAlert) => void;
}

export const TriggeredAlertBanner: React.FC<TriggeredAlertBannerProps> = ({
  alerts,
  onDismiss,
  onCompleteTask,
  onSnooze,
}) => {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-200">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-4 shadow-[0_12px_36px_rgba(20,18,15,0.2)] flex flex-col gap-2 relative overflow-hidden text-stone-900 dark:text-stone-100"
        >
          {/* Top highlight bar */}
          <div className="flex items-start justify-between gap-2 border-b border-[#E8DFC8] dark:border-[#2E2820] pb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-[#1C1917] text-[#D4AF37] shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                  ALARM • {formatTime12h(alert.time)}
                </span>
                <h4 className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight mt-1">
                  {alert.title}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              aria-label="Dismiss alert"
              className="p-1 rounded text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs font-sans text-stone-600 dark:text-stone-300">
            {alert.subtitle}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-1">
            {alert.type === 'task' && alert.day && alert.taskId && onCompleteTask && (
              <button
                type="button"
                onClick={() => {
                  onCompleteTask(alert.day!, alert.taskId!);
                  onDismiss(alert.id);
                }}
                className="flex-1 flex items-center justify-center gap-1 text-[11px] font-serif font-bold uppercase py-1.5 px-2.5 rounded bg-[#1C1917] text-[#D4AF37] border border-amber-900/30 hover:bg-stone-800 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark Done</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSnooze(alert)}
              className="flex items-center justify-center gap-1 text-[11px] font-serif font-bold uppercase py-1.5 px-2.5 rounded bg-white dark:bg-[#24201C] text-stone-800 dark:text-stone-200 border border-[#D8CFBF] dark:border-[#3D352B] hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer shadow-2xs active:scale-95"
            >
              <Clock className="w-3 h-3 text-[#B88939]" />
              <span>+5m Snooze</span>
            </button>

            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              className="text-[11px] font-serif font-bold uppercase py-1.5 px-2.5 rounded bg-white dark:bg-[#24201C] text-stone-600 dark:text-stone-300 border border-[#D8CFBF] dark:border-[#3D352B] hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
