import React, { useState } from 'react';
import {
  DayOfWeek,
  DAY_FULL_NAMES,
  HabitItem,
  TaskItem,
  ThemeConfig,
  WakeAlarmItem,
  WakeChallengeType,
} from '../types';
import {
  Bell,
  Clock,
  Trash2,
  X,
  Volume2,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Edit2,
  Play,
  Calculator,
  Brain,
  Type,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import {
  formatTime12h,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  triggerSystemNotification,
} from '../utils/notificationService';
import { playReminderChime } from '../utils/audio';
import { WakeAlarmEditorModal } from './WakeAlarmEditorModal';

interface RemindersCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasksByDay: Record<DayOfWeek, TaskItem[]>;
  habits: HabitItem[];
  theme: ThemeConfig;
  onUpdateTaskReminder: (day: DayOfWeek, taskId: string, enabled: boolean) => void;
  onDeleteTaskReminder: (day: DayOfWeek, taskId: string) => void;
  onUpdateHabitReminder: (habitId: string, enabled: boolean) => void;
  onDeleteHabitReminder: (habitId: string) => void;
  wakeAlarms?: WakeAlarmItem[];
  onSaveWakeAlarm?: (alarm: WakeAlarmItem) => void;
  onToggleWakeAlarm?: (id: string) => void;
  onDeleteWakeAlarm?: (id: string) => void;
  onTestWakeAlarm?: (alarm: WakeAlarmItem) => void;
}

