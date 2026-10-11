import React, { useState } from 'react';
import {
  DayOfWeek,
  DAYS_OF_WEEK,
  DAY_FULL_NAMES,
  TaskItem,
  TaskPriority,
  ThemeConfig,
  RecurrenceFrequency,
  TaskReminder,
} from '../types';
import { TodayStats } from '../utils/gamificationUtils';
import {
  CheckCircle2,
  Clock,
  Flame,
  AlertTriangle,
  Plus,
  Repeat,
  Sparkles,
  Award,
  Zap,
  BookOpen,
  Calendar,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ListTodo,
} from 'lucide-react';

interface SmartDashboardHeroProps {
  stats: TodayStats;
  theme: ThemeConfig;
  onToggleTask: (day: DayOfWeek, taskId: string) => void;
  onAddTask: (
    day: DayOfWeek,
    text: string,
    options?: {
      priority?: TaskPriority;
      duration?: string;
      recurrence?: { frequency: RecurrenceFrequency; days?: DayOfWeek[] };
      reminder?: TaskReminder;
    }
  ) => void;
  onMoveTaskToDay?: (fromDay: DayOfWeek, toDay: DayOfWeek, taskId: string) => void;
  onRescheduleAllOverdueToToday?: () => void;
  onStartFocus?: (task?: TaskItem, day?: DayOfWeek) => void;
}

const DURATION_PRESETS = ['15 min', '30 min', '1 hour', '2 hours'];

