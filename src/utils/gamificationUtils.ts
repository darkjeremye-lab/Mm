import {
  AcademicState,
  DayOfWeek,
  DAYS_OF_WEEK,
  FocusSession,
  HabitItem,
  OffDaysMap,
  TaskItem,
  TaskPriority,
} from '../types';
import { calculateHabitStreak } from './streakUtils';

export interface LevelInfo {
  level: number;
  title: string;
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
}

export interface TodayStats {
  todayDay: DayOfWeek;
  todayDateFormatted: string; // e.g. "Friday, October 2, 2026"
  todayTasksTotal: number;
  todayTasksCompleted: number;
  todayTasksRemaining: number;
  todayRemainingTasksList: TaskItem[];
  todayHabitsTotal: number;
  todayHabitsCompleted: number;
  todayCompletionPercent: number;
  todayStudyHours: number;
  todayStudyFormatted: string;
  streakDays: number;
  levelInfo: LevelInfo;
  nextUpTask: { task: TaskItem; day: DayOfWeek } | null;
  overdueTasks: Array<{ task: TaskItem; day: DayOfWeek }>;
}

export const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  urgent: 40,
  high: 25,
  medium: 15,
  low: 10,
};

export const LEVEL_TITLES = [
  'Initiate',
  'Apprentice',
  'Scholar',
  'Practitioner',
  'Strategist',
  'Master of Focus',
  'Executive Mind',
  'Virtuoso',
  'Grandmaster',
  'Luminary',
];

/**
 * Calculates current XP earned from completed tasks, habits, and study blocks
 */
export function calculateTotalXP(
  tasksByDay: Record<DayOfWeek, TaskItem[]>,
  habits: HabitItem[],
  academicState?: AcademicState,
  focusSessions?: FocusSession[]
): number {
  let xp = 0;

  // 1. XP from completed tasks
  DAYS_OF_WEEK.forEach((d) => {
    const dayTasks = tasksByDay[d] || [];
    dayTasks.forEach((t) => {
      if (t.completed) {
        const priority = t.priority || 'medium';
        xp += PRIORITY_WEIGHTS[priority] || 15;
      }
    });
  });

  // 2. XP from completed habits
  habits.forEach((h) => {
    DAYS_OF_WEEK.forEach((d) => {
      if (h.daysCompleted && h.daysCompleted[d]) {
        xp += 20;
      }
    });
  });

  // 3. XP from focus sessions or logged study hours
  if (focusSessions && focusSessions.length > 0) {
    const focusXP = focusSessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0);
    xp += focusXP;
  } else if (academicState?.subjects) {
    academicState.subjects.forEach((s) => {
      DAYS_OF_WEEK.forEach((d) => {
        const hours = s.dailyHours ? s.dailyHours[d] || 0 : 0;
        xp += Math.round(hours * 30);
      });
    });
  }

  return Math.max(0, xp);
}

/**
 * Derives current player level and progress to next level
 */
export function calculateLevelInfo(totalXP: number): LevelInfo {
  const XP_PER_LEVEL = 100;
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const currentLevelXP = totalXP % XP_PER_LEVEL;
  const progressPercent = Math.min(100, Math.round((currentLevelXP / XP_PER_LEVEL) * 100));

  const titleIndex = Math.min(LEVEL_TITLES.length - 1, level - 1);
  const title = LEVEL_TITLES[titleIndex];

  return {
    level,
    title,
    totalXP,
    currentLevelXP,
    nextLevelXP: XP_PER_LEVEL,
    progressPercent,
  };
}

/**
 * Calculates active streak across habits, taking off-days into account
 */
export function calculateActiveStreak(
  habits: HabitItem[],
  offDays: OffDaysMap = {},
  startOfWeekISO?: string
): number {
  if (habits.length === 0) return 0;
  let maxStreak = 0;

  habits.forEach((habit) => {
    const { currentStreak } = calculateHabitStreak(habit, offDays, startOfWeekISO);
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
  });

  return maxStreak;
}

/**
 * Priority rank helper for sorting (urgent first)
 */
export function getPriorityRank(p?: TaskPriority): number {
  switch (p) {
    case 'urgent':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 2;
  }
}

/**
 * Computes all today-specific and next-up planning metrics for the Smart Dashboard
 */
