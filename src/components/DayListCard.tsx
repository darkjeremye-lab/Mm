import React, { useState } from 'react';
import {
  DayOfWeek,
  DAY_FULL_NAMES,
  OffDayConfig,
  TaskItem,
  TaskPriority,
  TaskRecurrence,
  TaskReminder,
  ThemeConfig,
} from '../types';
import { CircularProgress } from './CircularProgress';
import {
  Plus,
  Edit2,
  Check,
  Bell,
  Repeat,
  Clock,
  ChevronUp,
  ChevronDown,
  Trash2,
  ChevronRight,
  ListFilter,
  CheckCircle2,
  Circle,
  Moon,
  Coffee,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { TaskReminderModal } from './TaskReminderModal';
import { formatTime12h } from '../utils/notificationService';

interface DayListCardProps {
  day: DayOfWeek;
  dateInfo: { label: string; fullDate: string; isToday: boolean };
  tasks: TaskItem[];
  theme: ThemeConfig;
  offDayConfig?: OffDayConfig;
  onToggleOffDay?: (dateISO: string, reason?: 'rest' | 'sick' | 'travel' | 'retreat') => void;
  onAddTask: (
    day: DayOfWeek,
    text: string,
    options?: { priority?: TaskPriority; duration?: string; recurrence?: TaskRecurrence }
  ) => void;
  onToggleTask: (day: DayOfWeek, taskId: string) => void;
  onEditTask: (day: DayOfWeek, taskId: string, newText: string) => void;
  onDeleteTask: (day: DayOfWeek, taskId: string) => void;
  onMoveTask?: (day: DayOfWeek, taskId: string, direction: 'up' | 'down') => void;
  onMoveTaskToDay?: (fromDay: DayOfWeek, toDay: DayOfWeek, taskId: string) => void;
  onUpdateTaskMetadata?: (day: DayOfWeek, taskId: string, updates: Partial<TaskItem>) => void;
  onSaveTaskReminder: (day: DayOfWeek, taskId: string, reminder: TaskReminder | undefined) => void;
}

export const DayListCard: React.FC<DayListCardProps> = ({
  day,
  dateInfo,
  tasks,
  theme,
  offDayConfig,
  onToggleOffDay,
  onAddTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  onMoveTaskToDay,
  onUpdateTaskMetadata,
  onSaveTaskReminder,
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null);
  const [reminderModalTask, setReminderModalTask] = useState<TaskItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isOff = !!offDayConfig?.isOff;
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const leftCount = totalCount - completedCount;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(day, newTaskText.trim(), { priority: newPriority });
    setNewTaskText('');
    setNewPriority('medium');
  };

  const handleCyclePriority = (task: TaskItem) => {
    const cycleMap: Record<TaskPriority, TaskPriority> = {
      low: 'medium',
      medium: 'high',
      high: 'urgent',
      urgent: 'low',
    };
    const nextPriority = cycleMap[task.priority || 'medium'];
    onUpdateTaskMetadata?.(day, task.id, { priority: nextPriority });
  };

  const handleCycleDuration = (task: TaskItem) => {
    const cycleDurations: Array<string | undefined> = [
      undefined,
      '15 min',
      '30 min',
      '1 hour',
      '2 hours',
    ];
    const currentIndex = cycleDurations.indexOf(task.duration);
    const nextIndex = (currentIndex + 1) % cycleDurations.length;
    const nextDuration = cycleDurations[nextIndex];
    onUpdateTaskMetadata?.(day, task.id, { duration: nextDuration });
  };

  const getPriorityClass = (p?: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return 'bg-red-950/20 text-red-700 dark:text-red-300 border-red-500/40 hover:bg-red-950/30';
      case 'high':
        return 'bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-950/30';
      case 'low':
        return 'bg-blue-950/15 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:bg-blue-950/25';
      case 'medium':
      default:
        return 'bg-stone-500/10 text-stone-600 dark:text-stone-300 border-stone-400/30 hover:bg-stone-500/20';
    }
  };

  const startEdit = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  const saveEdit = (taskId: string) => {
    if (editingText.trim()) {
      onEditTask(day, taskId, editingText.trim());
    }
    setEditingTaskId(null);
    setEditingText('');
  };

  return (
    <div
      id={`day-list-card-${day.toLowerCase()}`}
      className={`bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg shadow-[0_4px_16px_rgba(20,18,15,0.06)] overflow-hidden transition-all duration-200 ${
        dateInfo.isToday ? 'ring-2 ring-[#B88939]/70 ring-offset-1 border-[#B88939]' : ''
      } ${isOff ? 'bg-[#FAF8F3] dark:bg-[#201C18] opacity-95 border-amber-300/80' : ''}`}
    >
      {/* 1. Header Bar: Full Width with Day Name, Date, Metrics & Progress */}
      <div
        className={`px-4 py-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3D5] dark:border-[#2E2820] ${
          isOff ? 'bg-[#F4ECE1] dark:bg-[#201C18]' : dateInfo.isToday ? 'bg-[#F4EFE6] dark:bg-[#221E1A]' : 'bg-[#F8F5EE] dark:bg-[#1C1917]'
        }`}
      >
        {/* Left: Day Title & Date Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 rounded hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand day' : 'Collapse day'}
          >
            <ChevronRight
              className={`w-4 h-4 text-stone-600 dark:text-stone-300 transition-transform duration-200 ${
                isCollapsed ? 'rotate-0' : 'rotate-90'
              }`}
            />
          </button>

          <div className="flex items-center gap-2">
            <span
              className={`text-sm sm:text-base font-serif font-bold uppercase tracking-wide ${
                isOff ? 'text-[#8A631F] dark:text-[#E2BE7A]' : dateInfo.isToday ? 'text-[#8A631F] dark:text-[#E2BE7A]' : 'text-stone-900 dark:text-stone-100'
              }`}
            >
              {DAY_FULL_NAMES[day]}
            </span>

            <span className="text-xs font-sans font-semibold text-stone-500 dark:text-stone-400 uppercase px-2 py-0.5 rounded bg-stone-200/70 dark:bg-stone-800">
              {dateInfo.label}
            </span>

            {dateInfo.isToday && (
              <span className="text-[10px] font-serif font-bold uppercase px-2.5 py-0.5 rounded bg-[#1C1917] text-[#D4AF37] tracking-wider shadow-xs">
                Today
              </span>
            )}

            {isOff && (
              <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded bg-amber-900/15 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-400 dark:border-amber-700 uppercase flex items-center gap-1">
                <Moon className="w-3 h-3 fill-amber-700 dark:fill-amber-400 text-amber-700 dark:text-amber-400" />
                <span>Rest Day (Exempt)</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Metrics & Progress Meter */}
        <div className="flex items-center gap-3 sm:gap-4 ml-auto">
          {/* Quiet Mode toggle button */}
          {onToggleOffDay && (
            <button
              type="button"
              onClick={() => onToggleOffDay(dateInfo.fullDate)}
              className={`text-xs font-sans font-semibold px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                isOff
                  ? 'bg-[#1C1917] text-[#D4AF37] font-bold shadow-xs hover:bg-stone-800'
                  : 'bg-white dark:bg-[#24201B] hover:bg-stone-100 dark:hover:bg-[#2C261F] text-stone-700 dark:text-stone-300 border border-[#D8CFBF] dark:border-[#3D352B]'
              }`}
              title={
                isOff
                  ? 'Quiet Mode is active. Click to resume standard streak tracking.'
                  : 'Mark as Rest / Off Day (No penalty, habits & tasks excluded from misses)'
              }
            >
              {isOff ? (
                <>
                  <Moon className="w-3.5 h-3.5 fill-[#D4AF37]" />
                  <span>Quiet Mode ON</span>
                </>
              ) : (
                <>
                  <Coffee className="w-3.5 h-3.5 text-stone-500" />
                  <span>Mark Off</span>
                </>
              )}
            </button>
          )}

          {/* Quick counts */}
          {!isOff ? (
            <>
              <div className="flex items-center gap-2 text-xs font-serif font-semibold text-stone-600">
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{completedCount} Done</span>
                </span>
                <span className="text-stone-300">|</span>
                <span className="inline-flex items-center gap-1 text-stone-600">
                  <Circle className="w-3.5 h-3.5 text-stone-400" />
                  <span>{leftCount} Left</span>
                </span>
              </div>

              {/* Mini Circular Progress */}
              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-[#E0D7C9] shadow-2xs">
                <CircularProgress
                  percentage={percentage}
                  size={32}
                  strokeWidth={4}
                  trackColor={theme.ringTrackHex}
                  progressColor={theme.ringProgressHex}
                  showPercentage={false}
                />
                <span className="text-xs font-serif font-bold text-stone-900 min-w-[32px] text-right">
                  {percentage}%
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1 text-xs font-serif font-bold text-[#8A631F] bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8A631F]" />
              <span>Streaks Protected</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Content Body (Collapsible) */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          {/* Add Task Input Form + Filter Tabs Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Add Task Input Form */}
            <form onSubmit={handleAddNewTask} className="flex-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next: Record<TaskPriority, TaskPriority> = {
                    low: 'medium',
                    medium: 'high',
                    high: 'urgent',
                    urgent: 'low',
                  };
                  setNewPriority(next[newPriority]);
                }}
                title="Set priority (click to cycle)"
                className={`px-2 py-2 text-[10px] font-serif font-bold uppercase rounded border transition-all cursor-pointer flex-shrink-0 ${getPriorityClass(
                  newPriority
                )}`}
              >
                {newPriority.substring(0, 3)}
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={`+ Add a task for ${DAY_FULL_NAMES[day]}... (Press Enter)`}
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium px-3.5 py-2 bg-white border border-[#D8CFBF] rounded-md text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B88939] focus:border-[#B88939] shadow-2xs"
                />
              </div>
              <button
                type="submit"
                aria-label={`Add task for ${day}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] text-xs font-serif font-bold tracking-wider uppercase border border-amber-900/30 active:scale-95 cursor-pointer shadow-xs whitespace-nowrap transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </form>

            {/* Filter Tabs (when day has tasks) */}
            {tasks.length > 0 && (
              <div className="flex items-center gap-1 bg-[#F4EFE6] dark:bg-[#24201B] p-1 rounded-md border border-[#E0D7C9] dark:border-[#3D352B] self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 text-[11px] font-serif font-bold uppercase rounded transition-all cursor-pointer ${
                    filter === 'all'
                      ? 'bg-[#1C1917] text-[#D4AF37] shadow-xs'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('active')}
                  className={`px-2.5 py-1 text-[11px] font-serif font-bold uppercase rounded transition-all cursor-pointer ${
                    filter === 'active'
                      ? 'bg-[#1C1917] text-[#D4AF37] shadow-xs'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  To Do ({leftCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('completed')}
                  className={`px-2.5 py-1 text-[11px] font-serif font-bold uppercase rounded transition-all cursor-pointer ${
                    filter === 'completed'
                      ? 'bg-[#1C1917] text-[#D4AF37] shadow-xs'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  Done ({completedCount})
                </button>
              </div>
            )}
          </div>

          {/* Tasks List Grid (Responsive: 1 col on mobile, 2 cols on md, 3 cols on 2xl) */}
          {tasks.length === 0 ? (
            <div className="py-6 px-4 border border-dashed border-[#D8CFBF] dark:border-[#3D352B] rounded-md flex flex-col items-center justify-center text-center bg-[#FDFBF7]/50 dark:bg-[#1C1917]/50">
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                No tasks scheduled for {DAY_FULL_NAMES[day]}
              </span>
              <p className="text-xs text-stone-400 dark:text-stone-500 font-sans mt-0.5">
                Type in the box above to schedule an action item or study session.
              </p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-4 px-3 border border-dashed border-[#D8CFBF] dark:border-[#3D352B] rounded-md text-center bg-[#FDFBF7] dark:bg-[#1C1917]">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                No tasks match the selected filter ({filter}).
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {filteredTasks.map((task, idx) => {
                const isEditing = editingTaskId === task.id;
                const isConfirmingDelete = confirmDeleteTaskId === task.id;
                const hasReminder = !!task.reminder;
                const reminderEnabled = task.reminder?.enabled;

                return (
                  <div
                    key={task.id}
                    className={`group flex flex-col justify-between gap-2 p-3 rounded-md border transition-all ${
                      task.completed
                        ? 'bg-[#EFEAE1]/60 dark:bg-[#24201B]/50 border-[#DDD5C5] dark:border-[#332C24] text-stone-500 dark:text-stone-500'
                        : 'bg-white dark:bg-[#24201B] border-[#E0D7C9] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 shadow-2xs hover:border-[#B88939]/70 hover:shadow-xs'
                    }`}
                  >
                    {/* Top Row: Checkbox + Text / Edit Input */}
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => onToggleTask(day, task.id)}
                        className={`flex-shrink-0 w-4.5 h-4.5 mt-0.5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          task.completed
                            ? 'bg-[#1C1917] text-[#D4AF37] border-[#1C1917]'
                            : 'bg-white dark:bg-[#1C1917] border-stone-400 dark:border-stone-600 hover:border-stone-800 dark:hover:border-stone-300'
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Task Text or Inline Edit Input */}
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(task.id);
                              if (e.key === 'Escape') setEditingTaskId(null);
                            }}
                            autoFocus
                            className="w-full text-xs font-medium px-2 py-1 bg-white border border-[#B88939] rounded text-stone-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => saveEdit(task.id)}
                            className="p-1 bg-[#1C1917] text-[#D4AF37] rounded hover:bg-stone-800 cursor-pointer"
                            title="Save changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => onToggleTask(day, task.id)}
                          className={`flex-1 text-xs sm:text-sm font-medium break-words cursor-pointer select-none leading-relaxed ${
                            task.completed ? 'line-through text-stone-400 font-normal' : 'text-stone-800'
                          }`}
                        >
                          {task.text}
                        </span>
                      )}
                    </div>

                    {/* Bottom Metadata & Controls Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#F0EBE0] dark:border-[#2E2820] mt-1 flex-wrap gap-1.5">
                      {/* Left: Priority, Duration, Recurrence, Reminder */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Priority Badge with 1-click cycle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCyclePriority(task);
                          }}
                          title="Click to cycle priority (Low -> Med -> High -> Urgent)"
                          className={`text-[9px] font-serif font-bold uppercase px-1.5 py-0.5 rounded border transition-all cursor-pointer ${getPriorityClass(
                            task.priority
                          )}`}
                        >
                          {task.priority || 'medium'}
                        </button>

                        {/* Optional Duration with 1-click cycle */}
                        {task.duration ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCycleDuration(task);
                            }}
                            title="Click to cycle duration (15 min -> 30 min -> 1 hr -> 2 hr -> none)"
                            className="text-[10px] font-sans font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {task.duration}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCycleDuration(task);
                            }}
                            title="Add estimated duration"
                            className="opacity-0 group-hover:opacity-100 text-[10px] font-sans text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center gap-0.5 px-1.5 py-0.5 rounded cursor-pointer transition-opacity"
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span>+time</span>
                          </button>
                        )}

                        {/* Recurrence Pill */}
                        {task.recurrence && (
                          <span
                            title={`Repeats ${task.recurrence.frequency}`}
                            className="text-[9px] font-serif font-bold uppercase text-stone-500 dark:text-stone-400 flex items-center gap-0.5"
                          >
                            <Repeat className="w-2.5 h-2.5 text-[#B88939]" />
                            {task.recurrence.frequency}
                          </span>
                        )}

                        {/* Reminder Pill if configured */}
                        {hasReminder && (
                          <div
                            onClick={() => setReminderModalTask(task)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 ${
                              reminderEnabled
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 line-through'
                            }`}
                            title="Click to edit reminder"
                          >
                            <Clock className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                            <span>{formatTime12h(task.reminder!.time)}</span>
                            {task.reminder!.isRecurring ? (
                              <span className="flex items-center gap-0.5 text-[8px] bg-[#1C1917] text-[#D4AF37] px-1 rounded">
                                <Repeat className="w-2 h-2" /> DAILY
                              </span>
                            ) : (
                              <span className="text-[9px] text-stone-600 dark:text-stone-400">({day})</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right Controls (Move Up/Down, Reminder, Edit, Delete Confirmation) */}
                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          {/* Reorder Up/Down buttons */}
                          {onMoveTask && tasks.length > 1 && (
                            <div className="flex items-center gap-0.5">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onMoveTask(day, task.id, 'up')}
                                  title="Move task up"
                                  className="p-1 text-stone-400 hover:text-stone-900 rounded hover:bg-stone-100 cursor-pointer"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                              )}
                              {idx < tasks.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => onMoveTask(day, task.id, 'down')}
                                  title="Move task down"
                                  className="p-1 text-stone-400 hover:text-stone-900 rounded hover:bg-stone-100 cursor-pointer"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Reminder Bell Button */}
                          <button
                            type="button"
                            onClick={() => setReminderModalTask(task)}
                            title={
                              hasReminder
                                ? `Reminder set for ${formatTime12h(task.reminder!.time)}`
                                : 'Set task reminder'
                            }
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              hasReminder
                                ? reminderEnabled
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-stone-200 text-stone-600'
                                : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                            }`}
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit inline button */}
                          <button
                            type="button"
                            onClick={() => startEdit(task)}
                            title="Edit task text"
                            className="p-1 text-stone-400 hover:text-stone-900 rounded hover:bg-stone-100 cursor-pointer transition-opacity"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete with Confirmation State */}
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded border border-red-200">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteTask(day, task.id);
                                  setConfirmDeleteTaskId(null);
                                }}
                                className="px-2 py-0.5 bg-red-700 text-white text-[10px] font-bold rounded cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteTaskId(null)}
                                className="px-1.5 py-0.5 text-stone-600 text-[10px] cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTaskId(task.id)}
                              title="Delete task"
                              className="p-1 text-stone-400 hover:text-red-700 rounded hover:bg-red-50 cursor-pointer transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reminder Configuration Modal for Task */}
      {reminderModalTask && (
        <TaskReminderModal
          isOpen={true}
          onClose={() => setReminderModalTask(null)}
          day={day}
          task={reminderModalTask}
          theme={theme}
          onSaveReminder={onSaveTaskReminder}
        />
      )}
    </div>
  );
};
