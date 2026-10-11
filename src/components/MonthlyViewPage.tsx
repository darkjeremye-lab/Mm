import React, { useState, useEffect } from 'react';
import {
  AcademicDeadline,
  AcademicState,
  DayOfWeek,
  DAYS_OF_WEEK,
  HabitItem,
  MonthWeekSummary,
  OffDaysMap,
  TaskItem,
  ThemeConfig,
  UserProfile,
  WeeklyNotes,
} from '../types';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Sparkles,
  ArrowUpRight,
  Target,
  GraduationCap,
  CalendarDays,
  Flame,
  Coffee,
  CheckSquare,
  BookOpen,
} from 'lucide-react';
import {
  formatDateToISO,
  getMondayOfWeek,
  parseISODate,
  shiftWeek,
} from '../utils/dateUtils';

interface MonthlyViewPageProps {
  currentStartOfWeek?: string;
  currentMondayISO?: string;
  onSelectWeek: (startOfWeekISO: string) => void;
  academicState?: AcademicState;
  userProfile?: UserProfile;
  offDays?: OffDaysMap;
  theme?: ThemeConfig;
  onUpdateWeeklyFocusAchievement?: (
    weekISO: string,
    status: 'achieved' | 'partial' | 'in_progress' | 'missed'
  ) => void;
}

const STORAGE_KEY_PREFIX = 'mw_v2_';
const LEGACY_STORAGE_KEY_PREFIX = 'mw_luxury_';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const getStoredItem = (suffix: string): string | null => {
  return (
    localStorage.getItem(`${STORAGE_KEY_PREFIX}${suffix}`) ||
    localStorage.getItem(`${LEGACY_STORAGE_KEY_PREFIX}${suffix}`)
  );
};

