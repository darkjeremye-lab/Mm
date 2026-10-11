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
  X,
  Edit2,
  Check,
  Sparkles,
  Bell,
  Repeat,
  Clock,
  ChevronUp,
  ChevronDown,
  Trash2,
  Moon,
  Coffee,
  ShieldCheck,
} from 'lucide-react';
import { TaskReminderModal } from './TaskReminderModal';
import { formatTime12h } from '../utils/notificationService';

interface DayCardProps {
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

export const DayCard: React.FC<DayCardProps> = ({
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
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null);
  const [reminderModalTask, setReminderModalTask] = useState<TaskItem | null>(null);

  const isOff = !!offDayConfig?.isOff;
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const leftCount = totalCount - completedCount;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(day, newTaskText.trim(), { priority: newPriority });
    setNewTaskText('');
    setShowAddOptions(false);
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
      id={`day-card-${day.toLowerCase()}`}
      className={`flex flex-col bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg shadow-[0_4px_16px_rgba(20,18,15,0.06)] min-w-[200px] flex-1 overflow-hidden transition-all duration-200 hover:shadow-[0_8px_24px_rgba(20,18,15,0.12)] ${
        dateInfo.isToday ? 'ring-2 ring-[#B88939]/70 ring-offset-1' : ''
      } ${isOff ? 'bg-[#FAF8F3] dark:bg-[#201C18] opacity-95 border-amber-300/80' : ''}`}
    >
      {/* 1. Solid-colour header bar */}
      <div
        className={`${isOff ? 'bg-[#2A241E] text-[#F5E6C8]' : `${theme.headerBg} ${theme.headerText}`} px-3 py-2.5 flex items-center justify-between border-b border-[#2A241E] transition-colors`}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-serif font-bold tracking-wide uppercase leading-tight">
              {DAY_FULL_NAMES[day]}
            </span>
            {isOff && (
              <span className="text-[9px] font-sans font-bold px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-200 border border-amber-600/40 uppercase">
                {offDayConfig?.reason || 'Rest'}
              </span>
            )}
          </div>
          <span className="text-[10px] font-sans font-medium tracking-tight text-[#E2BE7A] uppercase">
            {dateInfo.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {dateInfo.isToday && (
            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-[#D4AF37] text-[#1C1917] tracking-wider shadow-xs">
              TODAY
            </span>
          )}

          {/* Quiet Mode / No-guilt day toggle */}
          {onToggleOffDay && (
            <button
              type="button"
              onClick={() => onToggleOffDay(dateInfo.fullDate)}
              className={`p-1 rounded text-[10px] font-sans flex items-center gap-1 transition-all cursor-pointer ${
                isOff
                  ? 'bg-[#D4AF37] text-[#1C1917] font-bold shadow-xs hover:bg-amber-300'
                  : 'bg-[#1C1917]/40 hover:bg-white/15 text-stone-300 border border-white/10'
              }`}
              title={
                isOff
                  ? 'Quiet Mode active (No penalty). Click to resume normal tracking.'
                  : 'Mark as Off / Rest Day (Excludes habits and tasks from streak & missed counts)'
              }
            >
              {isOff ? (
                <>
                  <Moon className="w-3 h-3 fill-current" />
                  <span className="text-[9px] uppercase font-mono font-bold">Off</span>
                </>
              ) : (
                <>
                  <Coffee className="w-3 h-3 text-stone-300" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. Large circular progress ring / Rest State */}
      <div className={`flex items-center justify-center py-3 border-b border-[#EAE3D5] dark:border-[#2E2820] ${isOff ? 'bg-[#F4ECE1] dark:bg-[#201C18]' : 'bg-[#F7F3EB] dark:bg-[#221E1A]'}`}>
        {isOff ? (
          <div className="flex flex-col items-center justify-center py-1">
            <div className="w-14 h-14 rounded-full bg-[#E8DEC9] dark:bg-[#2E2720] border-2 border-[#CBBDA5] dark:border-[#4D3F2D] flex items-center justify-center text-[#8A631F] dark:text-[#E2BE7A] shadow-inner mb-1">
              <ShieldCheck className="w-7 h-7 text-[#8A631F] dark:text-[#E2BE7A]" />
            </div>
            <span className="text-[11px] font-serif font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
              No-Guilt Rest
            </span>
            <span className="text-[9px] font-sans font-medium text-stone-500 dark:text-stone-400">
              Streaks & quotas exempt
            </span>
          </div>
        ) : (
          <CircularProgress
            percentage={percentage}
            size={78}
            strokeWidth={7}
            trackColor={theme.ringTrackHex}
            progressColor={theme.ringProgressHex}
            textSizeClass="text-base font-serif font-bold text-stone-900 dark:text-stone-100"
          />
        )}
      </div>

      {/* 3. Checklist of that day's tasks */}
      <div className="flex-1 p-2.5 flex flex-col gap-1.5 min-h-[190px] bg-[#FDFBF7] dark:bg-[#1C1917] overflow-y-auto max-h-[340px]">
        {isOff && (
          <div className="mb-1 text-[10px] text-[#8A631F] dark:text-[#E2BE7A] font-sans font-medium bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 rounded px-2 py-1 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#B88939] flex-shrink-0" />
            <span>Tasks today are optional & exempt from streak counts.</span>
          </div>
        )}

        {/* Add task quick form */}
        <form onSubmit={handleAddNewTask} className="flex items-center gap-1 mb-1">
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
            title="Set initial priority (click to cycle)"
            className={`px-1.5 py-1 text-[9px] font-serif font-bold uppercase rounded border transition-all cursor-pointer flex-shrink-0 ${getPriorityClass(
              newPriority
            )}`}
          >
            {newPriority.substring(0, 3)}
          </button>
          <input
            type="text"
            placeholder="+ Add task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            className="flex-1 text-xs font-medium px-2.5 py-1.5 bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] rounded text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#B88939] min-w-0"
          />
          <button
            type="submit"
            aria-label="Add task"
            className="p-1.5 rounded bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border border-amber-900/30 active:scale-95 cursor-pointer shadow-xs flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Task rows */}
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-stone-400 dark:text-stone-500">
            <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">No Tasks</span>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-sans">Type task above & press Enter</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {tasks.map((task, idx) => {
              const isEditing = editingTaskId === task.id;
              const isConfirmingDelete = confirmDeleteTaskId === task.id;
              const hasReminder = !!task.reminder;
              const reminderEnabled = task.reminder?.enabled;

              return (
                <div
                  key={task.id}
                  className={`group flex flex-col gap-1 p-2 rounded border transition-all ${
                    task.completed
                      ? 'bg-[#EFEAE1]/70 dark:bg-[#24201B]/50 border-[#DDD5C5] dark:border-[#332C24] text-stone-500 dark:text-stone-500'
                      : 'bg-white dark:bg-[#24201B] border-[#E0D7C9] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 shadow-xs hover:border-[#B88939]/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => onToggleTask(day, task.id)}
                      className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                        task.completed
                          ? 'bg-[#1C1917] text-[#D4AF37] border-[#1C1917]'
                          : 'bg-white dark:bg-[#1C1917] border-stone-400 dark:border-stone-600 hover:border-stone-800 dark:hover:border-stone-300'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    {/* Task text or inline edit input */}
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(task.id);
                            if (e.key === 'Escape') setEditingTaskId(null);
                          }}
                          autoFocus
                          className="w-full text-xs font-medium px-1.5 py-0.5 bg-white dark:bg-[#1C1917] border border-[#B88939] rounded text-stone-900 dark:text-stone-100 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => saveEdit(task.id)}
                          className="p-1 bg-[#1C1917] text-[#D4AF37] rounded hover:bg-stone-800"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col min-w-0">
                        <span
                          onClick={() => onToggleTask(day, task.id)}
                          className={`text-xs font-medium break-words cursor-pointer select-none leading-snug ${
                            task.completed ? 'line-through text-stone-400 dark:text-stone-500 font-normal' : 'text-stone-800 dark:text-stone-200'
                          }`}
                        >
                          {task.text}
                        </span>

                        {/* Task Priority, Duration & Recurrence Row */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
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
                            {task.priority || 'med'}
                          </button>

                          {/* Duration Badge with 1-click cycle */}
                          {task.duration ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCycleDuration(task);
                              }}
                              title="Click to cycle duration (15 min -> 30 min -> 1 hr -> 2 hr -> none)"
                              className="text-[9px] font-sans font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 px-1 py-0.5 rounded cursor-pointer transition-colors"
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
                              className="opacity-0 group-hover:opacity-100 text-[9px] font-sans text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center gap-0.5 px-1 py-0.5 rounded cursor-pointer transition-opacity"
                            >
                              <Clock className="w-2.5 h-2.5" />
                              <span>+time</span>
                            </button>
                          )}

                          {/* Recurrence Badge */}
                          {task.recurrence && (
                            <span
                              title={`Repeats ${task.recurrence.frequency}`}
                              className="text-[9px] font-serif font-bold uppercase text-stone-500 dark:text-stone-400 flex items-center gap-0.5"
                            >
                              <Repeat className="w-2.5 h-2.5 text-[#B88939]" />
                              {task.recurrence.frequency}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Controls (Move Up/Down, Reminder, Edit, Delete Confirmation) */}
                    {!isEditing && (
                      <div className="flex items-center gap-0.5">
                        {/* Reorder Up/Down buttons */}
                        {onMoveTask && tasks.length > 1 && (
                          <div className="opacity-0 group-hover:opacity-100 flex flex-col -my-1 transition-opacity">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => onMoveTask(day, task.id, 'up')}
                                title="Move task up"
                                className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                              >
                                <ChevronUp className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {idx < tasks.length - 1 && (
                              <button
                                type="button"
                                onClick={() => onMoveTask(day, task.id, 'down')}
                                title="Move task down"
                                className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                              >
                                <ChevronDown className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Reminder Bell Button */}
                        <button
                          type="button"
                          onClick={() => setReminderModalTask(task)}
                          title={hasReminder ? `Reminder set for ${formatTime12h(task.reminder!.time)}` : 'Set task reminder'}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            hasReminder
                              ? reminderEnabled
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                              : 'opacity-0 group-hover:opacity-100 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                          }`}
                        >
                          <Bell className="w-3 h-3" />
                        </button>

                        {/* Edit inline button */}
                        <button
                          type="button"
                          onClick={() => startEdit(task)}
                          title="Edit task (tap to rename)"
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-opacity"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {/* Delete with Confirmation State */}
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/60 p-0.5 rounded border border-red-200 dark:border-red-800">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteTask(day, task.id);
                                setConfirmDeleteTaskId(null);
                              }}
                              className="px-1.5 py-0.5 bg-red-700 text-white text-[9px] font-bold rounded cursor-pointer"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTaskId(null)}
                              className="px-1 py-0.5 text-stone-600 dark:text-stone-400 text-[9px] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteTaskId(task.id)}
                            title="Delete task"
                            className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-700 rounded hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Active Reminder Chip if configured */}
                  {hasReminder && (
                    <div
                      onClick={() => setReminderModalTask(task)}
                      className={`self-start ml-6 px-1.5 py-0.5 text-[9px] font-bold rounded flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 ${
                        reminderEnabled ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700' : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 line-through'
                      }`}
                      title="Click to edit reminder"
                    >
                      <Clock className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />
                      <span>{formatTime12h(task.reminder!.time)}</span>
                      {task.reminder!.isRecurring ? (
                        <span className="flex items-center gap-0.5 text-[8px] bg-[#1C1917] text-[#D4AF37] px-1 rounded">
                          <Repeat className="w-2 h-2" /> DAILY
                        </span>
                      ) : (
                        <span className="text-[8px] text-stone-600 dark:text-stone-400">({day})</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Small footer showing "Done: X / Left: Y" counts */}
      <div className="px-3 py-2 bg-[#F7F3EB] dark:bg-[#221E1A] border-t border-[#EAE3D5] dark:border-[#2E2820] flex items-center justify-between text-[10px] font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
        <span>Done: {completedCount}</span>
        <span className="text-stone-300 dark:text-stone-600 font-sans">|</span>
        <span>Left: {leftCount}</span>
      </div>

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