export const RemindersCenterModal: React.FC<RemindersCenterModalProps> = ({
  isOpen,
  onClose,
  tasksByDay,
  habits,
  onUpdateTaskReminder,
  onDeleteTaskReminder,
  onUpdateHabitReminder,
  onDeleteHabitReminder,
  wakeAlarms = [],
  onSaveWakeAlarm,
  onToggleWakeAlarm,
  onDeleteWakeAlarm,
  onTestWakeAlarm,
}) => {
  const [activeTab, setActiveTab] = useState<'alarms' | 'reminders'>('alarms');
  const [permissionStatus, setPermissionStatus] = useState(getNotificationPermissionStatus());
  const [testTriggered, setTestTriggered] = useState(false);

  // Alarm editor modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<WakeAlarmItem | null>(null);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const status = await requestNotificationPermission();
    setPermissionStatus(status);
  };

  const handleTestChime = () => {
    playReminderChime();
    triggerSystemNotification(
      'Test Notification',
      'Your planner reminder chime and notifications are operational.'
    );
    setTestTriggered(true);
    setTimeout(() => setTestTriggered(false), 2500);
  };

  // Collect all task reminders
  const taskRemindersList: { day: DayOfWeek; task: TaskItem }[] = [];
  (Object.keys(tasksByDay) as DayOfWeek[]).forEach((day) => {
    (tasksByDay[day] || []).forEach((task) => {
      if (task.reminder) {
        taskRemindersList.push({ day, task });
      }
    });
  });

  // Collect all habit reminders
  const habitRemindersList: HabitItem[] = habits.filter((h) => !!h.reminder);
  const totalReminders = taskRemindersList.length + habitRemindersList.length;
  const activeAlarmsCount = wakeAlarms.filter((a) => a.enabled).length;

  const getChallengeIcon = (type: WakeChallengeType) => {
    switch (type) {
      case 'math':
        return <Calculator className="w-3.5 h-3.5 text-amber-500" />;
      case 'memory':
        return <Brain className="w-3.5 h-3.5 text-sky-400" />;
      case 'type_phrase':
        return <Type className="w-3.5 h-3.5 text-emerald-400" />;
      case 'vocabulary':
        return <BookOpen className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getChallengeLabel = (type: WakeChallengeType) => {
    switch (type) {
      case 'math':
        return 'Math';
      case 'memory':
        return 'Memory';
      case 'type_phrase':
        return 'Phrase';
      case 'vocabulary':
        return 'Vocab';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
        <div className="w-full max-w-2xl max-h-[90vh] bg-[#FDFBF7] dark:bg-[#1C1814] border border-[#D8CFBF] dark:border-[#3D3429] rounded-2xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] flex flex-col gap-4 overflow-hidden text-stone-900 dark:text-stone-100">
          {/* Modal Header */}
          <div className="flex items-start justify-between border-b border-[#E8DFC8] dark:border-[#2E271F] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#1C1917] dark:bg-[#25201A] text-[#D4AF37] shadow-xs border border-[#D4AF37]/30">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-[#FDFBF7] tracking-tight">
                  Alarms & Reminders Center
                </h3>
                <p className="text-xs font-sans text-stone-500 dark:text-stone-400">
                  Wake Challenge Alarms & scheduled routine alerts
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-lg border border-[#D8CFBF] dark:border-[#3D3429] bg-white dark:bg-[#25201A] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer shadow-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented Tab Bar */}
          <div className="flex items-center p-1 rounded-xl bg-stone-200/70 dark:bg-[#15120F] border border-[#D8CFBF] dark:border-[#332A20]">
            <button
              type="button"
              onClick={() => setActiveTab('alarms')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-serif font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === 'alarms'
                  ? 'bg-white dark:bg-[#27211B] text-stone-900 dark:text-[#D4AF37] shadow-xs border border-transparent dark:border-[#4A3D2F]'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Wake Challenge Alarms</span>
              {activeAlarmsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-[#1C1917] dark:bg-[#D4AF37] text-[#D4AF37] dark:text-[#1C1917]">
                  {activeAlarmsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reminders')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-serif font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === 'reminders'
                  ? 'bg-white dark:bg-[#27211B] text-stone-900 dark:text-[#D4AF37] shadow-xs border border-transparent dark:border-[#4A3D2F]'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Task & Habit Reminders</span>
              {totalReminders > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-stone-300 dark:bg-[#3D3429] text-stone-800 dark:text-stone-200">
                  {totalReminders}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: WAKE CHALLENGE ALARMS */}
          {activeTab === 'alarms' && (
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    Wake Alarms ({wakeAlarms.length})
                  </span>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
                    Requires solving an active challenge before dismissing
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAlarm(null);
                    setIsEditorOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#B88939] to-[#D4AF37] text-stone-950 text-xs font-serif font-bold uppercase tracking-wider shadow-sm hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>New Alarm</span>
                </button>
              </div>

              {/* Alarms List */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[50vh]">
                {wakeAlarms.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 dark:text-stone-500 flex flex-col items-center gap-2.5 bg-stone-50/50 dark:bg-[#181410] rounded-xl border border-dashed border-[#D8CFBF] dark:border-[#382E23] p-6">
                    <div className="p-3 rounded-full bg-amber-500/10 text-amber-500">
                      <Clock className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-serif font-bold text-stone-700 dark:text-stone-200">
                      No wake challenge alarms scheduled yet
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm">
                      Create an alarm with Math, Memory, Phrase, or Vocabulary challenges to ensure you wake up alert and energized.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAlarm(null);
                        setIsEditorOpen(true);
                      }}
                      className="mt-2 px-4 py-2 rounded-lg bg-[#1C1917] dark:bg-[#D4AF37] text-[#D4AF37] dark:text-[#1C1917] text-xs font-serif font-bold uppercase tracking-wider cursor-pointer"
                    >
                      + Create First Wake Alarm
                    </button>
                  </div>
                ) : (
                  wakeAlarms.map((alarm) => (
                    <div
                      key={alarm.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all shadow-xs ${
                        alarm.enabled
                          ? 'bg-white dark:bg-[#241F1A] border-[#D8CFBF] dark:border-[#3E3427]'
                          : 'bg-stone-50 dark:bg-[#1A1612] border-stone-200 dark:border-[#2C241D] opacity-75'
                      }`}
                    >
                      {/* Left: Time & Details */}
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div
                          className={`p-2.5 rounded-xl font-mono text-center shrink-0 border ${
                            alarm.enabled
                              ? 'bg-[#1C1917] dark:bg-[#17130F] text-[#D4AF37] border-amber-600/40 shadow-xs'
                              : 'bg-stone-200 dark:bg-stone-800 text-stone-500 border-transparent'
                          }`}
                        >
                          <div className="text-lg font-black leading-none">
                            {formatTime12h(alarm.time).split(' ')[0]}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-80">
                            {formatTime12h(alarm.time).split(' ')[1]}
                          </div>
                        </div>

                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-serif font-bold text-stone-900 dark:text-[#FDFBF7]">
                              {alarm.label}
                            </h4>

                            {/* Challenge Badge */}
                            <span className="inline-flex items-center gap-1 text-[10px] font-serif font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/40">
                              {getChallengeIcon(alarm.challengeType)}
                              <span>{getChallengeLabel(alarm.challengeType)}</span>
                              <span className="text-[9px] opacity-75">({alarm.difficulty})</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 mt-1 flex-wrap">
                            <span>
                              {alarm.repeatDays.length === 0
                                ? 'Once'
                                : alarm.repeatDays.length === 7
                                ? 'Everyday'
                                : alarm.repeatDays.join(', ')}
                            </span>
                            <span>•</span>
                            <span className="capitalize truncate max-w-[140px]">
                              {alarm.sound === 'custom'
                                ? alarm.customSoundName || 'Custom Sound'
                                : alarm.sound === 'wake_up_motivation'
                                ? 'Wake Up — Motivation'
                                : alarm.sound.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200 dark:border-stone-800">
                        {/* Test Challenge Button */}
                        {onTestWakeAlarm && (
                          <button
                            type="button"
                            onClick={() => onTestWakeAlarm(alarm)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/40 text-[11px] font-serif font-bold uppercase tracking-wide cursor-pointer transition-colors"
                            title="Test this alarm and its Wake Challenge right now"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Test</span>
                          </button>
                        )}

                        {/* Toggle On/Off */}
                        {onToggleWakeAlarm && (
                          <button
                            type="button"
                            onClick={() => onToggleWakeAlarm(alarm.id)}
                            className={`px-3 py-1.5 text-[11px] font-serif font-bold uppercase rounded-lg border cursor-pointer transition-all ${
                              alarm.enabled
                                ? 'bg-[#1C1917] dark:bg-[#D4AF37] text-[#D4AF37] dark:text-[#1C1917] border-amber-600/40 shadow-xs'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-300 dark:border-stone-700'
                            }`}
                          >
                            {alarm.enabled ? 'On' : 'Off'}
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAlarm(alarm);
                            setIsEditorOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                          title="Edit alarm"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        {onDeleteWakeAlarm && (
                          <button
                            type="button"
                            onClick={() => onDeleteWakeAlarm(alarm.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                            title="Delete alarm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TASK & HABIT REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              {/* System Permission & Test Controls Bar */}
              <div className="p-3.5 rounded-xl border border-[#D8CFBF] dark:border-[#3D3429] bg-white dark:bg-[#241F1A] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  {permissionStatus === 'granted' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )}
                  <div className="text-xs">
                    <span className="font-semibold text-stone-900 dark:text-stone-100 block">
                      Browser Notifications: {permissionStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {permissionStatus !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="px-3 py-1.5 bg-[#1C1917] dark:bg-[#D4AF37] text-[#D4AF37] dark:text-[#1C1917] text-xs font-serif font-bold uppercase rounded-lg cursor-pointer"
                    >
                      Enable Notifications
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleTestChime}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 dark:bg-[#1A1612] hover:bg-stone-100 dark:hover:bg-stone-800 border border-[#D8CFBF] dark:border-[#3D3429] text-stone-800 dark:text-stone-200 text-xs font-serif font-bold uppercase rounded-lg cursor-pointer transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#B88939]" />
                    <span>{testTriggered ? 'Chime Playing!' : 'Test Sound'}</span>
                  </button>
                </div>
              </div>

              {/* Scrollable list of active reminders */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[50vh]">
                {totalReminders === 0 ? (
                  <div className="py-12 text-center text-stone-400 dark:text-stone-500 flex flex-col items-center gap-2">
                    <Clock className="w-8 h-8 stroke-1 text-stone-300 dark:text-stone-600" />
                    <p className="text-sm font-serif font-semibold text-stone-700 dark:text-stone-300">
                      No active task or habit reminders configured yet.
                    </p>
                    <p className="text-xs font-sans text-stone-500 dark:text-stone-400">
                      Click the clock icon next to any task or habit row in your weekly planner to schedule a reminder.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Task Reminders */}
                    {taskRemindersList.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                          Task Reminders ({taskRemindersList.length})
                        </span>
                        <div className="space-y-2">
                          {taskRemindersList.map(({ day, task }) => (
                            <div
                              key={`${day}-${task.id}`}
                              className="p-3 bg-white dark:bg-[#241F1A] border border-[#D8CFBF] dark:border-[#3D3429] rounded-xl flex items-center justify-between gap-3 shadow-xs"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 rounded-lg bg-[#1C1917] text-[#D4AF37] font-mono text-xs font-bold shrink-0">
                                  {formatTime12h(task.reminder!.time)}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 truncate">
                                    {task.text}
                                  </p>
                                  <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                                    <span>
                                      {task.reminder!.isRecurring ? 'Daily recurring' : DAY_FULL_NAMES[day]}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onUpdateTaskReminder(day, task.id, !task.reminder!.enabled)}
                                  className={`px-2.5 py-1 text-[11px] font-serif font-bold uppercase rounded-lg border ${
                                    task.reminder!.enabled
                                      ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/30'
                                      : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-300 dark:border-stone-700'
                                  }`}
                                >
                                  {task.reminder!.enabled ? 'Active' : 'Muted'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteTaskReminder(day, task.id)}
                                  className="p-1.5 text-stone-400 hover:text-red-700 dark:hover:text-red-400 cursor-pointer"
                                  title="Remove reminder"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Habit Reminders */}
                    {habitRemindersList.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                          Habit Reminders ({habitRemindersList.length})
                        </span>
                        <div className="space-y-2">
                          {habitRemindersList.map((habit) => (
                            <div
                              key={habit.id}
                              className="p-3 bg-white dark:bg-[#241F1A] border border-[#D8CFBF] dark:border-[#3D3429] rounded-xl flex items-center justify-between gap-3 shadow-xs"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 rounded-lg bg-[#1C1917] text-[#D4AF37] font-mono text-xs font-bold shrink-0">
                                  {formatTime12h(habit.reminder!.time)}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 truncate">
                                    {habit.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                                    <span>
                                      {habit.reminder!.isRecurring
                                        ? 'Daily recurring'
                                        : DAY_FULL_NAMES[habit.reminder!.day || 'Mon']}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onUpdateHabitReminder(habit.id, !habit.reminder!.enabled)}
                                  className={`px-2.5 py-1 text-[11px] font-serif font-bold uppercase rounded-lg border ${
                                    habit.reminder!.enabled
                                      ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/30'
                                      : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-300 dark:border-stone-700'
                                  }`}
                                >
                                  {habit.reminder!.enabled ? 'Active' : 'Muted'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteHabitReminder(habit.id)}
                                  className="p-1.5 text-stone-400 hover:text-red-700 dark:hover:text-red-400 cursor-pointer"
                                  title="Remove reminder"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wake Alarm Creator / Editor Modal */}
      {isEditorOpen && (
        <WakeAlarmEditorModal
          isOpen={isEditorOpen}
          initialAlarm={editingAlarm}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingAlarm(null);
          }}
          onSave={(alarm) => {
            if (onSaveWakeAlarm) {
              onSaveWakeAlarm(alarm);
            }
            setIsEditorOpen(false);
            setEditingAlarm(null);
          }}
        />
      )}
    </>
  );
};