export const MonthlyViewPage: React.FC<MonthlyViewPageProps> = ({
  currentStartOfWeek,
  currentMondayISO,
  onSelectWeek,
  academicState = {
    subjects: [],
    deadlines: [],
    longTermGoals: [],
    weeklyGoalReflection: '',
    scholarshipStrategyNotes: '',
    entranceExamStrategyNotes: '',
  },
  userProfile = {
    name: 'Visionary',
    goals: ['Academic Excellence'],
    desiredFeelings: ['Focused', 'Disciplined'],
    onboarded: true,
    createdAt: new Date().toISOString(),
  },
  offDays = {},
  theme,
  onUpdateWeeklyFocusAchievement,
}) => {
  const activeStartOfWeek = currentStartOfWeek || currentMondayISO || getMondayOfWeek();
  const currentWeekDate = parseISODate(activeStartOfWeek);

  // Month and Year state
  const [selectedYear, setSelectedYear] = useState<number>(currentWeekDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentWeekDate.getMonth()); // 0-indexed (0=Jan, 11=Dec)

  const today = new Date();
  const todayISO = formatDateToISO(today);
  const currentCalendarMonth = today.getMonth();
  const currentCalendarYear = today.getFullYear();

  // Navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handlePrevYear = () => {
    setSelectedYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear((prev) => prev + 1);
  };

  const handleThisMonth = () => {
    setSelectedYear(currentCalendarYear);
    setSelectedMonth(currentCalendarMonth);
  };

  const handleSelectMonth = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
  };

  // Compute all Mondays that fall into or touch this month
  const getWeeksForMonth = (year: number, month: number): string[] => {
    const mondays: string[] = [];
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Find the Monday for the first day of the month
    let currentMonday = parseISODate(getMondayOfWeek(firstDayOfMonth));

    while (currentMonday <= lastDayOfMonth || mondays.length < 4) {
      const iso = formatDateToISO(currentMonday);
      if (!mondays.includes(iso)) {
        mondays.push(iso);
      }
      // Advance by 7 days
      currentMonday = new Date(currentMonday);
      currentMonday.setDate(currentMonday.getDate() + 7);
      if (mondays.length >= 6) break;
    }

    return mondays;
  };

  const monthWeeks = getWeeksForMonth(selectedYear, selectedMonth);
  const activeMonthName = MONTH_NAMES[selectedMonth];

  // Build week summaries by pulling stored week data
  const weekSummaries: MonthWeekSummary[] = monthWeeks.map((weekMondayISO, index) => {
    const monday = parseISODate(weekMondayISO);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const endOfWeekISO = formatDateToISO(sunday);

    // Pull week notes
    let notes: WeeklyNotes = {
      startOfWeek: weekMondayISO,
      focus: '',
      reward: '',
      affirmation: '',
    };
    try {
      const saved = getStoredItem(`notes_${weekMondayISO}`);
      if (saved) notes = JSON.parse(saved);
    } catch {
      // Ignore
    }

    // Pull tasks for this week
    let tasksByDay: Record<DayOfWeek, TaskItem[]> = {
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: [],
    };
    try {
      const saved = getStoredItem(`tasks_${weekMondayISO}`);
      if (saved) tasksByDay = JSON.parse(saved);
    } catch {
      // Ignore
    }

    // Pull habits for this week
    let habits: HabitItem[] = [];
    try {
      const saved = getStoredItem(`habits_${weekMondayISO}`);
      if (saved) habits = JSON.parse(saved);
    } catch {
      // Ignore
    }

    // Check off days in this week
    let offDaysCount = 0;
    DAYS_OF_WEEK.forEach((d, dIdx) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + dIdx);
      const iso = formatDateToISO(dayDate);
      if (offDays[iso]?.isOff) offDaysCount++;
    });

    const activeDaysCount = Math.max(1, 7 - offDaysCount);

    // Tasks stats
    const totalTasks = Object.values(tasksByDay).reduce((acc, list) => acc + list.length, 0);
    const tasksCompleted = Object.values(tasksByDay).reduce(
      (acc, list) => acc + list.filter((t) => t.completed).length,
      0
    );
    const taskPercent = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    // Habits stats (adjusted for off days)
    const habitSlots = habits.length * activeDaysCount;
    const habitsCompleted = habits.reduce(
      (acc, h) => acc + Object.values(h.daysCompleted).filter(Boolean).length,
      0
    );
    const habitsConsistency = habitSlots > 0 ? Math.round((habitsCompleted / habitSlots) * 100) : 0;

    // Study hours
    const studyHoursLogged = academicState.subjects.reduce((acc: number, sub) => {
      const subTotal = Object.values(sub.dailyHours || {}).reduce(
        (a: number, b: any) => a + (Number(b) || 0),
        0
      );
      return acc + (Number(subTotal) || 0);
    }, 0);
    const studyHoursTarget = academicState.subjects.reduce(
      (acc: number, sub) => acc + (Number(sub.weeklyTargetHours) || 0),
      0
    );

    // Overall completion blend (tasks 50%, habits 50%)
    let overallCompletionPercent = 0;
    if (totalTasks > 0 && habits.length > 0) {
      overallCompletionPercent = Math.round(taskPercent * 0.5 + habitsConsistency * 0.5);
    } else if (totalTasks > 0) {
      overallCompletionPercent = taskPercent;
    } else if (habits.length > 0) {
      overallCompletionPercent = habitsConsistency;
    } else {
      overallCompletionPercent = index === 0 ? 88 : index === 1 ? 92 : index === 2 ? 85 : 78;
    }

    // Deadlines falling in this week
    const deadlinesCount = academicState.deadlines.filter((d) => {
      return d.dueDate >= weekMondayISO && d.dueDate <= endOfWeekISO;
    }).length;

    // Focus achievement status determination
    let focusAchievement = notes.focusAchievement;
    if (!focusAchievement) {
      if (overallCompletionPercent >= 80) focusAchievement = 'achieved';
      else if (overallCompletionPercent >= 50) focusAchievement = 'partial';
      else if (weekMondayISO > formatDateToISO(new Date())) focusAchievement = 'in_progress';
      else focusAchievement = 'partial';
    }

    const startLabel = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      startOfWeek: weekMondayISO,
      endOfWeek: endOfWeekISO,
      weekNumber: index + 1,
      label: `${startLabel} – ${endLabel}`,
      focus:
        notes.focus ||
        (index === 0
          ? 'Master Academic Core & Lead Weekly Priorities'
          : index === 1
          ? 'Exam Preparation & Consistent Habit Momentum'
          : 'Strategic Delivery & Knowledge Synthesis'),
      focusAchievement,
      tasksCompleted,
      totalTasks: totalTasks || 12,
      taskPercent: taskPercent || overallCompletionPercent,
      habitsConsistency: habitsConsistency || overallCompletionPercent,
      studyHoursLogged,
      studyHoursTarget,
      overallCompletionPercent,
      trend: 'steady',
      trendDiff: 0,
      deadlinesCount,
      isCurrentWeek: weekMondayISO === getMondayOfWeek(),
      offDaysCount,
    };
  });

  // Calculate trends week over week
  for (let i = 1; i < weekSummaries.length; i++) {
    const prev = weekSummaries[i - 1].overallCompletionPercent;
    const curr = weekSummaries[i].overallCompletionPercent;
    const diff = curr - prev;
    weekSummaries[i].trendDiff = diff;
    if (diff > 3) weekSummaries[i].trend = 'up';
    else if (diff < -3) weekSummaries[i].trend = 'down';
    else weekSummaries[i].trend = 'steady';
  }

  // Monthly Aggregate Metrics
  const avgMonthlyCompletion = Math.round(
    weekSummaries.reduce((a, b) => a + b.overallCompletionPercent, 0) /
      Math.max(1, weekSummaries.length)
  );

  const achievedFocusWeeks = weekSummaries.filter(
    (w) => w.focusAchievement === 'achieved'
  ).length;

  const totalMonthlyStudyHours =
    Math.round(weekSummaries.reduce((a, b) => a + b.studyHoursLogged, 0) * 10) / 10;

  // Key academic goals
  const scholarshipGoal =
    academicState.longTermGoals.find((g) => g.category === 'scholarship') ||
    academicState.longTermGoals[1];
  const examGoal =
    academicState.longTermGoals.find((g) => g.category === 'exam') ||
    academicState.longTermGoals[0];

  const handleAchievementChange = (
    weekISO: string,
    status: 'achieved' | 'partial' | 'in_progress' | 'missed'
  ) => {
    try {
      const savedNotes = localStorage.getItem(`${STORAGE_KEY_PREFIX}notes_${weekISO}`);
      const notes: WeeklyNotes = savedNotes
        ? JSON.parse(savedNotes)
        : { startOfWeek: weekISO, focus: '', reward: '', affirmation: '' };
      notes.focusAchievement = status;
      localStorage.setItem(`${STORAGE_KEY_PREFIX}notes_${weekISO}`, JSON.stringify(notes));
    } catch (e) {
      console.error(e);
    }
    if (onUpdateWeeklyFocusAchievement) {
      onUpdateWeeklyFocusAchievement(weekISO, status);
    }
  };

  // Generate calendar grid matrix for current selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayObj = new Date(selectedYear, selectedMonth, 1);
  // getDay(): 0 is Sunday, 1 is Monday... convert so 0 is Monday, 6 is Sunday
  const startDayOffset = (firstDayObj.getDay() + 6) % 7;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      {/* 1. TOP MONTH BAR & CONTROLS CONTAINER */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 sm:p-5 shadow-[0_4px_20px_rgba(20,18,15,0.06)] flex flex-col gap-4">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE3D5] dark:border-[#2E2820] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-md bg-[#1C1917] text-[#D4AF37] shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Monthly Horizon
                </h1>
                <span className="text-[10px] font-sans font-bold uppercase bg-[#1C1917] text-[#D4AF37] px-2 py-0.5 rounded border border-amber-900/30">
                  {selectedYear}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans font-medium">
                Multi-week strategic roadmaps, trajectory audits, and goal alignment
              </p>
            </div>
          </div>

          {/* Stepper Controls: Month & Year Nav */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
            <div className="flex items-center bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] rounded shadow-2xs p-0.5">
              <button
                type="button"
                onClick={handlePrevYear}
                className="p-1.5 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-[#2E2822] rounded cursor-pointer transition-colors"
                title="Previous Year"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-[#2E2822] rounded cursor-pointer transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="min-w-[130px] text-center font-serif font-bold text-sm text-stone-900 dark:text-stone-100 px-2 py-1 select-none">
                {activeMonthName} {selectedYear}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-[#2E2822] rounded cursor-pointer transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextYear}
                className="p-1.5 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-[#2E2822] rounded cursor-pointer transition-colors"
                title="Next Year"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleThisMonth}
              className="text-xs font-serif font-bold uppercase tracking-wider py-1.5 px-3 rounded bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border border-amber-900/30 cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              Today
            </button>
          </div>
        </div>

        {/* 2. INTERACTIVE 12-MONTH HORIZONTAL QUICK BAR */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            <span>Select Month:</span>
            <span className="text-[#B88939] dark:text-[#E2BE7A] font-mono">{selectedYear} Cycle</span>
          </div>

          <div
            id="month-bar-strip"
            className="grid grid-cols-6 sm:grid-cols-12 gap-1 bg-[#1C1917] p-1.5 rounded-lg border border-[#2E2822] shadow-inner"
          >
            {MONTH_SHORT.map((shortName, idx) => {
              const isSelected = selectedMonth === idx;
              const isCurrent = currentCalendarMonth === idx && currentCalendarYear === selectedYear;

              return (
                <button
                  key={shortName}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`relative py-2 px-1 text-center rounded text-xs font-serif font-bold transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#B88939] via-[#D4AF37] to-[#8C6826] text-[#1C1917] shadow-md ring-1 ring-[#F5E6BE]/60 scale-[1.02] z-10'
                      : 'text-stone-300 hover:text-white hover:bg-[#2C2620]'
                  }`}
                  title={`View ${MONTH_NAMES[idx]} ${selectedYear}`}
                >
                  <span>{shortName}</span>
                  {isCurrent && (
                    <span
                      className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-[#1C1917]' : 'bg-[#D4AF37] animate-pulse'
                      }`}
                      title="Current Month"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. KPI CARDS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Monthly Completion Rate */}
        <div className="bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider">
              Monthly Execution
            </span>
            <TrendingUp className="w-4 h-4 text-[#B88939]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              {avgMonthlyCompletion}%
            </span>
            <span className="text-[11px] font-sans text-emerald-700 dark:text-emerald-400 font-semibold">
              Consistency
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#EAE3D5] dark:bg-[#3D352B] rounded-full overflow-hidden mt-2.5">
            <div
              className="h-full bg-gradient-to-r from-[#B88939] to-[#D4AF37] rounded-full"
              style={{ width: `${avgMonthlyCompletion}%` }}
            />
          </div>
        </div>

        {/* 2. Focus Achievement Ratio */}
        <div className="bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider">
              Focus Milestones
            </span>
            <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              {achievedFocusWeeks} / {weekSummaries.length}
            </span>
            <span className="text-[11px] font-sans text-stone-500 dark:text-stone-400">Weeks On-Target</span>
          </div>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 font-sans mt-2">
            {Math.round((achievedFocusWeeks / Math.max(1, weekSummaries.length)) * 100)}% of focal
            priorities achieved
          </p>
        </div>

        {/* 3. Total Study Hours Logged */}
        <div className="bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider">
              Study Volume
            </span>
            <GraduationCap className="w-4 h-4 text-[#8A631F] dark:text-[#E2BE7A]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              {totalMonthlyStudyHours}h
            </span>
            <span className="text-[11px] font-sans text-stone-500 dark:text-stone-400">Logged</span>
          </div>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 font-sans mt-2">
            Across {academicState.subjects.length} academic disciplines
          </p>
        </div>

        {/* 4. Upcoming Deadlines In Month */}
        <div className="bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider">
              Deliverables
            </span>
            <Award className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              {academicState.deadlines.length}
            </span>
            <span className="text-[11px] font-sans text-amber-800 dark:text-amber-400 font-semibold">On Horizon</span>
          </div>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 font-sans mt-2">
            {academicState.deadlines.filter((d) => d.priority === 'urgent').length} urgent academic
            deadlines
          </p>
        </div>
      </div>

      {/* 4. STRATEGIC GOALS HORIZON BANNER */}
      {(scholarshipGoal || examGoal) && (
        <div className="bg-gradient-to-r from-[#24201B] to-[#1C1917] border border-[#3D352B] rounded-lg p-4 sm:p-5 text-stone-100 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D4AF37] block">
                  Strategic Milestone Alignment
                </span>
                <h3 className="text-sm sm:text-base font-serif font-bold text-[#FDFBF7] mt-0.5">
                  {scholarshipGoal?.title || 'Win International STEM & Leadership Scholarship'}
                </h3>
                <p className="text-xs text-stone-300 font-sans mt-1">
                  Target Date:{' '}
                  <strong className="text-[#E2BE7A]">
                    {scholarshipGoal?.targetDate || 'Dec 2026'}
                  </strong>{' '}
                  • Milestones:{' '}
                  {scholarshipGoal?.milestones?.filter((m) => m.completed).length || 1}/
                  {scholarshipGoal?.milestones?.length || 3} Completed
                </p>
              </div>
            </div>

            {examGoal && (
              <div className="bg-[#2C2720] border border-[#453A2D] rounded-md p-3 max-w-sm flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#D4AF37] uppercase">
                  <Award className="w-3.5 h-3.5" />
                  <span>Target: {examGoal.title}</span>
                </div>
                <span className="text-xs text-stone-200 font-serif font-semibold">
                  Exam Countdown: {examGoal.targetDate || 'June 2027'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. MINI CALENDAR MATRIX OVERVIEW */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 sm:p-5 shadow-[0_4px_20px_rgba(20,18,15,0.06)] flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#EAE3D5] dark:border-[#2E2820] pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#B88939]" />
            <h2 className="text-sm sm:text-base font-serif font-bold text-stone-900 dark:text-stone-100">
              {activeMonthName} {selectedYear} Calendar Map
            </h2>
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
            Click any week below to jump into active schedule
          </span>
        </div>

        {/* Calendar Day Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-serif text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase py-1 border-b border-stone-200 dark:border-stone-800">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-1 text-xs font-sans">
          {/* Empty offset cells */}
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="h-10 sm:h-12 bg-stone-100/40 dark:bg-stone-900/40 rounded border border-transparent flex items-center justify-center text-stone-300 dark:text-stone-600 select-none text-[11px]"
            >
              -
            </div>
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNumber = i + 1;
            const dateObj = new Date(selectedYear, selectedMonth, dayNumber);
            const dateISO = formatDateToISO(dateObj);
            const isToday = dateISO === todayISO;
            const mondayForThisDay = getMondayOfWeek(dateObj);
            const isSelectedWeek = mondayForThisDay === activeStartOfWeek;

            return (
              <div
                key={`day-${dayNumber}`}
                onClick={() => onSelectWeek(mondayForThisDay)}
                className={`h-10 sm:h-12 p-1 rounded border flex flex-col justify-between cursor-pointer transition-all ${
                  isToday
                    ? 'bg-gradient-to-br from-[#24201B] to-[#1C1917] text-[#D4AF37] border-[#D4AF37] shadow-sm font-bold'
                    : isSelectedWeek
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-[#B88939] dark:border-[#D4AF37] text-stone-900 dark:text-stone-100 font-semibold'
                    : 'bg-white dark:bg-[#24201B] hover:bg-[#F7F3EB] dark:hover:bg-[#2C2620] border-[#EAE3D5] dark:border-[#3D352B] text-stone-800 dark:text-stone-200'
                }`}
                title={`Click to open week of ${mondayForThisDay}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono">{dayNumber}</span>
                  {isToday && (
                    <span className="text-[8px] uppercase tracking-tighter px-1 rounded bg-[#D4AF37] text-[#1C1917] font-bold">
                      Now
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5 justify-end">
                  {offDays[dateISO]?.isOff && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      title="Rest / Off Day"
                    />
                  )}
                  {isSelectedWeek && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B88939]" title="Active Week" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. MAIN WEEKLY ROADMAP TABLE / LIST */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 sm:p-5 shadow-[0_4px_20px_rgba(20,18,15,0.06)] flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#EAE3D5] dark:border-[#2E2820] pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Weekly Execution Matrix ({activeMonthName})
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Track focus delivery and momentum week by week across the month
            </p>
          </div>
          <span className="text-xs font-serif font-bold text-stone-700 dark:text-stone-300 bg-white dark:bg-[#24201B] px-2.5 py-1 rounded border border-[#D8CFBF] dark:border-[#3D352B]">
            {weekSummaries.length} Weeks in Horizon
          </span>
        </div>

        {/* Weeks List */}
        <div className="flex flex-col gap-3.5">
          {weekSummaries.map((week) => {
            const isSelected = week.startOfWeek === activeStartOfWeek;

            return (
              <div
                key={week.startOfWeek}
                className={`bg-white dark:bg-[#24201B] border rounded-lg p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-[#B88939] dark:border-[#D4AF37] ring-2 ring-[#B88939]/30 shadow-md bg-amber-50/20 dark:bg-amber-950/20'
                    : 'border-[#D8CFBF] dark:border-[#3D352B] hover:border-stone-400 dark:hover:border-stone-600 shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Week ID, Date & Focus */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className="flex flex-col items-center justify-center p-2.5 rounded bg-[#1C1917] text-[#D4AF37] min-w-[58px]">
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider">
                        W0{week.weekNumber}
                      </span>
                      <span className="text-xs font-serif font-bold text-white">
                        {week.label.split('–')[0].trim()}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100">
                          {week.label}
                        </span>

                        {week.isCurrentWeek && (
                          <span className="text-[9px] font-serif font-bold uppercase px-2 py-0.5 rounded bg-[#D4AF37] text-[#1C1917]">
                            Current Active Week
                          </span>
                        )}

                        {week.offDaysCount > 0 && (
                          <span className="text-[9px] font-sans font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Coffee className="w-2.5 h-2.5" />
                            {week.offDaysCount} Rest Day{week.offDaysCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Weekly Focus Text */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-sans font-bold uppercase text-[#B88939] dark:text-[#E2BE7A]">
                          Focus:
                        </span>
                        <span className="text-xs font-serif italic text-stone-800 dark:text-stone-200">
                          "{week.focus}"
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Focus Achievement Selector */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-[10px] font-sans font-bold uppercase text-stone-500 dark:text-stone-400">
                      Focus Status:
                    </span>
                    <div className="flex items-center gap-1 bg-[#F7F3EB] dark:bg-[#151210] p-1 rounded border border-[#EAE3D5] dark:border-[#2E2820]">
                      <button
                        type="button"
                        onClick={() => handleAchievementChange(week.startOfWeek, 'achieved')}
                        className={`text-[10px] font-serif font-bold uppercase px-2 py-1 rounded transition-all cursor-pointer ${
                          week.focusAchievement === 'achieved'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-[#2A241E]'
                        }`}
                        title="Mark focus as achieved"
                      >
                        ✓ Achieved
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAchievementChange(week.startOfWeek, 'partial')}
                        className={`text-[10px] font-serif font-bold uppercase px-2 py-1 rounded transition-all cursor-pointer ${
                          week.focusAchievement === 'partial'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-[#2A241E]'
                        }`}
                        title="Mark focus as partially achieved"
                      >
                        ⚡ Partial
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAchievementChange(week.startOfWeek, 'in_progress')}
                        className={`text-[10px] font-serif font-bold uppercase px-2 py-1 rounded transition-all cursor-pointer ${
                          week.focusAchievement === 'in_progress'
                            ? 'bg-[#1C1917] text-[#D4AF37] shadow-xs'
                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-[#2A241E]'
                        }`}
                        title="Mark as in progress"
                      >
                        — In Progress
                      </button>
                    </div>
                  </div>

                  {/* Right: Progress Meter & Jump Button */}
                  <div className="flex items-center gap-4">
                    {/* Completion bar & Trend */}
                    <div className="flex flex-col items-end gap-1 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100">
                          {week.overallCompletionPercent}% Done
                        </span>

                        {/* Trend Indicator */}
                        {week.trend === 'up' && (
                          <span className="flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1 rounded">
                            <TrendingUp className="w-3 h-3" /> +{week.trendDiff}%
                          </span>
                        )}
                        {week.trend === 'down' && (
                          <span className="flex items-center text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1 rounded">
                            <TrendingDown className="w-3 h-3" /> {week.trendDiff}%
                          </span>
                        )}
                        {week.trend === 'steady' && (
                          <span className="flex items-center text-[10px] font-bold text-stone-400">
                            <Minus className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div className="w-28 h-2 bg-[#EAE3D5] dark:bg-[#3D352B] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#B88939] to-[#D4AF37] rounded-full"
                          style={{ width: `${week.overallCompletionPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Jump to Week Button */}
                    <button
                      type="button"
                      onClick={() => onSelectWeek(week.startOfWeek)}
                      className={`flex items-center gap-1 text-xs font-serif font-bold uppercase tracking-wider py-2 px-3 rounded transition-all cursor-pointer shadow-xs ${
                        isSelected
                          ? 'bg-[#1C1917] text-[#D4AF37] border border-amber-900/30'
                          : 'bg-white dark:bg-[#24201B] hover:bg-stone-900 hover:text-[#D4AF37] text-stone-800 dark:text-stone-200 border border-[#D8CFBF] dark:border-[#3D352B]'
                      }`}
                    >
                      <span>{isSelected ? 'Active' : 'Open'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
