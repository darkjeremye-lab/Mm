import { DayOfWeek, DAYS_OF_WEEK, HabitItem, OffDaysMap } from '../types';
import { formatDateToISO, parseISODate } from './dateUtils';

/**
 * Calculates current consecutive streak (in days) for a habit,
 * taking into account Off/Rest days without penalty.
 *
 * @param habit The habit item with daysCompleted and historical logs
 * @param offDays Map of ISO dates marked as rest/off days
 * @param startOfWeekISO Current active week Monday ISO
 * @param referenceDate The reference date (defaults to today)
 */
export function calculateHabitStreak(
  habit: HabitItem,
  offDays: OffDaysMap = {},
  startOfWeekISO?: string,
  referenceDate: Date = new Date()
): { currentStreak: number; bestStreak: number; unbrokenAcrossRest: boolean } {
  const todayISO = formatDateToISO(referenceDate);
  const history = habit.history || {};

  // Build a lookup map combining history and current week's daysCompleted if available
  const completionMap: Record<string, boolean> = { ...history };

  if (startOfWeekISO) {
    const monday = parseISODate(startOfWeekISO);
    DAYS_OF_WEEK.forEach((d, idx) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + idx);
      const iso = formatDateToISO(dayDate);
      if (habit.daysCompleted[d] !== undefined) {
        completionMap[iso] = habit.daysCompleted[d];
      }
    });
  }

  // Walk backwards starting from today
  let streak = 0;
  let hasEncounteredRestDay = false;
  let checkDate = new Date(referenceDate);

  // Check if today was completed
  const isTodayCompleted = !!completionMap[todayISO];
  const isTodayOff = !!offDays[todayISO]?.isOff;

  if (isTodayCompleted) {
    streak = 1;
    // Step back to yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  } else if (isTodayOff) {
    // Today is an off day, don't count it, but continue backwards from yesterday
    hasEncounteredRestDay = true;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Today is not completed yet, and not off.
    // Check if yesterday was completed (allowing today to still be in progress)
    const yesterday = new Date(referenceDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = formatDateToISO(yesterday);
    const isYesterdayCompleted = !!completionMap[yesterdayISO];
    const isYesterdayOff = !!offDays[yesterdayISO]?.isOff;

    if (isYesterdayCompleted || isYesterdayOff) {
      // Streak is active from yesterday
      checkDate = yesterday;
    } else {
      // Streak is broken / 0
      return {
        currentStreak: 0,
        bestStreak: habit.bestStreak || 0,
        unbrokenAcrossRest: false,
      };
    }
  }

  // Loop backwards up to 365 days
  for (let i = 0; i < 365; i++) {
    const currentISO = formatDateToISO(checkDate);
    const completed = !!completionMap[currentISO];
    const isOff = !!offDays[currentISO]?.isOff;

    if (completed) {
      streak += 1;
    } else if (isOff) {
      // Off day / Rest day: Does NOT break streak, does NOT count as +1
      hasEncounteredRestDay = true;
    } else {
      // Normal day missed -> streak ends
      break;
    }

    // Move to previous day
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const bestStreak = Math.max(habit.bestStreak || 0, streak);

  return {
    currentStreak: streak,
    bestStreak,
    unbrokenAcrossRest: hasEncounteredRestDay && streak > 0,
  };
}

/**
 * Sync habit history with current week changes
 */
export function recordHabitCompletion(
  habit: HabitItem,
  day: DayOfWeek,
  completed: boolean,
  startOfWeekISO: string
): HabitItem {
  const monday = parseISODate(startOfWeekISO);
  const dayIndex = DAYS_OF_WEEK.indexOf(day);
  const dayDate = new Date(monday);
  dayDate.setDate(monday.getDate() + dayIndex);
  const isoDate = formatDateToISO(dayDate);

  const updatedHistory = {
    ...(habit.history || {}),
    [isoDate]: completed,
  };

  const updatedDaysCompleted = {
    ...habit.daysCompleted,
    [day]: completed,
  };

  // Re-calculate streak and best record
  const { currentStreak, bestStreak } = calculateHabitStreak(
    {
      ...habit,
      daysCompleted: updatedDaysCompleted,
      history: updatedHistory,
    },
    {},
    startOfWeekISO
  );

  return {
    ...habit,
    daysCompleted: updatedDaysCompleted,
    history: updatedHistory,
    bestStreak: Math.max(habit.bestStreak || 0, bestStreak, currentStreak),
  };
}
