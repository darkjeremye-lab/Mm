import React, { useState, useEffect } from 'react';
import {
  AcademicState,
  DashboardLayout,
  DayOfWeek,
  DAYS_OF_WEEK,
  DAY_FULL_NAMES,
  FocusSession,
  HabitItem,
  OffDaysMap,
  RecurrenceFrequency,
  TaskItem,
  TaskPriority,
  TaskRecurrence,
  TaskReminder,
  ThemeConfig,
  WeeklyNotes,
} from '../types';
import { TopStackedPanel } from './TopStackedPanel';
import { OverallProgressPanel } from './OverallProgressPanel';
import { DayCard } from './DayCard';
import { DayListCard } from './DayListCard';
import { DailyQuoteSignature } from './DailyQuoteSignature';
import { FocusWritingView } from './FocusWritingView';
import { SmartDashboardHero } from './SmartDashboardHero';
import { computeSmartDashboardMetrics } from '../utils/gamificationUtils';
import { getCurrentDayOfWeek } from '../utils/notificationService';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  LayoutGrid,
  List,
  Layers,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import { getMondayOfWeek, shiftWeek } from '../utils/dateUtils';

interface DashboardPageProps {
  tasksByDay: Record<DayOfWeek, TaskItem[]>;
  habits: HabitItem[];
  notes: WeeklyNotes;
  theme: ThemeConfig;
  dayDates: Record<DayOfWeek, { label: string; fullDate: string; isToday: boolean }>;
  offDays?: OffDaysMap;
  academicState?: AcademicState;
  focusSessions?: FocusSession[];
  onToggleOffDay?: (dateISO: string, reason?: 'rest' | 'sick' | 'travel' | 'retreat') => void;
  onSaveNotes: (updated: WeeklyNotes) => void;
  onClearNotes: () => void;
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
  onToggleTask: (day: DayOfWeek, taskId: string) => void;
  onEditTask: (day: DayOfWeek, taskId: string, newText: string) => void;
  onDeleteTask: (day: DayOfWeek, taskId: string) => void;
  onMoveTask?: (day: DayOfWeek, taskId: string, direction: 'up' | 'down') => void;
  onMoveTaskToDay?: (fromDay: DayOfWeek, toDay: DayOfWeek, taskId: string) => void;
  onRescheduleAllOverdueToToday?: () => void;
  onStartFocus?: (task?: TaskItem, day?: DayOfWeek) => void;
  onUpdateTaskMetadata?: (day: DayOfWeek, taskId: string, updates: Partial<TaskItem>) => void;
  onSaveTaskReminder: (day: DayOfWeek, taskId: string, reminder: TaskReminder | undefined) => void;
  onNavigateWeek: (offsetWeeks: number) => void;
  onResetToCurrentWeek: () => void;
  onSelectWeek?: (startOfWeekISO: string) => void;
  onOpenMonthlyView?: () => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  onOpenSettings?: () => void;
}

const DASHBOARD_LAYOUT_STORAGE_KEY = 'luxury_planner_dashboard_layout';

