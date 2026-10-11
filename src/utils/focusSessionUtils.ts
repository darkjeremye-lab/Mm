import { FocusSession } from '../types';

const FOCUS_SESSIONS_STORAGE_KEY = 'mw_v2_focus_sessions';
const ACTIVE_FOCUS_SESSION_KEY = 'mw_v2_active_focus_state';

/**
 * Returns today's ISO date string (YYYY-MM-DD) in local time
 */
export function getTodayDateISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns formatted 24-hour time "HH:MM"
 */
export function getCurrentTimeHHMM(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Calculates XP earned based on duration according to Phase 2 guidelines:
 * - 15 minutes = 5 XP
 * - 25 minutes = 10 XP
 * - 50 minutes = 20 XP
 * - 90 minutes = 35 XP
 */
export function calculateFocusXP(durationMinutes: number): number {
  if (durationMinutes <= 0) return 0;
  if (durationMinutes < 20) return 5;
  if (durationMinutes < 35) return 10;
  if (durationMinutes < 60) return 20;
  if (durationMinutes < 80) return 25;
  if (durationMinutes <= 95) return 35;
  return Math.max(5, Math.round((durationMinutes / 25) * 10));
}

/**
 * Loads all recorded focus sessions from localStorage
 */
export function loadFocusSessions(): FocusSession[] {
  try {
    const saved = localStorage.getItem(FOCUS_SESSIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('[FocusSessions] Failed to load sessions:', e);
  }
  return [];
}

/**
 * Persists focus sessions to localStorage
 */
export function saveFocusSessions(sessions: FocusSession[]): void {
  try {
    localStorage.setItem(FOCUS_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('[FocusSessions] Failed to save sessions:', e);
  }
}

/**
 * Adds and records a newly completed or ended focus session
 */
export function recordFocusSession(
  sessionData: Omit<FocusSession, 'id' | 'createdAt'>
): FocusSession {
  const sessions = loadFocusSessions();
  const newSession: FocusSession = {
    ...sessionData,
    id: `focus-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: Date.now(),
  };

  const updated = [newSession, ...sessions];
  saveFocusSessions(updated);
  return newSession;
}

/**
 * Filters sessions recorded today
 */
export function getTodayFocusSessions(sessions: FocusSession[] = loadFocusSessions()): FocusSession[] {
  const today = getTodayDateISO();
  return sessions.filter((s) => s.date === today);
}

/**
 * Computes today's total study minutes across completed focus sessions
 */
export function getTodayTotalFocusMinutes(sessions: FocusSession[] = loadFocusSessions()): number {
  const todaySessions = getTodayFocusSessions(sessions);
  return todaySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
}

/**
 * Computes total XP earned from all focus sessions
 */
export function getTotalFocusSessionsXP(sessions: FocusSession[] = loadFocusSessions()): number {
  return sessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0);
}

/**
 * Active timer session state for cross-refresh persistence
 */
export interface ActiveFocusTimerState {
  status: 'idle' | 'running' | 'paused' | 'break' | 'break_paused' | 'completed';
  mode: '25_5' | '50_10' | '90_15' | 'custom';
  focusMinutes: number;
  breakMinutes: number;
  remainingSeconds: number;
  endTimestamp: number | null; // Date.now() when timer will hit zero
  subjectOrTask: string;
  taskId?: string;
  subjectId?: string;
  sessionStartTime: string;
  isBreak: boolean;
}

export function loadActiveFocusTimerState(): ActiveFocusTimerState | null {
  try {
    const saved = localStorage.getItem(ACTIVE_FOCUS_SESSION_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('[FocusSessions] Failed to load active timer state:', e);
  }
  return null;
}

export function saveActiveFocusTimerState(state: ActiveFocusTimerState | null): void {
  try {
    if (state === null) {
      localStorage.removeItem(ACTIVE_FOCUS_SESSION_KEY);
    } else {
      localStorage.setItem(ACTIVE_FOCUS_SESSION_KEY, JSON.stringify(state));
    }
  } catch (e) {
    console.error('[FocusSessions] Failed to save active timer state:', e);
  }
}
