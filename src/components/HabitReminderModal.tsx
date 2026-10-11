import React, { useState } from 'react';
import { DayOfWeek, DAYS_OF_WEEK, DAY_FULL_NAMES, HabitItem, HabitReminder, ThemeConfig } from '../types';
import { Bell, Clock, Repeat, Calendar, Trash2, Check, X, ShieldAlert } from 'lucide-react';
import { formatTime12h, getNotificationPermissionStatus, requestNotificationPermission } from '../utils/notificationService';

interface HabitReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: HabitItem;
  theme: ThemeConfig;
  onSaveReminder: (habitId: string, reminder: HabitReminder | undefined) => void;
}

const TIME_PRESETS = [
  { label: '07:00 AM', value: '07:00' },
  { label: '08:30 AM', value: '08:30' },
  { label: '12:00 PM', value: '12:00' },
  { label: '06:00 PM', value: '18:00' },
  { label: '09:00 PM', value: '21:00' },
  { label: '10:30 PM', value: '22:30' },
];

export const HabitReminderModal: React.FC<HabitReminderModalProps> = ({
  isOpen,
  onClose,
  habit,
  theme,
  onSaveReminder,
}) => {
  const existing = habit.reminder;
  const [time, setTime] = useState<string>(existing?.time || '08:00');
  const [isRecurring, setIsRecurring] = useState<boolean>(existing?.isRecurring ?? true);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(existing?.day || 'Mon');
  const [enabled, setEnabled] = useState<boolean>(existing?.enabled ?? true);
  const [permissionStatus, setPermissionStatus] = useState(getNotificationPermissionStatus());

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const status = await requestNotificationPermission();
    setPermissionStatus(status);
  };

  const handleSave = () => {
    if (!time) return;
    const reminder: HabitReminder = {
      time,
      isRecurring,
      day: isRecurring ? undefined : selectedDay,
      enabled,
    };
    onSaveReminder(habit.id, reminder);
    onClose();
  };

  const handleRemove = () => {
    onSaveReminder(habit.id, undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#1C1917] border-[4px] border-black dark:border-[#3D352B] p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 text-black dark:text-stone-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-black dark:border-[#3D352B] pb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 border-2 border-black dark:border-[#3D352B] ${theme.accentBg} ${theme.accentText}`}>
              <Bell className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-black dark:text-stone-100">
                Habit Reminder
              </h3>
              <p className="text-[10px] font-bold uppercase text-neutral-600 dark:text-stone-400">
                Habit: {habit.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 border-2 border-black dark:border-[#3D352B] bg-white dark:bg-[#24201C] text-black dark:text-stone-200 hover:bg-black hover:text-white dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Browser Permission Alert */}
        {permissionStatus !== 'granted' && (
          <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 border-2 border-black dark:border-[#3D352B] flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-black uppercase text-amber-950 dark:text-amber-200 text-[10px]">
              <ShieldAlert className="w-4 h-4 stroke-[2.5] text-amber-700 dark:text-amber-400 flex-shrink-0" />
              <span>Allow notifications for popups & audio alarms</span>
            </div>
            <button
              type="button"
              onClick={handleRequestPermission}
              className="text-[9px] font-black uppercase py-1 px-2 bg-black dark:bg-[#2A241F] text-white dark:text-[#D4AF37] border border-black dark:border-[#3D352B] hover:bg-neutral-800 cursor-pointer whitespace-nowrap"
            >
              Enable
            </button>
          </div>
        )}

        {/* Time Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-black dark:text-stone-200">
            <Clock className="w-3.5 h-3.5 stroke-[3]" />
            <span>Reminder Time: {formatTime12h(time)}</span>
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full text-base font-black bg-[#EEE] dark:bg-[#24201C] border-2 border-black dark:border-[#3D352B] p-2 text-black dark:text-stone-100 focus:outline-none focus:bg-white dark:focus:bg-[#1A1816] focus:ring-2 focus:ring-black cursor-pointer"
          />

          {/* Quick presets */}
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setTime(preset.value)}
                className={`py-1 px-1.5 text-[10px] font-black uppercase border border-black dark:border-[#3D352B] transition-colors ${
                  time === preset.value
                    ? 'bg-black text-white dark:bg-[#2A241F] dark:text-[#D4AF37]'
                    : 'bg-neutral-100 dark:bg-[#24201C] hover:bg-neutral-200 dark:hover:bg-stone-800 text-black dark:text-stone-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recurrence Choice */}
        <div className="flex flex-col gap-2 border-t-2 border-black dark:border-[#3D352B] pt-3">
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-black dark:text-stone-200">
            <Repeat className="w-3.5 h-3.5 stroke-[3]" />
            <span>Frequency & Recurrence</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsRecurring(true)}
              className={`p-2 border-2 border-black dark:border-[#3D352B] text-left flex flex-col gap-0.5 cursor-pointer transition-all ${
                isRecurring
                  ? `${theme.accentBg} ${theme.accentText} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`
                  : 'bg-neutral-50 dark:bg-[#24201C] text-black dark:text-stone-200 hover:bg-neutral-100 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-1 text-[11px] font-black uppercase">
                <Repeat className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Recurring Daily</span>
              </div>
              <span className="text-[9px] font-bold opacity-80 uppercase">
                Everyday (Mon — Sun)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsRecurring(false)}
              className={`p-2 border-2 border-black dark:border-[#3D352B] text-left flex flex-col gap-0.5 cursor-pointer transition-all ${
                !isRecurring
                  ? `${theme.accentBg} ${theme.accentText} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`
                  : 'bg-neutral-50 dark:bg-[#24201C] text-black dark:text-stone-200 hover:bg-neutral-100 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-1 text-[11px] font-black uppercase">
                <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Specific Day</span>
              </div>
              <span className="text-[9px] font-bold opacity-80 uppercase">
                Select single target day
              </span>
            </button>
          </div>

          {/* If specific day chosen, show 7 day selectors */}
          {!isRecurring && (
            <div className="flex flex-col gap-1 mt-1 bg-neutral-50 dark:bg-[#24201C] border-2 border-black dark:border-[#3D352B] p-2">
              <span className="text-[9px] font-black uppercase text-neutral-600 dark:text-stone-400">
                Choose Day of Week:
              </span>
              <div className="grid grid-cols-7 gap-1">
                {DAYS_OF_WEEK.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDay(d)}
                    className={`py-1 text-[10px] font-black uppercase border border-black dark:border-[#3D352B] transition-colors ${
                      selectedDay === d
                        ? 'bg-black text-white dark:bg-[#2A241F] dark:text-[#D4AF37]'
                        : 'bg-white dark:bg-[#1A1816] text-black dark:text-stone-200 hover:bg-neutral-200 dark:hover:bg-stone-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between border-t-2 border-black dark:border-[#3D352B] pt-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-black dark:text-stone-200">
            Reminder Status
          </span>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`px-2.5 py-1 text-[10px] font-black uppercase border-2 border-black dark:border-[#3D352B] cursor-pointer transition-colors ${
              enabled ? 'bg-emerald-400 text-black dark:bg-emerald-900/60 dark:text-emerald-200' : 'bg-neutral-200 dark:bg-stone-800 text-neutral-600 dark:text-stone-400'
            }`}
          >
            {enabled ? 'Active / Enabled' : 'Paused / Disabled'}
          </button>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between gap-2 border-t-2 border-black dark:border-[#3D352B] pt-3 mt-1">
          {existing ? (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1 text-xs font-black uppercase py-2 px-3 bg-white dark:bg-[#24201C] text-rose-600 dark:text-rose-400 border-2 border-black dark:border-[#3D352B] hover:bg-rose-600 hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[3]" />
              <span>Remove</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-black uppercase py-2 px-3 bg-neutral-100 dark:bg-[#24201C] text-black dark:text-stone-200 border-2 border-black dark:border-[#3D352B] hover:bg-neutral-200 dark:hover:bg-stone-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-1 text-xs font-black uppercase py-2 px-4 border-2 border-black dark:border-[#3D352B] ${theme.accentBg} ${theme.accentText} hover:invert shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Save Reminder</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