export const SmartDashboardHero: React.FC<SmartDashboardHeroProps> = ({
  stats,
  theme,
  onToggleTask,
  onAddTask,
  onMoveTaskToDay,
  onRescheduleAllOverdueToToday,
  onStartFocus,
}) => {
  // Quick Add State
  const [quickText, setQuickText] = useState('');
  const [quickDay, setQuickDay] = useState<DayOfWeek>(stats.todayDay);
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('medium');
  const [quickDuration, setQuickDuration] = useState<string>('');
  const [customDurationInput, setCustomDurationInput] = useState<string>('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [quickRecurrence, setQuickRecurrence] = useState<RecurrenceFrequency | 'none'>('none');
  const [customRecurrenceDays, setCustomRecurrenceDays] = useState<DayOfWeek[]>([stats.todayDay]);
  const [isQuickExpanded, setIsQuickExpanded] = useState(false);

  // Remaining tasks collapse toggle
  const [showAllRemaining, setShowAllRemaining] = useState(false);

  // Overdue reschedule target per task
  const [rescheduleTargetDay, setRescheduleTargetDay] = useState<Record<string, DayOfWeek>>({});

  const handleToggleCustomDay = (d: DayOfWeek) => {
    setCustomRecurrenceDays((prev) => {
      if (prev.includes(d)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== d);
      } else {
        return [...prev, d];
      }
    });
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim()) return;

    const finalDuration = isCustomDuration
      ? customDurationInput.trim()
      : quickDuration;

    onAddTask(quickDay, quickText.trim(), {
      priority: quickPriority,
      duration: finalDuration || undefined,
      recurrence:
        quickRecurrence === 'custom'
          ? { frequency: 'custom', days: customRecurrenceDays }
          : quickRecurrence !== 'none'
          ? { frequency: quickRecurrence }
          : undefined,
    });

    setQuickText('');
    setQuickDuration('');
    setCustomDurationInput('');
    setIsCustomDuration(false);
    setQuickRecurrence('none');
    setQuickPriority('medium');
    setIsQuickExpanded(false);
  };

  const getPriorityBadgeClass = (p?: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return 'bg-red-950/20 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-500/40';
      case 'high':
        return 'bg-amber-950/20 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-500/40';
      case 'low':
        return 'bg-blue-950/15 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'medium':
      default:
        return 'bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-400/30';
    }
  };

  // Other remaining tasks for today (excluding the Next Up task if it's for today)
  const remainingToday = stats.todayRemainingTasksList || [];
  const otherRemainingToday = stats.nextUpTask && stats.nextUpTask.day === stats.todayDay
    ? remainingToday.filter((t) => t.id !== stats.nextUpTask!.task.id)
    : remainingToday;

  return (
    <div className="w-full flex flex-col gap-4 animate-fadeIn">
      {/* 1. Header Bar: Today's Full Date, Active Focus & Executive Summary */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-3.5 sm:p-5 shadow-[0_4px_20px_rgba(20,18,15,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-[#B88939] dark:text-[#E2BE7A] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#B88939]" />
              Today's Executive Dashboard
            </span>
            <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-[#B88939] dark:text-[#E2BE7A] border border-amber-500/30">
              {DAY_FULL_NAMES[stats.todayDay]}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            {stats.todayDateFormatted}
          </h1>
        </div>

        {/* Level, XP & Streak Badges */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Streak Counter */}
          <div className="flex items-center gap-2 bg-[#F7F3EB] dark:bg-[#24201B] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#EAE3D5] dark:border-[#3D352B] shadow-2xs">
            <div className="p-1 rounded bg-amber-500/20 text-[#B88939] dark:text-amber-400">
              <Flame className="w-4 h-4 fill-current animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-sans font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                Streak
              </span>
              <span className="text-xs sm:text-sm font-serif font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                {stats.streakDays} {stats.streakDays === 1 ? 'Day' : 'Days'}
              </span>
            </div>
          </div>

          {/* Level & XP Badge */}
          <div className="flex items-center gap-2 bg-[#F7F3EB] dark:bg-[#24201B] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#EAE3D5] dark:border-[#3D352B] shadow-2xs">
            <div className="p-1 rounded bg-[#1C1917] text-[#D4AF37]">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-serif font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                  Level {stats.levelInfo.level}
                </span>
                <span className="text-[9px] sm:text-[10px] text-[#B88939] dark:text-[#E2BE7A] font-sans font-semibold truncate max-w-[90px] sm:max-w-none">
                  • {stats.levelInfo.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-14 sm:w-16 h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                  <div
                    className="h-full bg-[#B88939] rounded-full transition-all duration-300"
                    style={{ width: `${stats.levelInfo.progressPercent}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-stone-600 dark:text-stone-300 font-bold whitespace-nowrap">
                  {stats.levelInfo.totalXP} XP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row (4 High-Contrast Cards, Mobile Responsive 360px+) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Today Completion % */}
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-serif font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Today's Progress
            </span>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.goldAccent }} />
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
              {stats.todayCompletionPercent}%
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-1 truncate">
            {stats.todayTasksCompleted}/{stats.todayTasksTotal} tasks • {stats.todayHabitsCompleted}/{stats.todayHabitsTotal} habits
          </p>
        </div>

        {/* Metric 2: Tasks Completed / Remaining */}
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-serif font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Today's Tasks
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
              {stats.todayTasksCompleted}/{stats.todayTasksTotal}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">done</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1 truncate">
            {stats.todayTasksRemaining} {stats.todayTasksRemaining === 1 ? 'task' : 'tasks'} remaining
          </p>
        </div>

        {/* Metric 3: Habits Completed */}
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-serif font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Daily Habits
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#B88939]" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
              {stats.todayHabitsCompleted}/{stats.todayHabitsTotal}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">checked</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-1 truncate">
            Daily consistency
          </p>
        </div>

        {/* Metric 4: Today Study / Focus Time */}
        <div
          onClick={onStartFocus ? () => onStartFocus() : undefined}
          className={`bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between ${
            onStartFocus ? 'cursor-pointer hover:border-[#B88939]/70 group transition-all' : ''
          }`}
          title={onStartFocus ? "Click to open Focus & Study Mode" : undefined}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-serif font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Focus & Study
            </span>
            <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
              {stats.todayStudyFormatted}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">today</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-medium truncate">
              Deep focus logged
            </p>
            {onStartFocus && (
              <span className="text-[10px] font-serif font-bold text-[#B88939] uppercase group-hover:underline flex items-center gap-0.5">
                Focus &rarr;
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. OVERDUE TASKS BANNER (If any overdue tasks exist) */}
      {stats.overdueTasks.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-600/40 rounded-xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-600 text-white flex-shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <span>Overdue Tasks ({stats.overdueTasks.length})</span>
                </h3>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 font-sans">
                  Unfinished tasks from earlier this week. Reschedule or complete them.
                </p>
              </div>
            </div>

            {onRescheduleAllOverdueToToday && (
              <button
                type="button"
                onClick={onRescheduleAllOverdueToToday}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold uppercase rounded-lg bg-[#1C1917] text-[#D4AF37] hover:bg-stone-800 cursor-pointer shadow-xs border border-amber-900/30 transition-all active:scale-95 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Move All to Today</span>
              </button>
            )}
          </div>

          {/* Overdue Task List */}
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {stats.overdueTasks.map(({ task, day }) => {
              const selectedTarget = rescheduleTargetDay[task.id] || stats.todayDay;

              return (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 sm:px-3 sm:py-2 rounded-lg bg-white dark:bg-[#201C18] border border-amber-200 dark:border-amber-900/40 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleTask(day, task.id)}
                      className="flex-shrink-0 w-4 h-4 rounded border border-stone-400 dark:border-stone-500 hover:border-stone-800 flex items-center justify-center cursor-pointer transition-colors"
                      title="Mark task completed"
                    >
                      {task.completed && <Check className="w-3 h-3 text-stone-900" />}
                    </button>

                    <span className="text-[10px] font-sans font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 flex-shrink-0">
                      {day}
                    </span>

                    <span
                      className={`text-[9px] font-serif font-bold uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${getPriorityBadgeClass(
                        task.priority
                      )}`}
                    >
                      {task.priority || 'medium'}
                    </span>

                    <span className="font-medium text-stone-800 dark:text-stone-200 truncate">
                      {task.text}
                    </span>

                    {task.duration && (
                      <span className="text-[10px] text-stone-400 font-sans flex items-center gap-0.5 flex-shrink-0 hidden xs:inline-flex">
                        <Clock className="w-3 h-3" />
                        {task.duration}
                      </span>
                    )}
                  </div>

                  {/* Reschedule Controls */}
                  {onMoveTaskToDay && (
                    <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                      <select
                        value={selectedTarget}
                        onChange={(e) =>
                          setRescheduleTargetDay((prev) => ({
                            ...prev,
                            [task.id]: e.target.value as DayOfWeek,
                          }))
                        }
                        className="text-[10px] font-serif font-bold uppercase px-2 py-1 rounded bg-[#F7F3EB] dark:bg-[#2A241E] border border-amber-300 dark:border-amber-800/40 text-stone-800 dark:text-stone-200"
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d} value={d}>
                            {d} {d === stats.todayDay ? '(Today)' : ''}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => onMoveTaskToDay(day, selectedTarget, task.id)}
                        className="px-2.5 py-1 text-[11px] font-serif font-bold uppercase rounded bg-[#1C1917] text-[#D4AF37] hover:bg-stone-800 cursor-pointer shadow-2xs border border-amber-900/30 transition-all active:scale-95"
                        title={`Move this task to ${selectedTarget}`}
                      >
                        {selectedTarget === stats.todayDay ? 'Move to Today' : `Move to ${selectedTarget}`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. "NEXT UP" SECTION: The most relevant unfinished task */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-3.5 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-[#EAE3D5] dark:border-[#2E2820] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-[#1C1917] text-[#D4AF37]">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs sm:text-sm font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Next Up — Primary Target
            </h2>
          </div>
          {stats.nextUpTask && (
            <span className="text-[10px] sm:text-[11px] font-sans font-semibold text-stone-500 dark:text-stone-400">
              Scheduled for{' '}
              <strong className="text-[#B88939] dark:text-[#E2BE7A]">
                {stats.nextUpTask.day === stats.todayDay ? 'Today' : DAY_FULL_NAMES[stats.nextUpTask.day]}
              </strong>
            </span>
          )}
        </div>

        {stats.nextUpTask ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-white dark:bg-[#24201B] border border-[#E0D7C9] dark:border-[#3D352B] shadow-2xs">
            <div className="flex items-start gap-3 min-w-0">
              <button
                type="button"
                onClick={() => onToggleTask(stats.nextUpTask!.day, stats.nextUpTask!.task.id)}
                className="w-5 h-5 mt-0.5 rounded border border-stone-400 dark:border-stone-500 hover:border-stone-900 dark:hover:border-stone-100 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                title="Click to complete this task"
              >
                {stats.nextUpTask.task.completed && <Check className="w-3.5 h-3.5 text-stone-900 stroke-[3]" />}
              </button>

              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-serif font-bold uppercase px-2 py-0.5 rounded border ${getPriorityBadgeClass(
                      stats.nextUpTask.task.priority
                    )}`}
                  >
                    {stats.nextUpTask.task.priority || 'Medium'} Priority
                  </span>

                  {stats.nextUpTask.task.duration && (
                    <span className="text-[11px] text-stone-600 dark:text-stone-400 font-sans flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      {stats.nextUpTask.task.duration}
                    </span>
                  )}

                  {stats.nextUpTask.task.reminder?.enabled && (
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-sans font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      🔔 {stats.nextUpTask.task.reminder.time}
                    </span>
                  )}

                  {stats.nextUpTask.task.recurrence && (
                    <span className="text-[10px] font-serif font-bold uppercase text-stone-500 flex items-center gap-1">
                      <Repeat className="w-3 h-3 text-[#B88939]" />
                      {stats.nextUpTask.task.recurrence.frequency}
                    </span>
                  )}
                </div>

                <p className="text-sm sm:text-base font-serif font-bold text-stone-900 dark:text-stone-100 break-words">
                  {stats.nextUpTask.task.text}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-center flex-wrap">
              {onStartFocus && (
                <button
                  type="button"
                  onClick={() => onStartFocus(stats.nextUpTask!.task, stats.nextUpTask!.day)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-serif font-bold uppercase rounded-lg bg-amber-500/15 text-[#B88939] dark:text-[#E2BE7A] hover:bg-amber-500/25 border border-amber-500/30 cursor-pointer shadow-xs transition-all active:scale-95 whitespace-nowrap"
                  title="Start Focus Session on this task"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Start Focus</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onToggleTask(stats.nextUpTask!.day, stats.nextUpTask!.task.id)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 text-xs font-serif font-bold uppercase rounded-lg bg-[#1C1917] text-[#D4AF37] hover:bg-stone-800 cursor-pointer shadow-xs border border-amber-900/30 transition-all active:scale-95 whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Complete Target</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-serif font-bold text-emerald-900 dark:text-emerald-300">
                All Targets Accomplished for Today!
              </h3>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80">
                You have completed all scheduled tasks. Maintain momentum by adding tomorrow's priorities below.
              </p>
            </div>
          </div>
        )}

        {/* Optional Collapsible Remaining Tasks for Today */}
        {otherRemainingToday.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#EAE3D5] dark:border-[#2E2820]">
            <button
              type="button"
              onClick={() => setShowAllRemaining(!showAllRemaining)}
              className="flex items-center justify-between w-full text-xs font-serif font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer py-1"
            >
              <span className="flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-[#B88939]" />
                <span>Other Remaining Tasks for Today ({otherRemainingToday.length})</span>
              </span>
              {showAllRemaining ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAllRemaining && (
              <div className="flex flex-col gap-2 mt-2 max-h-52 overflow-y-auto pr-1">
                {otherRemainingToday.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-stone-50 dark:bg-[#201C18] border border-[#EAE3D5] dark:border-[#332C24] text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleTask(stats.todayDay, task.id)}
                        className="flex-shrink-0 w-4 h-4 rounded border border-stone-400 dark:border-stone-600 hover:border-stone-800 flex items-center justify-center cursor-pointer transition-colors"
                        title="Mark complete"
                      >
                        {task.completed && <Check className="w-3 h-3 text-stone-900" />}
                      </button>

                      <span
                        className={`text-[9px] font-serif font-bold uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${getPriorityBadgeClass(
                          task.priority
                        )}`}
                      >
                        {task.priority || 'medium'}
                      </span>

                      <span className="font-medium text-stone-800 dark:text-stone-200 truncate">
                        {task.text}
                      </span>

                      {task.duration && (
                        <span className="text-[10px] text-stone-500 font-sans flex items-center gap-0.5 flex-shrink-0 hidden xs:inline-flex">
                          <Clock className="w-3 h-3" />
                          {task.duration}
                        </span>
                      )}

                      {task.reminder?.enabled && (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-sans font-semibold flex-shrink-0">
                          🔔 {task.reminder.time}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {onStartFocus && (
                        <button
                          type="button"
                          onClick={() => onStartFocus(task, stats.todayDay)}
                          className="text-[10px] font-serif font-bold uppercase text-[#B88939] hover:underline flex items-center gap-0.5 cursor-pointer"
                          title="Start focus timer on this task"
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>Focus</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleTask(stats.todayDay, task.id)}
                        className="text-[11px] font-serif font-bold uppercase text-stone-700 dark:text-stone-300 hover:text-stone-900 cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. FAST QUICK ADD BAR (Task name, priority, date, optional duration, recurrence) */}
      <form
        onSubmit={handleQuickSubmit}
        className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-3 sm:p-4 shadow-xs flex flex-col gap-2.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-[#B88939]/20 text-[#B88939]">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Quick Add Task
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsQuickExpanded(!isQuickExpanded)}
            className="text-[11px] font-sans font-semibold text-[#B88939] dark:text-[#E2BE7A] hover:underline cursor-pointer"
          >
            {isQuickExpanded ? 'Simple View' : '+ Priority & Options'}
          </button>
        </div>

        {/* Primary Input Row */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          {/* Day Selector */}
          <select
            value={quickDay}
            onChange={(e) => setQuickDay(e.target.value as DayOfWeek)}
            aria-label="Target Day"
            className="text-xs font-serif font-bold uppercase px-3 py-2 rounded-lg bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#B88939] cursor-pointer"
          >
            {DAYS_OF_WEEK.map((d) => (
              <option key={d} value={d}>
                {d} {d === stats.todayDay ? '(Today)' : ''}
              </option>
            ))}
          </select>

          {/* Text Input */}
          <input
            type="text"
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            placeholder="What needs to get done? (Press Enter to add)"
            className="flex-1 text-xs sm:text-sm px-3.5 py-2 rounded-lg bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#B88939]"
          />

          {/* Quick Submit Button */}
          <button
            type="submit"
            disabled={!quickText.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-serif font-bold uppercase rounded-lg bg-[#1C1917] text-[#D4AF37] hover:bg-stone-800 disabled:opacity-50 cursor-pointer shadow-xs border border-amber-900/30 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Secondary Expanded Controls (Priority, Duration, Recurrence) */}
        {isQuickExpanded && (
          <div className="flex flex-col gap-2.5 pt-2 border-t border-[#EAE3D5] dark:border-[#2E2820] text-xs animate-fadeIn">
            {/* Priority Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-serif font-bold uppercase text-stone-500">
                Priority:
              </span>
              {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setQuickPriority(p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-serif font-bold uppercase border transition-all cursor-pointer ${
                    quickPriority === p
                      ? getPriorityBadgeClass(p) + ' ring-1 ring-current'
                      : 'bg-white dark:bg-[#24201B] border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Estimated Duration Presets & Custom Input */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-serif font-bold uppercase text-stone-500">
                Duration:
              </span>
              {DURATION_PRESETS.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => {
                    setIsCustomDuration(false);
                    setQuickDuration(quickDuration === dur ? '' : dur);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold border transition-all cursor-pointer ${
                    !isCustomDuration && quickDuration === dur
                      ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/40 shadow-xs'
                      : 'bg-white dark:bg-[#24201B] border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400'
                  }`}
                >
                  ⏱ {dur}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setIsCustomDuration(!isCustomDuration);
                  setQuickDuration('');
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-serif font-bold uppercase border transition-all cursor-pointer ${
                  isCustomDuration
                    ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/40 shadow-xs'
                    : 'bg-white dark:bg-[#24201B] border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400'
                }`}
              >
                Custom
              </button>

              {isCustomDuration && (
                <input
                  type="text"
                  placeholder="e.g. 45 min, 3 hours"
                  value={customDurationInput}
                  onChange={(e) => setCustomDurationInput(e.target.value)}
                  className="px-2 py-0.5 text-[11px] rounded bg-white dark:bg-[#24201B] border border-stone-300 dark:border-stone-700 w-32 focus:outline-none focus:ring-1 focus:ring-[#B88939]"
                />
              )}
            </div>

            {/* Recurrence Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-serif font-bold uppercase text-stone-500">
                  Repeat:
                </span>
                {(['none', 'daily', 'weekdays', 'weekly', 'custom'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setQuickRecurrence(r)}
                    className={`px-2 py-0.5 rounded text-[10px] font-serif font-bold uppercase border transition-all cursor-pointer ${
                      quickRecurrence === r
                        ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/40 shadow-xs'
                        : 'bg-white dark:bg-[#24201B] border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400'
                    }`}
                  >
                    {r === 'none' ? 'Once' : r}
                  </button>
                ))}
              </div>

              {/* Custom Weekdays Picker */}
              {quickRecurrence === 'custom' && (
                <div className="flex items-center gap-1 flex-wrap mt-1 p-2 bg-[#F3EFE6] dark:bg-[#24201B] rounded-lg border border-[#D8CFBF] dark:border-[#3D352B]">
                  <span className="text-[10px] font-serif font-bold uppercase text-stone-500 mr-1">
                    Select Days:
                  </span>
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = customRecurrenceDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleToggleCustomDay(d)}
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
          </div>
        )}
      </form>
    </div>
  );
};