export function computeSmartDashboardMetrics(
  todayDay: DayOfWeek,
  tasksByDay: Record<DayOfWeek, TaskItem[]>,
  habits: HabitItem[],
  academicState?: AcademicState,
  offDays: OffDaysMap = {},
  startOfWeekISO?: string,
  now: Date = new Date(),
  focusSessions?: FocusSession[]
): TodayStats {
  const todayTasks = tasksByDay[todayDay] || [];
  const todayTasksCompleted = todayTasks.filter((t) => t.completed).length;
  const todayTasksTotal = todayTasks.length;
  const todayTasksRemaining = todayTasksTotal - todayTasksCompleted;

  const todayHabitsCompleted = habits.filter((h) => h.daysCompleted && h.daysCompleted[todayDay]).length;
  const todayHabitsTotal = habits.length;

  // Completion percentage
  const totalUnits = todayTasksTotal + todayHabitsTotal;
  const completedUnits = todayTasksCompleted + todayHabitsCompleted;
  const todayCompletionPercent =
    totalUnits > 0
      ? Math.round((completedUnits / totalUnits) * 100)
      : todayTasksTotal > 0
      ? Math.round((todayTasksCompleted / todayTasksTotal) * 100)
      : 100;

  // Study hours today: calculate from subjects or focus sessions without double-counting
  let todayStudyHours = 0;
  if (academicState?.subjects) {
    academicState.subjects.forEach((s) => {
      todayStudyHours += s.dailyHours ? s.dailyHours[todayDay] || 0 : 0;
    });
  }

  // If focusSessions are provided, check today's focus minutes
  if (focusSessions && focusSessions.length > 0) {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayISO = `${year}-${month}-${day}`;

    const todayFocusMinutes = focusSessions
      .filter((s) => s.date === todayISO)
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const todayFocusHours = parseFloat((todayFocusMinutes / 60).toFixed(2));

    // If todayFocusHours is greater than subject hours logged, prioritize the larger value to avoid undercounting
    if (todayFocusHours > todayStudyHours) {
      todayStudyHours = todayFocusHours;
    }
  }

  const totalMinutes = Math.round(todayStudyHours * 60);
  const hoursPart = Math.floor(totalMinutes / 60);
  const minutesPart = totalMinutes % 60;
  const todayStudyFormatted =
    totalMinutes <= 0
      ? '0m'
      : hoursPart > 0 && minutesPart > 0
      ? `${hoursPart}h ${minutesPart}m`
      : hoursPart > 0
      ? `${hoursPart}h`
      : `${minutesPart}m`;

  const totalXP = calculateTotalXP(tasksByDay, habits, academicState, focusSessions);
  const levelInfo = calculateLevelInfo(totalXP);
  const streakDays = calculateActiveStreak(habits, offDays, startOfWeekISO);

  // Formatted date
  const todayDateFormatted = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Sort unfinished tasks for today by Priority rank (urgent > high > medium > low),
  // then by reminder time if set, then creation time
  const unfinishedToday = todayTasks.filter((t) => !t.completed);
  const sortedUnfinishedToday = [...unfinishedToday].sort((a, b) => {
    // 1. Priority rank
    const priorityDiff = getPriorityRank(b.priority) - getPriorityRank(a.priority);
    if (priorityDiff !== 0) return priorityDiff;

    // 2. Earliest scheduled reminder time
    if (a.reminder?.enabled && a.reminder.time && (!b.reminder?.enabled || !b.reminder.time)) {
      return -1;
    }
    if (b.reminder?.enabled && b.reminder.time && (!a.reminder?.enabled || !a.reminder.time)) {
      return 1;
    }
    if (a.reminder?.enabled && b.reminder?.enabled && a.reminder.time && b.reminder.time) {
      return a.reminder.time.localeCompare(b.reminder.time);
    }

    // 3. Fallback to creation order
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  // Identify "Next Up" task:
  let nextUpTask: { task: TaskItem; day: DayOfWeek } | null = null;
  if (sortedUnfinishedToday.length > 0) {
    nextUpTask = { task: sortedUnfinishedToday[0], day: todayDay };
  } else {
    // If all tasks for today are done, find next upcoming day in week with unfinished tasks
    const todayIndex = DAYS_OF_WEEK.indexOf(todayDay);
    for (let i = 1; i < DAYS_OF_WEEK.length; i++) {
      const nextDay = DAYS_OF_WEEK[(todayIndex + i) % DAYS_OF_WEEK.length];
      const nextDayTasks = tasksByDay[nextDay] || [];
      const unfinished = nextDayTasks.filter((t) => !t.completed);
      if (unfinished.length > 0) {
        const sorted = [...unfinished].sort((a, b) => {
          const priorityDiff = getPriorityRank(b.priority) - getPriorityRank(a.priority);
          if (priorityDiff !== 0) return priorityDiff;
          return (a.createdAt || 0) - (b.createdAt || 0);
        });
        nextUpTask = { task: sorted[0], day: nextDay };
        break;
      }
    }
  }

  // Identify Overdue Tasks:
  // Any unfinished tasks from days earlier than today in the current week
  const todayIndex = DAYS_OF_WEEK.indexOf(todayDay);
  const overdueTasks: Array<{ task: TaskItem; day: DayOfWeek }> = [];

  for (let i = 0; i < todayIndex; i++) {
    const priorDay = DAYS_OF_WEEK[i];
    const priorTasks = tasksByDay[priorDay] || [];
    priorTasks.forEach((t) => {
      if (!t.completed) {
        overdueTasks.push({ task: t, day: priorDay });
      }
    });
  }

  // Sort overdue tasks by priority (urgent first)
  overdueTasks.sort((a, b) => getPriorityRank(b.task.priority) - getPriorityRank(a.task.priority));

  return {
    todayDay,
    todayDateFormatted,
    todayTasksTotal,
    todayTasksCompleted,
    todayTasksRemaining,
    todayRemainingTasksList: sortedUnfinishedToday,
    todayHabitsTotal,
    todayHabitsCompleted,
    todayCompletionPercent,
    todayStudyHours,
    todayStudyFormatted,
    streakDays,
    levelInfo,
    nextUpTask,
    overdueTasks,
  };
}