export const DashboardPage: React.FC<DashboardPageProps> = ({
  tasksByDay,
  habits,
  notes,
  theme,
  dayDates,
  offDays = {},
  academicState,
  focusSessions,
  onToggleOffDay,
  onSaveNotes,
  onClearNotes,
  onAddTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  onMoveTaskToDay,
  onRescheduleAllOverdueToToday,
  onStartFocus,
  onUpdateTaskMetadata,
  onSaveTaskReminder,
  onNavigateWeek,
  onResetToCurrentWeek,
  onSelectWeek,
  onOpenMonthlyView,
  focusMode = false,
  onToggleFocusMode,
  onOpenSettings,
}) => {
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);
      if (saved === 'list' || saved === 'grid') return saved;
    } catch {
      // Fallback
    }
    return 'grid';
  });

  const todayDay = getCurrentDayOfWeek();
  const smartStats = computeSmartDashboardMetrics(
    todayDay,
    tasksByDay,
    habits,
    academicState,
    offDays,
    notes.startOfWeek,
    new Date(),
    focusSessions
  );

  const handleSetLayout = (newLayout: DashboardLayout) => {
    setLayout(newLayout);
    try {
      localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, newLayout);
    } catch {
      // Ignore
    }
  };

  const scrollToDayList = (day: DayOfWeek) => {
    const el = document.getElementById(`day-list-card-${day.toLowerCase()}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const startLabel = dayDates.Mon?.label || 'Mon';
  const endLabel = dayDates.Sun?.label || 'Sun';

  // Calculate total weekly stats
  const allTasksCount = DAYS_OF_WEEK.reduce((acc, d) => acc + (tasksByDay[d]?.length || 0), 0);
  const completedTasksCount = DAYS_OF_WEEK.reduce(
    (acc, d) => acc + (tasksByDay[d]?.filter((t) => t.completed).length || 0),
    0
  );

  // If Global Focus Mode is enabled: render the distraction-free weekly notes sanctuary
  if (focusMode) {
    return (
      <FocusWritingView
        notes={notes}
        onSaveNotes={onSaveNotes}
        onClearNotes={onClearNotes}
        theme={theme}
        startLabel={startLabel}
        endLabel={endLabel}
        onWeekChange={onSelectWeek}
        onExitFocusMode={onToggleFocusMode || (() => {})}
        onOpenSettings={onOpenSettings}
      />
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Strategic Quote Signature */}
      <DailyQuoteSignature theme={theme} />

      {/* SMART DASHBOARD: Today's Executive Brief, Metrics, Next Up, Overdue & Quick Add */}
      <SmartDashboardHero
        stats={smartStats}
        theme={theme}
        onToggleTask={onToggleTask}
        onAddTask={onAddTask}
        onMoveTaskToDay={onMoveTaskToDay}
        onRescheduleAllOverdueToToday={onRescheduleAllOverdueToToday}
        onStartFocus={onStartFocus}
      />

      {/* Week Selector Strip */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-3.5 sm:p-4 shadow-[0_4px_16px_rgba(20,18,15,0.06)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-[#1C1917] text-[#D4AF37] shadow-xs">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-sans font-semibold text-[#B88939] uppercase tracking-wider block">
              Active Weekly Cycle
            </span>
            <span className="text-sm sm:text-base font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {startLabel} — {endLabel}
            </span>
          </div>
        </div>

        {/* Week navigation buttons & Monthly Horizon Jump */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenMonthlyView && (
            <button
              type="button"
              onClick={onOpenMonthlyView}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold uppercase rounded bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-[#B88939] dark:text-[#E2BE7A] hover:bg-[#F7F3EB] dark:hover:bg-[#2C261F] cursor-pointer shadow-xs active:scale-95 transition-all"
              title="Open Monthly View"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Monthly Horizon</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateWeek(-1)}
            title="Previous Week"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-serif font-bold uppercase rounded bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-800 dark:text-stone-200 hover:bg-[#F7F3EB] dark:hover:bg-[#2C261F] hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <button
            type="button"
            onClick={onResetToCurrentWeek}
            title="Jump to Current Week"
            className="px-3.5 py-1.5 text-xs font-serif font-bold uppercase rounded bg-[#1C1917] text-[#D4AF37] hover:bg-stone-800 cursor-pointer shadow-xs active:scale-95 transition-all border border-amber-900/30"
          >
            Current Week
          </button>

          <button
            type="button"
            onClick={() => onNavigateWeek(1)}
            title="Next Week"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-serif font-bold uppercase rounded bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-800 dark:text-stone-200 hover:bg-[#F7F3EB] dark:hover:bg-[#2C261F] hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TOP SECTION: Left Stacked Panel (4 boxes) + Right Overall Progress Panel */}
      <section className="flex flex-col lg:flex-row gap-5 items-stretch">
        <TopStackedPanel
          notes={notes}
          onSaveNotes={onSaveNotes}
          onClearNotes={onClearNotes}
          theme={theme}
          onWeekChange={onSelectWeek}
        />

        <OverallProgressPanel
          tasksByDay={tasksByDay}
          theme={theme}
          dayDates={dayDates}
          offDays={offDays}
        />
      </section>

      {/* DAILY MASTER SCHEDULE SECTION (With View Layout Toggle) */}
      <section className="flex flex-col gap-3">
        {/* Section Header & Layout Toggle Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-3 sm:px-4 sm:py-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Daily Master Schedule
              </span>
              <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                {completedTasksCount}/{allTasksCount} Done
              </span>
            </div>

            <span className="text-[11px] font-sans text-stone-500 dark:text-stone-400 hidden md:inline">
              {layout === 'grid'
                ? 'Column Grid: 7-day side-by-side weekly overview'
                : 'Vertical List: Spacious rows with filters for heavy daily schedules'}
            </span>
          </div>

          {/* View Layout Segmented Switcher */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 hidden xs:inline">
              View:
            </span>
            <div className="inline-flex p-0.5 bg-[#EAE3D5] dark:bg-[#24201B] rounded-md border border-[#D8CFBF] dark:border-[#3D352B] shadow-2xs">
              <button
                type="button"
                onClick={() => handleSetLayout('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-serif font-bold uppercase rounded transition-all cursor-pointer ${
                  layout === 'grid'
                    ? 'bg-[#1C1917] text-[#D4AF37] shadow-xs'
                    : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-[#2E2822]'
                }`}
                title="Switch to 7-Column Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Column Grid</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetLayout('list')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-serif font-bold uppercase rounded transition-all cursor-pointer ${
                  layout === 'list'
                    ? 'bg-[#1C1917] text-[#D4AF37] shadow-xs'
                    : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-[#2E2822]'
                }`}
                title="Switch to Vertical List View for high-density schedules"
              >
                <List className="w-3.5 h-3.5" />
                <span>Vertical List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Day Jump Bar (Only in Vertical List mode for fast navigation) */}
        {layout === 'list' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-1">
            <span className="text-[10px] font-serif font-bold uppercase text-stone-500 whitespace-nowrap mr-1">
              Jump to Day:
            </span>
            {DAYS_OF_WEEK.map((day) => {
              const isToday = dayDates[day]?.isToday;
              const dayTasks = tasksByDay[day] || [];
              const dayDone = dayTasks.filter((t) => t.completed).length;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => scrollToDayList(day)}
                  className={`px-2.5 py-1 text-xs font-serif font-bold uppercase rounded border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isToday
                      ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/40 shadow-xs ring-1 ring-[#B88939]'
                      : 'bg-white border-[#D8CFBF] text-stone-800 hover:bg-[#F7F3EB] hover:border-stone-400'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                  )}
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-sans font-semibold opacity-75">
                      ({dayDone}/{dayTasks.length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* LAYOUT 1: Column Grid View (7 Columns: Mon to Sun) */}
        {layout === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 pb-2 overflow-x-auto">
            {DAYS_OF_WEEK.map((day) => (
              <DayCard
                key={day}
                day={day}
                dateInfo={dayDates[day]}
                tasks={tasksByDay[day] || []}
                theme={theme}
                offDayConfig={offDays[dayDates[day]?.fullDate]}
                onToggleOffDay={onToggleOffDay}
                onAddTask={onAddTask}
                onToggleTask={onToggleTask}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onMoveTask={onMoveTask}
                onMoveTaskToDay={onMoveTaskToDay}
                onUpdateTaskMetadata={onUpdateTaskMetadata}
                onSaveTaskReminder={onSaveTaskReminder}
              />
            ))}
          </div>
        )}

        {/* LAYOUT 2: Vertical List View (Full-width sequential day rows) */}
        {layout === 'list' && (
          <div className="flex flex-col gap-4 pb-4">
            {DAYS_OF_WEEK.map((day) => (
              <DayListCard
                key={day}
                day={day}
                dateInfo={dayDates[day]}
                tasks={tasksByDay[day] || []}
                theme={theme}
                offDayConfig={offDays[dayDates[day]?.fullDate]}
                onToggleOffDay={onToggleOffDay}
                onAddTask={onAddTask}
                onToggleTask={onToggleTask}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onMoveTask={onMoveTask}
                onMoveTaskToDay={onMoveTaskToDay}
                onUpdateTaskMetadata={onUpdateTaskMetadata}
                onSaveTaskReminder={onSaveTaskReminder}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
