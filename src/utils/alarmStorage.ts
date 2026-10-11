import { DayOfWeek, DAYS_OF_WEEK, WakeAlarmItem } from '../types';

export const WAKE_ALARMS_STORAGE_KEY = 'mw_wake_challenge_alarms_v1';

export function getDefaultWakeAlarms(): WakeAlarmItem[] {
  return [
    {
      id: 'alarm-default-1',
      time: '07:00',
      label: 'Morning Rise & Focus',
      repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      sound: 'gentle_chime',
      challengeType: 'math',
      difficulty: 'easy',
      enabled: true,
      createdAt: Date.now() - 100000,
    },
    {
      id: 'alarm-default-2',
      time: '08:30',
      label: 'Deep Work Jumpstart',
      repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      sound: 'luxury_chords',
      challengeType: 'type_phrase',
      difficulty: 'medium',
      enabled: false,
      createdAt: Date.now() - 50000,
    },
  ];
}

export function loadWakeAlarms(): WakeAlarmItem[] {
  if (typeof window === 'undefined') return getDefaultWakeAlarms();
  try {
    const raw = localStorage.getItem(WAKE_ALARMS_STORAGE_KEY);
    if (!raw) {
      const defaults = getDefaultWakeAlarms();
      saveWakeAlarms(defaults);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load wake alarms from storage:', e);
  }
  return getDefaultWakeAlarms();
}

export function saveWakeAlarms(alarms: WakeAlarmItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WAKE_ALARMS_STORAGE_KEY, JSON.stringify(alarms));
  } catch (e) {
    console.error('Failed to save wake alarms to storage:', e);
  }
}

export function createNewWakeAlarm(partial?: Partial<WakeAlarmItem>): WakeAlarmItem {
  return {
    id: `alarm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    time: partial?.time || '07:00',
    label: partial?.label || 'Wake Up Challenge',
    repeatDays: partial?.repeatDays !== undefined ? partial.repeatDays : [...DAYS_OF_WEEK],
    sound: partial?.sound || 'gentle_chime',
    challengeType: partial?.challengeType || 'math',
    difficulty: partial?.difficulty || 'easy',
    enabled: partial?.enabled !== undefined ? partial.enabled : true,
    createdAt: Date.now(),
  };
}

export function isAlarmApplicableToday(alarm: WakeAlarmItem, currentDay: DayOfWeek): boolean {
  // If repeatDays is empty, it runs once today
  if (!alarm.repeatDays || alarm.repeatDays.length === 0) return true;
  return alarm.repeatDays.includes(currentDay);
}
