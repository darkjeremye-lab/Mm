import { DayOfWeek, DAYS_OF_WEEK } from '../types';

/**
 * Returns the YYYY-MM-DD string for Monday of the week containing the given date.
 */
export function getMondayOfWeek(d: Date = new Date()): string {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diff));
  return formatDateToISO(monday);
}

/**
 * Format a Date object as YYYY-MM-DD
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD to local Date object
 */
export function parseISODate(isoString: string): Date {
  if (!isoString) return new Date();
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get formatted date for each day given the week's Monday ISO string.
 * Returns map of DayOfWeek -> string (e.g. "AUG 31", "SEP 01")
 */
export function getDayDates(startOfWeekISO: string): Record<DayOfWeek, { label: string; fullDate: string; isToday: boolean }> {
  const baseMonday = parseISODate(startOfWeekISO);
  const todayISO = formatDateToISO(new Date());

  const result = {} as Record<DayOfWeek, { label: string; fullDate: string; isToday: boolean }>;

  DAYS_OF_WEEK.forEach((dayKey, index) => {
    const current = new Date(baseMonday);
    current.setDate(baseMonday.getDate() + index);

    const monthName = current.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const dayNum = String(current.getDate()).padStart(2, '0');
    const iso = formatDateToISO(current);

    result[dayKey] = {
      label: `${monthName} ${dayNum}`,
      fullDate: iso,
      isToday: iso === todayISO,
    };
  });

  return result;
}

/**
 * Shift the week by offset (+1 for next week, -1 for previous week)
 */
export function shiftWeek(startOfWeekISO: string, weekOffset: number): string {
  const monday = parseISODate(startOfWeekISO);
  monday.setDate(monday.getDate() + (weekOffset * 7));
  return formatDateToISO(monday);
}
