import React, { useState, useEffect, useRef } from 'react';
import {
  DayOfWeek,
  DAYS_OF_WEEK,
  DAY_FULL_NAMES,
  AcademicSubject,
  TaskPriority,
  TaskRecurrence,
  RecurrenceFrequency,
  TaskReminder,
  ThemeConfig,
} from '../types';
import {
  X,
  Zap,
  CheckCircle2,
  BookOpen,
  Calendar,
  Clock,
  Plus,
  Sparkles,
  Bell,
  Repeat,
  Check,
  Flame,
} from 'lucide-react';
import { getCurrentDayOfWeek } from '../utils/notificationService';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayDates: Record<DayOfWeek, { label: string; fullDate: string; isToday: boolean }>;
  subjects: AcademicSubject[];
  theme: ThemeConfig;
  onAddTask: (
    day: DayOfWeek,
    text: string,
    options?:
      | {
          priority?: TaskPriority;
          duration?: string;
          recurrence?: TaskRecurrence;
          reminder?: TaskReminder;
        }
      | TaskReminder
  ) => void;
  onLogStudyHours: (subjectId: string, day: DayOfWeek, additionalHours: number, note?: string) => void;
  onAddSubject?: (name: string, weeklyTargetHours: number, color: string) => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  dayDates,
  subjects,
  theme,
  onAddTask,
  onLogStudyHours,
  onAddSubject,
}) => {
  const [activeMode, setActiveMode] = useState<'task' | 'study'>('task');
  const todayDay = getCurrentDayOfWeek();

  // Task Form State
  const [selectedTaskDay, setSelectedTaskDay] = useState<DayOfWeek>(todayDay);
  const [taskText, setTaskText] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDuration, setTaskDuration] = useState<string>('');
  const [taskRecurrence, setTaskRecurrence] = useState<RecurrenceFrequency | 'none'>('none');
  const [customRecurrenceDays, setCustomRecurrenceDays] = useState<DayOfWeek[]>([todayDay]);
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [isRecurringReminder, setIsRecurringReminder] = useState(false);

  // Study Log Form State
  const [selectedStudySubjectId, setSelectedStudySubjectId] = useState<string>(
    subjects[0]?.id || ''
  );
  const [selectedStudyDay, setSelectedStudyDay] = useState<DayOfWeek>(todayDay);
  const [studyHours, setStudyHours] = useState<number>(1);
  const [studyNote, setStudyNote] = useState('');

  // Inline Quick Subject Creation (if no subjects exist)
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubTarget, setNewSubTarget] = useState('5');
  const [newSubColor, setNewSubColor] = useState('#2563EB');

  // Success Feedback Message
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const taskInputRef = useRef<HTMLInputElement>(null);

  // Reset inputs when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      setSelectedTaskDay(getCurrentDayOfWeek());
      setSelectedStudyDay(getCurrentDayOfWeek());
      if (subjects.length > 0 && !selectedStudySubjectId) {
        setSelectedStudySubjectId(subjects[0].id);
      }
      setTimeout(() => {
        taskInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (subjects.length > 0 && (!selectedStudySubjectId || !subjects.some(s => s.id === selectedStudySubjectId))) {
      setSelectedStudySubjectId(subjects[0].id);
    }
  }, [subjects, selectedStudySubjectId]);

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setSuccessToast(null);
    }, 3500);
  };

  if (!isOpen) return null;

  // Handle Quick Task Submission
  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    let reminder: TaskReminder | undefined = undefined;
    if (enableReminder) {
      reminder = {
        time: reminderTime,
        enabled: true,
        isRecurring: isRecurringReminder,
      };
    }

    onAddTask(selectedTaskDay, taskText.trim(), {
      priority: taskPriority,
      duration: taskDuration || undefined,
      recurrence:
        taskRecurrence === 'custom'
          ? { frequency: 'custom', days: customRecurrenceDays }
          : taskRecurrence !== 'none'
          ? { frequency: taskRecurrence }
          : undefined,
      reminder,
    });
    showSuccess(`Task added to ${DAY_FULL_NAMES[selectedTaskDay]}!`);
    setTaskText('');
    setTaskDuration('');
    setTaskPriority('medium');
    setTaskRecurrence('none');
    setEnableReminder(false);
    taskInputRef.current?.focus();
  };

  // Handle Quick Study Log Submission
  const handleStudySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudySubjectId || studyHours <= 0) return;

    const sub = subjects.find((s) => s.id === selectedStudySubjectId);
    onLogStudyHours(selectedStudySubjectId, selectedStudyDay, studyHours, studyNote.trim());
    
    showSuccess(`Logged +${studyHours}h to ${sub?.name || 'Subject'} on ${DAY_FULL_NAMES[selectedStudyDay]}!`);
    setStudyNote('');
  };

  // Handle Quick Subject Creation
  const handleCreateSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !onAddSubject) return;

    const target = parseFloat(newSubTarget) || 5;
    onAddSubject(newSubName.trim(), target, newSubColor);
    setNewSubName('');
    setIsCreatingSubject(false);
    showSuccess(`Subject "${newSubName.trim()}" created!`);
  };

  const selectedSubjectObj = subjects.find((s) => s.id === selectedStudySubjectId);

  return (
    <div
      id="quick-capture-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="quick-capture-modal-dialog"
        className="bg-[#FBF9F4] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl max-w-xl w-full shadow-[0_20px_50px_rgba(20,18,15,0.25)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-stone-900 dark:text-stone-100"
      >
        {/* 1. Modal Header with Tabs */}
        <div className="bg-[#1C1917] px-5 py-4 border-b border-[#38332E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-[#F5F2EB] tracking-wide">
                  Quick Capture
                </h2>
                <span className="text-[10px] font-sans font-bold uppercase px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                  Instant Entry
                </span>
              </div>
              <p className="text-xs text-stone-400 font-sans mt-0.5">
                Add daily tasks or log study hours without leaving your current view
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Quick Capture"
            className="p-1.5 text-stone-400 hover:text-[#F5F2EB] hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Mode Selector Bar (Task vs Study) */}
        <div className="bg-[#F3EFE6] dark:bg-[#231F1B] px-5 py-2.5 border-b border-[#D8CFBF] dark:border-[#3D352B] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-[#E7DFC8] dark:bg-[#1A1816] p-1 rounded-lg border border-[#D0C5AF] dark:border-[#3D352B]">
            <button
              type="button"
              onClick={() => {
                setActiveMode('task');
                setTimeout(() => taskInputRef.current?.focus(), 50);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-serif font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeMode === 'task'
                  ? 'bg-[#1C1917] text-[#D4AF37] shadow-sm'
                  : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Quick Task</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('study')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-serif font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeMode === 'study'
                  ? 'bg-[#1C1917] text-[#D4AF37] shadow-sm'
                  : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Log Study Hours</span>
            </button>
          </div>

          <span className="text-[11px] font-sans text-stone-500 dark:text-stone-400 hidden sm:inline">
            Shortcut: <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded text-[10px] font-mono text-stone-700 dark:text-stone-300 shadow-2xs">Esc</kbd> to close
          </span>
        </div>

        {/* 3. Real-Time Success Feedback Toast */}
        {successToast && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-lg flex items-center justify-between gap-2 text-emerald-900 dark:text-emerald-200 text-xs font-semibold animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-sans uppercase tracking-wider">Saved</span>
          </div>
        )}

        {/* 4. Form Content Area */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* ================= MODE 1: QUICK TASK ================= */}
          {activeMode === 'task' && (
            <form onSubmit={handleTaskSubmit} className="flex flex-col gap-4">
              {/* Day Selector Chips */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                    Select Day of the Week
                  </span>
                  <span className="text-[11px] font-sans text-stone-500 dark:text-stone-400 font-normal">
                    Scheduled for: {DAY_FULL_NAMES[selectedTaskDay]} ({dayDates[selectedTaskDay]?.label || selectedTaskDay})
                  </span>
                </label>

                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = selectedTaskDay === day;
                    const isToday = dayDates[day]?.isToday;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedTaskDay(day)}
                        className={`py-2 px-1 rounded-md text-xs font-serif font-bold uppercase border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/40 shadow-sm ring-1 ring-[#B88939]'
                            : 'bg-white dark:bg-[#24201C] border-[#D8CFBF] dark:border-[#3D352B] text-stone-800 dark:text-stone-200 hover:bg-[#F3EFE6] dark:hover:bg-stone-800 hover:border-stone-400'
                        }`}
                      >
                        <span>{day}</span>
                        {isToday && (
                          <span className={`text-[8px] font-sans font-bold px-1 rounded ${isSelected ? 'bg-[#D4AF37] text-stone-900' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'}`}>
                            Today
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Task Description Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="quick-capture-task-input" className="text-xs font-serif font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  Task Description
                </label>
                <input
                  id="quick-capture-task-input"
                  ref={taskInputRef}
                  type="text"
                  placeholder="e.g. Complete Organic Chemistry Lab Report, Read Chapter 4..."
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[#B88939] focus:border-[#B88939] shadow-xs"
                />
              </div>

              {/* Priority & Estimated Duration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Priority Selection */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    Priority
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => {
                      const isSelected = taskPriority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTaskPriority(p)}
                          className={`py-1.5 px-1 rounded text-[10px] font-serif font-bold uppercase border transition-all cursor-pointer ${
                            isSelected
                              ? p === 'urgent'
                                ? 'bg-red-700 text-white border-red-700 shadow-xs'
                                : p === 'high'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : p === 'low'
                                ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                                : 'bg-[#1C1917] text-[#D4AF37] border-amber-900/40 shadow-xs'
                              : 'bg-white dark:bg-[#24201C] border-[#D8CFBF] dark:border-[#3D352B] text-stone-700 dark:text-stone-300 hover:border-stone-400'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration Presets */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    Estimated Duration
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {['15 min', '30 min', '1 hour', '2 hours'].map((dur) => {
                      const isSelected = taskDuration === dur;
                      return (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setTaskDuration(isSelected ? '' : dur)}
                          className={`py-1.5 px-0.5 rounded text-[10px] font-sans font-semibold border transition-all truncate cursor-pointer ${
                            isSelected
                              ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/40 shadow-xs'
                              : 'bg-white dark:bg-[#24201C] border-[#D8CFBF] dark:border-[#3D352B] text-stone-700 dark:text-stone-300 hover:border-stone-400'
                          }`}
                        >
                          {dur}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recurrence Selection */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Repeat className="w-3 h-3 text-[#B88939]" />
                  Recurrence
                </span>
                <div className="grid grid-cols-5 gap-1">
                  {(['none', 'daily', 'weekdays', 'weekly', 'custom'] as const).map((r) => {
                    const isSelected = taskRecurrence === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTaskRecurrence(r)}
                        className={`py-1 px-1 rounded text-[10px] font-serif font-bold uppercase border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/40 shadow-xs'
                            : 'bg-white dark:bg-[#24201C] border-[#D8CFBF] dark:border-[#3D352B] text-stone-700 dark:text-stone-300 hover:border-stone-400'
                        }`}
                      >
                        {r === 'none' ? 'Once' : r}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Days Selector */}
                {taskRecurrence === 'custom' && (
                  <div className="flex items-center gap-1 flex-wrap mt-1 p-2 bg-[#F3EFE6] dark:bg-[#24201C] rounded-lg border border-[#D8CFBF] dark:border-[#3D352B]">
                    <span className="text-[10px] font-serif font-bold uppercase text-stone-500 mr-1">
                      Target Days:
                    </span>
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = customRecurrenceDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setCustomRecurrenceDays((prev) =>
                              prev.includes(d)
                                ? prev.length > 1
                                  ? prev.filter((item) => item !== d)
                                  : prev
                                : [...prev, d]
                            );
                          }}
                          className={`w-7 h-6 rounded text-[10px] font-serif font-bold uppercase transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1C1917] text-[#D4AF37] shadow-xs'
                              : 'bg-white dark:bg-[#1A1816] text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700'
                          }`}
                        >
                          {d.charAt(0)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Optional Reminder Setup */}
              <div className="bg-[#F8F5EE] dark:bg-[#24201C] border border-[#E0D7C9] dark:border-[#3D352B] rounded-lg p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${enableReminder ? 'text-amber-700 dark:text-[#D4AF37]' : 'text-stone-400'}`} />
                    <span className="text-xs font-serif font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      Schedule Time Reminder
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableReminder}
                      onChange={(e) => setEnableReminder(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-300 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1C1917]"></div>
                  </label>
                </div>

                {enableReminder && (
                  <div className="pt-2 border-t border-[#E8DFC9] dark:border-[#3D352B] flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="px-2.5 py-1 bg-white dark:bg-[#1A1816] border border-[#D8CFBF] dark:border-[#3D352B] rounded text-xs font-bold text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-[#B88939]"
                      />
                    </div>

                    {/* Quick presets */}
                    <div className="flex items-center gap-1">
                      {['09:00', '13:00', '17:00', '20:00'].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setReminderTime(time)}
                          className={`px-2 py-0.5 text-[10px] font-serif font-bold rounded border cursor-pointer ${
                            reminderTime === time
                              ? 'bg-[#1C1917] text-[#D4AF37] border-[#1C1917]'
                              : 'bg-white dark:bg-[#1A1816] text-stone-600 dark:text-stone-300 border-[#D8CFBF] dark:border-[#3D352B] hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>

                    <label className="flex items-center gap-1.5 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRecurringReminder}
                        onChange={(e) => setIsRecurringReminder(e.target.checked)}
                        className="rounded text-amber-700 focus:ring-0 cursor-pointer"
                      />
                      <Repeat className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                      <span>Repeat daily</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-serif font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 cursor-pointer"
                >
                  Done
                </button>
                <button
                  type="submit"
                  disabled={!taskText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1C1917] hover:bg-stone-800 disabled:opacity-50 text-[#D4AF37] text-xs font-serif font-bold uppercase tracking-wider border border-amber-900/30 active:scale-95 cursor-pointer shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task to {selectedTaskDay}</span>
                </button>
              </div>
            </form>
          )}

          {/* ================= MODE 2: STUDY HOURS LOG ================= */}
          {activeMode === 'study' && (
            <div className="flex flex-col gap-4">
              {subjects.length === 0 && !isCreatingSubject ? (
                <div className="p-6 border border-dashed border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-center bg-white dark:bg-[#24201C] flex flex-col items-center gap-3">
                  <BookOpen className="w-8 h-8 text-stone-400" />
                  <div>
                    <h3 className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100">No Academic Subjects Found</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">
                      Create your first subject to start logging study sessions and tracking targets.
                    </p>
                  </div>
                  {onAddSubject && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingSubject(true)}
                      className="px-4 py-2 bg-[#1C1917] text-[#D4AF37] rounded-lg text-xs font-serif font-bold uppercase tracking-wider hover:bg-stone-800 cursor-pointer shadow-xs"
                    >
                      + Create Subject
                    </button>
                  )}
                </div>
              ) : isCreatingSubject ? (
                <form onSubmit={handleCreateSubjectSubmit} className="bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                    <span className="text-xs font-serif font-bold uppercase text-stone-900 dark:text-stone-100">
                      Create New Academic Subject
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingSubject(false)}
                      className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-serif font-bold uppercase text-stone-700 dark:text-stone-300">Subject Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Organic Chemistry, Calculus III..."
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-stone-50 dark:bg-[#1A1816] border border-stone-300 dark:border-[#3D352B] text-stone-900 dark:text-stone-100 rounded focus:bg-white dark:focus:bg-[#1A1816]"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-serif font-bold uppercase text-stone-700 dark:text-stone-300">Weekly Target (Hours)</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={newSubTarget}
                        onChange={(e) => setNewSubTarget(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-stone-50 dark:bg-[#1A1816] border border-stone-300 dark:border-[#3D352B] text-stone-900 dark:text-stone-100 rounded focus:bg-white dark:focus:bg-[#1A1816]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-serif font-bold uppercase text-stone-700 dark:text-stone-300">Color Badge</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newSubColor}
                          onChange={(e) => setNewSubColor(e.target.value)}
                          className="w-8 h-8 rounded border border-stone-300 dark:border-[#3D352B] cursor-pointer p-0.5"
                        />
                        <span className="text-xs font-mono text-stone-600 dark:text-stone-400">{newSubColor}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-1 px-4 py-2 bg-[#1C1917] text-[#D4AF37] rounded text-xs font-serif font-bold uppercase tracking-wider hover:bg-stone-800"
                  >
                    Save Subject
                  </button>
                </form>
              ) : (
                <form onSubmit={handleStudySubmit} className="flex flex-col gap-4">
                  {/* Select Subject */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                        Select Subject
                      </label>
                      {onAddSubject && (
                        <button
                          type="button"
                          onClick={() => setIsCreatingSubject(true)}
                          className="text-[11px] font-serif font-bold text-[#8A631F] dark:text-[#D4AF37] hover:underline cursor-pointer"
                        >
                          + New Subject
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {subjects.map((sub) => {
                        const isSelected = selectedStudySubjectId === sub.id;
                        const totalLogged = (Object.values(sub.dailyHours) as number[]).reduce((a: number, b: number) => a + b, 0);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setSelectedStudySubjectId(sub.id)}
                            className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1C1917] text-[#F5F2EB] border-amber-900/40 shadow-sm ring-1 ring-[#B88939]'
                                : 'bg-white dark:bg-[#24201C] border-[#D8CFBF] dark:border-[#3D352B] text-stone-800 dark:text-stone-200 hover:bg-[#F3EFE6] dark:hover:bg-stone-800'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: sub.color }}
                              />
                              <span className="text-xs font-serif font-bold truncate">
                                {sub.name}
                              </span>
                            </div>
                            <div className={`text-[10px] font-sans ${isSelected ? 'text-[#D4AF37]' : 'text-stone-500 dark:text-stone-400'}`}>
                              {totalLogged}h / {sub.weeklyTargetHours}h target
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Day of the Week Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                        Log For Day
                      </span>
                      <span className="text-[11px] font-sans text-stone-500 dark:text-stone-400 font-normal">
                        Current: {DAY_FULL_NAMES[selectedStudyDay]}
                      </span>
                    </label>

                    <div className="grid grid-cols-7 gap-1.5">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = selectedStudyDay === day;
                        const isToday = dayDates[day]?.isToday;
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setSelectedStudyDay(day)}
                            className={`py-2 px-1 rounded-md text-xs font-serif font-bold uppercase border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                              isSelected
                                ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/40 shadow-sm ring-1 ring-[#B88939]'
                                : 'bg-white dark:bg-[#24201C] border-[#D8CFBF] dark:border-[#3D352B] text-stone-800 dark:text-stone-200 hover:bg-[#F3EFE6] dark:hover:bg-stone-800 hover:border-stone-400'
                            }`}
                          >
                            <span>{day}</span>
                            {isToday && (
                              <span className={`text-[8px] font-sans font-bold px-1 rounded ${isSelected ? 'bg-[#D4AF37] text-stone-900' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'}`}>
                                Today
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Study Duration (Presets + Custom) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                        Study Time to Add
                      </span>
                      <span className="text-xs font-serif font-bold text-[#8A631F] dark:text-[#D4AF37]">
                        +{studyHours} {studyHours === 1 ? 'Hour' : 'Hours'} ({Math.round(studyHours * 60)} mins)
                      </span>
                    </label>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {[0.5, 1, 1.5, 2, 2.5, 3].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setStudyHours(hrs)}
                          className={`py-2 px-2 rounded-md text-xs font-serif font-bold border transition-all cursor-pointer ${
                            studyHours === hrs
                              ? 'bg-[#1C1917] text-[#D4AF37] border-[#1C1917] shadow-sm ring-1 ring-[#B88939]'
                              : 'bg-white dark:bg-[#24201C] text-stone-800 dark:text-stone-200 border-[#D8CFBF] dark:border-[#3D352B] hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          +{hrs}h
                        </button>
                      ))}
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] font-sans text-stone-500 dark:text-stone-400">Or custom amount:</span>
                      <input
                        type="number"
                        step="0.25"
                        min="0.25"
                        max="24"
                        value={studyHours}
                        onChange={(e) => setStudyHours(parseFloat(e.target.value) || 0.5)}
                        className="w-20 px-2.5 py-1 text-xs font-bold bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded text-stone-900 dark:text-stone-100"
                      />
                      <span className="text-xs text-stone-600 dark:text-stone-400 font-medium">hours</span>
                    </div>
                  </div>

                  {/* Optional Study Session Note */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                      Session Topic / Note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Practiced past midterm questions, flashcards..."
                      value={studyNote}
                      onChange={(e) => setStudyNote(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#B88939]"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-serif font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 cursor-pointer"
                    >
                      Done
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedStudySubjectId || studyHours <= 0}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1C1917] hover:bg-stone-800 disabled:opacity-50 text-[#D4AF37] text-xs font-serif font-bold uppercase tracking-wider border border-amber-900/30 active:scale-95 cursor-pointer shadow-sm transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Log +{studyHours}h to {selectedSubjectObj?.name || 'Subject'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
