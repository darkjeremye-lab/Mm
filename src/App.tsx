import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AcademicState,
  AppearanceMode,
  DayOfWeek,
  DAYS_OF_WEEK,
  HabitItem,
  HabitReminder,
  NavigationTab,
  OffDayConfig,
  OffDaysMap,
  PlannerSnapshot,
  RecurrenceFrequency,
  ResolvedAppearance,
  TaskItem,
  TaskPriority,
  TaskRecurrence,
  TaskReminder,
  ThemeType,
  TriggeredReminderAlert,
  UserProfile,
  WakeAlarmItem,
  WeeklyNotes,
} from './types';
import { THEMES, getThemeConfig } from './theme';
import { getDayDates, getMondayOfWeek, shiftWeek } from './utils/dateUtils';
import {
  getDefaultAcademicState,
  getDefaultHabits,
  getDefaultNotes,
  getDefaultTasks,
} from './data/defaultData';
import {
  populateRecurringTasksForWeek,
  loadRecurringTemplates,
  saveRecurringTemplates,
} from './utils/recurringTaskUtils';
import { SidebarNav } from './components/SidebarNav';
import { DashboardPage } from './components/DashboardPage';
import { MonthlyViewPage } from './components/MonthlyViewPage';
import { HabitsPage } from './components/HabitsPage';
import { AcademicPage } from './components/AcademicPage';
import { AICoachPage } from './components/AICoachPage';
import { LanguagePracticePage } from './components/LanguagePracticePage';
import { OnboardingPage } from './components/OnboardingPage';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { RemindersCenterModal } from './components/RemindersCenterModal';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { TriggeredAlertBanner } from './components/TriggeredAlertBanner';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { PwaInstallModal } from './components/PwaInstallModal';
import { WakeChallengeModal } from './components/WakeChallengeModal';
import { loadWakeAlarms, saveWakeAlarms, isAlarmApplicableToday } from './utils/alarmStorage';
import {
  getCurrentDayOfWeek,
  getCurrentTimeString,
  triggerSystemNotification,
} from './utils/notificationService';
import { playReminderChime } from './utils/audio';
import {
  subscribeToInstallPrompt,
  subscribeToOnlineStatus,
  promptPwaInstall,
  isRunningStandalone,
} from './utils/pwaService';
import { Settings, Minimize2 } from 'lucide-react';

const STORAGE_KEY_PREFIX = 'mw_v2_';
const PROFILE_KEY = 'mw_user_profile_v2';
const SOUND_KEY = 'mw_sound_enabled_v2';
const FOCUS_MODE_KEY = `${STORAGE_KEY_PREFIX}focus_mode`;
const MAX_HISTORY_LIMIT = 40;

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  goals: ['Excel in academic mastery and strategic focus', 'Maintain peak health, clarity, and vital energy'],
  desiredFeelings: ['Focused', 'Disciplined', 'Healthy & Vital'],
  onboarded: true,
  createdAt: new Date().toISOString(),
  avatar: undefined,
  bio: '',
  learningGoals: ['Master active recall and spaced repetition', 'Consistent daily deep work'],
  learningLanguages: ['Spanish'],
  dailyStudyMinutes: 60,
};

export default function App() {
  // 1. User Profile & Onboarding State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === 'string') {
          return {
            ...DEFAULT_PROFILE,
            ...parsed,
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PROFILE;
  });

  // 2. Active Tab / Navigation State
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // 3. Theme state ('black' | 'green' | 'pink')
  const [theme, setTheme] = useState<ThemeType>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}theme`);
      if (saved === 'black' || saved === 'green' || saved === 'pink') {
        return saved;
      }
    } catch (e) {
      console.error(e);
    }
    return 'black';
  });

  // 3b. Appearance mode setting ('light' | 'dark' | 'system')
  const [appearance, setAppearance] = useState<AppearanceMode>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}appearance`);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch (e) {
      console.error(e);
    }
    return 'system';
  });

  // Device / OS system preference detection and live listener
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updatePref = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener('change', updatePref);
    return () => mediaQuery.removeEventListener('change', updatePref);
  }, []);

  const resolvedAppearance: ResolvedAppearance =
    appearance === 'system' ? (systemPrefersDark ? 'dark' : 'light') : appearance;

  // 4. Sound enabled toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_KEY);
      if (saved !== null) return saved === 'true';
    } catch (e) {
      console.error(e);
    }
    return true;
  });

  // 5. Current active Monday
  const [startOfWeek, setStartOfWeek] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}active_week`);
      if (saved) return saved;
    } catch (e) {
      console.error(e);
    }
    return getMondayOfWeek();
  });

  // 6. Notes state for this week
  const [notes, setNotes] = useState<WeeklyNotes>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}notes_${startOfWeek}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return getDefaultNotes(startOfWeek);
  });

  // 7. Tasks state for this week
  const [tasksByDay, setTasksByDay] = useState<Record<DayOfWeek, TaskItem[]>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}tasks_${startOfWeek}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return populateRecurringTasksForWeek(parsed);
      }
    } catch (e) {
      console.error(e);
    }
    return populateRecurringTasksForWeek(getDefaultTasks());
  });

  // 8. Habits state for this week
  const [habits, setHabits] = useState<HabitItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}habits_${startOfWeek}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return getDefaultHabits();
  });

  // 8b. Off / Quiet Mode Days Map
  const [offDays, setOffDays] = useState<OffDaysMap>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}off_days`);
      if (saved) return JSON.parse(saved);
      // Legacy fallback
      const legacy = localStorage.getItem('mw_luxury_off_days');
      if (legacy) return JSON.parse(legacy);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // 9. Academic & School State (Subjects, Study Hours, Deadlines, Long-Term Goals)
  const [academicState, setAcademicState] = useState<AcademicState>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}academic_state`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return getDefaultAcademicState();
  });

  // 9b. Wake Challenge Alarms State & Active Alarm Trigger
  const [wakeAlarms, setWakeAlarms] = useState<WakeAlarmItem[]>(() => loadWakeAlarms());
  const [activeWakeAlarm, setActiveWakeAlarm] = useState<WakeAlarmItem | null>(null);

  // Persist Wake Challenge Alarms
  useEffect(() => {
    saveWakeAlarms(wakeAlarms);
  }, [wakeAlarms]);

  // 10. Undo / Redo History Stacks
  const [undoStack, setUndoStack] = useState<PlannerSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<PlannerSnapshot[]>([]);
  const [lastActionLabel, setLastActionLabel] = useState<string | undefined>(undefined);

  // 11. Modals & Panels
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isEditingCompass, setIsEditingCompass] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Global Distraction-Free Focus Mode
  const [focusMode, setFocusMode] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem(FOCUS_MODE_KEY) === 'true' ||
        localStorage.getItem('mw_focus_mode') === 'true'
      );
    } catch {
      return false;
    }
  });

  // Persist Focus Mode
  useEffect(() => {
    try {
      localStorage.setItem(FOCUS_MODE_KEY, String(focusMode));
      localStorage.setItem('mw_focus_mode', String(focusMode));
    } catch (e) {
      console.error(e);
    }
  }, [focusMode]);

  const handleToggleFocusMode = () => {
    setFocusMode((prev) => {
      const next = !prev;
      if (next && activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
      return next;
    });
  };

  // Keyboard shortcut: Esc exits Focus Mode when no modal is open
  useEffect(() => {
    if (!focusMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        !isSettingsOpen &&
        !isRemindersModalOpen &&
        !isQuickCaptureOpen &&
        !isInstallModalOpen
      ) {
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode, isSettingsOpen, isRemindersModalOpen, isQuickCaptureOpen, isInstallModalOpen]);

  // Subscribe to PWA Installability and Online/Offline state
  useEffect(() => {
    const unsubInstall = subscribeToInstallPrompt((installable) => {
      setCanInstall(installable);
    });
    const unsubOnline = subscribeToOnlineStatus((online) => {
      setIsOnline(online);
    });
    return () => {
      unsubInstall();
      unsubOnline();
    };
  }, []);

  const handleNativeInstall = async () => {
    const outcome = await promptPwaInstall();
    if (outcome === 'accepted') {
      setIsInstallModalOpen(false);
    }
  };

  // 12. Triggered in-app alerts banner
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredReminderAlert[]>([]);
  const firedMinutesRef = useRef<Set<string>>(new Set());

  // Dates for each day of this active week
  const dayDates = getDayDates(startOfWeek);
  const activeThemeConfig = getThemeConfig(theme, resolvedAppearance);

  // Persist Profile
  const handleUpdateUserProfile = useCallback((updated: UserProfile) => {
    setUserProfile(updated);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save profile to localStorage:', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
    } catch (e) {
      console.error(e);
    }
  }, [userProfile]);

  // Persist Theme Palette
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}theme`, theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  // Persist Appearance Mode
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}appearance`, appearance);
    } catch (e) {
      console.error(e);
    }
  }, [appearance]);

  // DOM sync for dark/light class, data attributes, and browser theme-color
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const isDark = resolvedAppearance === 'dark';
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    root.setAttribute('data-appearance', resolvedAppearance);
    root.setAttribute('data-theme', theme);
    document.body.setAttribute('data-appearance', resolvedAppearance);
    document.body.setAttribute('data-theme', theme);

    // Update meta theme-color for PWA & mobile browser chrome
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      if (isDark) {
        metaTheme.setAttribute(
          'content',
          theme === 'green' ? '#0E1A13' : theme === 'pink' ? '#170C11' : '#141210'
        );
      } else {
        metaTheme.setAttribute(
          'content',
          theme === 'green' ? '#152E20' : theme === 'pink' ? '#3A1420' : '#1C1917'
        );
      }
    }
  }, [resolvedAppearance, theme]);

  const handleSelectAppearance = (newAppearance: AppearanceMode) => {
    setAppearance(newAppearance);
  };

  // Persist Sound Setting
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_KEY, String(soundEnabled));
    } catch (e) {
      console.error(e);
    }
  }, [soundEnabled]);

  // Persist Off Days
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}off_days`, JSON.stringify(offDays));
    } catch (e) {
      console.error(e);
    }
  }, [offDays]);

  // Toggle Off Day (Quiet Mode)
  const handleToggleOffDay = useCallback(
    (dateISO: string, reason: 'rest' | 'sick' | 'travel' | 'retreat' = 'rest') => {
      setOffDays((prev) => {
        const next = { ...prev };
        if (next[dateISO]?.isOff) {
          delete next[dateISO];
        } else {
          next[dateISO] = {
            dateISO,
            isOff: true,
            reason,
            note: 'No-Guilt Rest / Quiet Mode Day',
          };
        }
        return next;
      });
    },
    []
  );

  // Persist Active Week
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}active_week`, startOfWeek);
    } catch (e) {
      console.error(e);
    }
  }, [startOfWeek]);

  // Persist Academic State
  const handleUpdateAcademicState = (newState: AcademicState) => {
    setAcademicState(newState);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}academic_state`, JSON.stringify(newState));
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to persist snapshot to localStorage
  const saveSnapshotToStorage = useCallback(
    (week: string, newNotes: WeeklyNotes, newTasks: Record<DayOfWeek, TaskItem[]>, newHabits: HabitItem[]) => {
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}notes_${week}`, JSON.stringify(newNotes));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}tasks_${week}`, JSON.stringify(newTasks));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}habits_${week}`, JSON.stringify(newHabits));
      } catch (e) {
        console.error('Storage save error:', e);
      }
    },
    []
  );

  // Helper to record a snapshot BEFORE an action is applied
  const pushUndoSnapshot = useCallback(
    (actionLabel: string) => {
      const snapshot: PlannerSnapshot = {
        tasksByDay: JSON.parse(JSON.stringify(tasksByDay)),
        habits: JSON.parse(JSON.stringify(habits)),
        notes: JSON.parse(JSON.stringify(notes)),
        actionLabel,
      };

      setUndoStack((prev) => {
        const next = [...prev, snapshot];
        if (next.length > MAX_HISTORY_LIMIT) {
          return next.slice(next.length - MAX_HISTORY_LIMIT);
        }
        return next;
      });

      // Clear redo stack on new action
      setRedoStack([]);
      setLastActionLabel(actionLabel);
    },
    [tasksByDay, habits, notes]
  );

  // Undo execution
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    const previous = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    const currentSnapshot: PlannerSnapshot = {
      tasksByDay: JSON.parse(JSON.stringify(tasksByDay)),
      habits: JSON.parse(JSON.stringify(habits)),
      notes: JSON.parse(JSON.stringify(notes)),
      actionLabel: lastActionLabel || 'Action',
    };

    setRedoStack((prev) => [...prev, currentSnapshot]);
    setUndoStack(newUndoStack);

    setTasksByDay(previous.tasksByDay);
    setHabits(previous.habits);
    setNotes(previous.notes);
    setLastActionLabel(`Undone: ${previous.actionLabel || 'Action'}`);

    saveSnapshotToStorage(startOfWeek, previous.notes, previous.tasksByDay, previous.habits);
  }, [undoStack, tasksByDay, habits, notes, lastActionLabel, saveSnapshotToStorage, startOfWeek]);

  // Redo execution
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    const currentSnapshot: PlannerSnapshot = {
      tasksByDay: JSON.parse(JSON.stringify(tasksByDay)),
      habits: JSON.parse(JSON.stringify(habits)),
      notes: JSON.parse(JSON.stringify(notes)),
      actionLabel: lastActionLabel || 'Action',
    };

    setUndoStack((prev) => [...prev, currentSnapshot]);
    setRedoStack(newRedoStack);

    setTasksByDay(next.tasksByDay);
    setHabits(next.habits);
    setNotes(next.notes);
    setLastActionLabel(`Redone: ${next.actionLabel || 'Action'}`);

    saveSnapshotToStorage(startOfWeek, next.notes, next.tasksByDay, next.habits);
  }, [redoStack, tasksByDay, habits, notes, lastActionLabel, saveSnapshotToStorage, startOfWeek]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          if (!isInput) {
            e.preventDefault();
            handleRedo();
          }
        } else {
          if (!isInput) {
            e.preventDefault();
            handleUndo();
          }
        }
      } else if (modifier && (e.key === 'y' || e.key === 'Y')) {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
      } else if ((e.key === 'q' || e.key === 'Q') && !isInput && !modifier && !e.altKey) {
        e.preventDefault();
        setIsQuickCaptureOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Load week-specific data when startOfWeek changes
  const handleWeekChange = (newStartOfWeek: string) => {
    setStartOfWeek(newStartOfWeek);
    setUndoStack([]);
    setRedoStack([]);
    setLastActionLabel(undefined);

    try {
      const savedNotes = localStorage.getItem(`${STORAGE_KEY_PREFIX}notes_${newStartOfWeek}`);
      setNotes(savedNotes ? JSON.parse(savedNotes) : getDefaultNotes(newStartOfWeek));

      const savedTasks = localStorage.getItem(`${STORAGE_KEY_PREFIX}tasks_${newStartOfWeek}`);
      const baseTasks = savedTasks ? JSON.parse(savedTasks) : getDefaultTasks();
      setTasksByDay(populateRecurringTasksForWeek(baseTasks));

      const savedHabits = localStorage.getItem(`${STORAGE_KEY_PREFIX}habits_${newStartOfWeek}`);
      setHabits(savedHabits ? JSON.parse(savedHabits) : getDefaultHabits());
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavigateWeek = (offsetWeeks: number) => {
    const nextMonday = shiftWeek(startOfWeek, offsetWeeks);
    handleWeekChange(nextMonday);
  };

  const handleResetToCurrentWeek = () => {
    const currentMonday = getMondayOfWeek();
    handleWeekChange(currentMonday);
  };

  // Notes handlers
  const handleSaveNotes = (updated: WeeklyNotes) => {
    pushUndoSnapshot('Update Weekly Notes');
    if (updated.startOfWeek && updated.startOfWeek !== startOfWeek) {
      setStartOfWeek(updated.startOfWeek);
    }
    setNotes(updated);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}notes_${updated.startOfWeek || startOfWeek}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearNotes = () => {
    pushUndoSnapshot('Clear Weekly Notes');
    const cleared: WeeklyNotes = {
      startOfWeek,
      focus: '',
      reward: '',
      affirmation: '',
    };
    setNotes(cleared);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}notes_${startOfWeek}`, JSON.stringify(cleared));
    } catch (e) {
      console.error(e);
    }
  };

  // Tasks handlers
  const persistTasks = (newTasks: Record<DayOfWeek, TaskItem[]>, label: string) => {
    pushUndoSnapshot(label);
    setTasksByDay(newTasks);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}tasks_${startOfWeek}`, JSON.stringify(newTasks));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTask = (
    day: DayOfWeek,
    text: string,
    options?:
      | {
          priority?: TaskPriority;
          duration?: string;
          recurrence?: TaskRecurrence;
          reminder?: TaskReminder;
        }
      | TaskReminder
  ) => {
    let priority: TaskPriority = 'medium';
    let duration: string | undefined = undefined;
    let recurrence: TaskRecurrence | undefined = undefined;
    let reminder: TaskReminder | undefined = undefined;

    if (options) {
      if ('time' in options) {
        reminder = options as TaskReminder;
      } else {
        priority = options.priority || 'medium';
        duration = options.duration;
        recurrence = options.recurrence;
        reminder = options.reminder;
      }
    }

    const newTaskId = `${day.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTask: TaskItem = {
      id: newTaskId,
      text,
      completed: false,
      priority,
      duration,
      recurrence,
      reminder,
      createdAt: Date.now(),
    };

    // If recurring task template specified, save and propagate
    if (recurrence) {
      const templateId = `tpl-${Date.now()}`;
      const template = {
        id: templateId,
        text,
        priority,
        duration,
        frequency: recurrence.frequency,
        customDays: recurrence.days,
        originDay: day,
        createdAt: Date.now(),
      };
      const templates = loadRecurringTemplates();
      templates.push(template);
      saveRecurringTemplates(templates);

      newTask.recurrence = {
        ...recurrence,
        sourceTaskId: templateId,
      };

      const updated = {
        ...tasksByDay,
        [day]: [...(tasksByDay[day] || []), newTask],
      };
      const withRecurrence = populateRecurringTasksForWeek(updated, [template]);
      persistTasks(withRecurrence, `Add recurring task (${day})`);
      return;
    }

    const updated = {
      ...tasksByDay,
      [day]: [...(tasksByDay[day] || []), newTask],
    };
    persistTasks(updated, `Add task (${day})`);
  };

  const handleMoveTaskToDay = (fromDay: DayOfWeek, toDay: DayOfWeek, taskId: string) => {
    const task = (tasksByDay[fromDay] || []).find((t) => t.id === taskId);
    if (!task) return;

    const newFromTasks = (tasksByDay[fromDay] || []).filter((t) => t.id !== taskId);
    const newToTasks = [
      ...(tasksByDay[toDay] || []),
      {
        ...task,
        id: `${toDay.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      },
    ];

    const updated = {
      ...tasksByDay,
      [fromDay]: newFromTasks,
      [toDay]: newToTasks,
    };
    persistTasks(updated, `Move task from ${fromDay} to ${toDay}`);
  };

  const handleRescheduleAllOverdueToToday = () => {
    const todayDay = getCurrentDayOfWeek();
    const todayIndex = DAYS_OF_WEEK.indexOf(todayDay);
    if (todayIndex <= 0) return;

    const newTasks = { ...tasksByDay };
    const movedTasks: TaskItem[] = [];

    for (let i = 0; i < todayIndex; i++) {
      const d = DAYS_OF_WEEK[i];
      const remaining: TaskItem[] = [];
      (newTasks[d] || []).forEach((t) => {
        if (!t.completed) {
          movedTasks.push({
            ...t,
            id: `${todayDay.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          });
        } else {
          remaining.push(t);
        }
      });
      newTasks[d] = remaining;
    }

    if (movedTasks.length === 0) return;

    newTasks[todayDay] = [...(newTasks[todayDay] || []), ...movedTasks];
    persistTasks(newTasks, `Reschedule overdue tasks to Today`);
  };

  const handleUpdateTaskMetadata = (
    day: DayOfWeek,
    taskId: string,
    updates: Partial<TaskItem>
  ) => {
    const updatedDayTasks = (tasksByDay[day] || []).map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    );
    const updated = {
      ...tasksByDay,
      [day]: updatedDayTasks,
    };
    persistTasks(updated, `Update task (${day})`);
  };

  const handleLogStudyHoursFromCapture = (
    subjectId: string,
    day: DayOfWeek,
    additionalHours: number,
    note?: string
  ) => {
    setAcademicState((prev) => {
      const updatedSubjects = prev.subjects.map((sub) => {
        if (sub.id === subjectId) {
          const current = sub.dailyHours[day] || 0;
          return {
            ...sub,
            dailyHours: {
              ...sub.dailyHours,
              [day]: Math.round((current + additionalHours) * 100) / 100,
            },
          };
        }
        return sub;
      });
      const newState: AcademicState = {
        ...prev,
        subjects: updatedSubjects,
      };
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}academic_state`, JSON.stringify(newState));
      } catch (e) {
        console.error(e);
      }
      return newState;
    });
  };

  const handleAddSubjectFromCapture = (
    name: string,
    weeklyTargetHours: number,
    color: string
  ) => {
    const newSubject = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      weeklyTargetHours,
      color,
      dailyHours: {
        Mon: 0,
        Tue: 0,
        Wed: 0,
        Thu: 0,
        Fri: 0,
        Sat: 0,
        Sun: 0,
      },
    };
    setAcademicState((prev) => {
      const newState: AcademicState = {
        ...prev,
        subjects: [...prev.subjects, newSubject],
      };
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}academic_state`, JSON.stringify(newState));
      } catch (e) {
        console.error(e);
      }
      return newState;
    });
  };

  const handleToggleTask = (day: DayOfWeek, taskId: string) => {
    const updatedDayTasks = (tasksByDay[day] || []).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const updated = {
      ...tasksByDay,
      [day]: updatedDayTasks,
    };
    persistTasks(updated, `Toggle task (${day})`);
  };

  const handleEditTask = (day: DayOfWeek, taskId: string, newText: string) => {
    const updatedDayTasks = (tasksByDay[day] || []).map((t) =>
      t.id === taskId ? { ...t, text: newText } : t
    );
    const updated = {
      ...tasksByDay,
      [day]: updatedDayTasks,
    };
    persistTasks(updated, `Edit task (${day})`);
  };

  const handleDeleteTask = (day: DayOfWeek, taskId: string) => {
    const updatedDayTasks = (tasksByDay[day] || []).filter((t) => t.id !== taskId);
    const updated = {
      ...tasksByDay,
      [day]: updatedDayTasks,
    };
    persistTasks(updated, `Delete task (${day})`);
  };

  const handleMoveTask = (day: DayOfWeek, taskId: string, direction: 'up' | 'down') => {
    const current = tasksByDay[day] || [];
    const idx = current.findIndex((t) => t.id === taskId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === current.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newDayTasks = [...current];
    const [removed] = newDayTasks.splice(idx, 1);
    newDayTasks.splice(targetIdx, 0, removed);

    const updated = {
      ...tasksByDay,
      [day]: newDayTasks,
    };
    persistTasks(updated, `Reorder task (${day})`);
  };

  const handleSaveTaskReminder = (day: DayOfWeek, taskId: string, reminder: TaskReminder | undefined) => {
    const updatedDayTasks = (tasksByDay[day] || []).map((t) =>
      t.id === taskId ? { ...t, reminder } : t
    );
    const updated = {
      ...tasksByDay,
      [day]: updatedDayTasks,
    };
    persistTasks(updated, reminder ? `Set task reminder` : `Remove task reminder`);
  };

  const handleUpdateTaskReminderStatus = (day: DayOfWeek, taskId: string, enabled: boolean) => {
    const updatedDayTasks = (tasksByDay[day] || []).map((t) => {
      if (t.id === taskId && t.reminder) {
        return { ...t, reminder: { ...t.reminder, enabled } };
      }
      return t;
    });
    const updated = {
      ...tasksByDay,
      [day]: updatedDayTasks,
    };
    persistTasks(updated, enabled ? `Enable task reminder` : `Disable task reminder`);
  };

  const handleDeleteTaskReminder = (day: DayOfWeek, taskId: string) => {
    handleSaveTaskReminder(day, taskId, undefined);
  };

  // Habits handlers
  const persistHabits = (newHabits: HabitItem[], label: string) => {
    pushUndoSnapshot(label);
    setHabits(newHabits);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}habits_${startOfWeek}`, JSON.stringify(newHabits));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddHabit = (name: string) => {
    const newHabit: HabitItem = {
      id: `habit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      daysCompleted: {
        Mon: false,
        Tue: false,
        Wed: false,
        Thu: false,
        Fri: false,
        Sat: false,
        Sun: false,
      },
    };
    const updated = [...habits, newHabit];
    persistHabits(updated, `Add habit "${name}"`);
  };

  const handleToggleHabitDay = (habitId: string, day: DayOfWeek) => {
    const habit = habits.find((h) => h.id === habitId);
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        return {
          ...h,
          daysCompleted: {
            ...h.daysCompleted,
            [day]: !h.daysCompleted[day],
          },
        };
      }
      return h;
    });
    persistHabits(updated, `Toggle habit check-in (${habit?.name || 'Habit'})`);
  };

  const handleEditHabitName = (habitId: string, newName: string) => {
    const updated = habits.map((h) => (h.id === habitId ? { ...h, name: newName } : h));
    persistHabits(updated, `Rename habit to "${newName}"`);
  };

  const handleDeleteHabit = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    const updated = habits.filter((h) => h.id !== habitId);
    persistHabits(updated, `Delete habit "${habit?.name || ''}"`);
  };

  const handleSaveHabitReminder = (habitId: string, reminder: HabitReminder | undefined) => {
    const updated = habits.map((h) => (h.id === habitId ? { ...h, reminder } : h));
    persistHabits(updated, reminder ? `Set habit reminder` : `Remove habit reminder`);
  };

  const handleUpdateHabitReminderStatus = (habitId: string, enabled: boolean) => {
    const updated = habits.map((h) => {
      if (h.id === habitId && h.reminder) {
        return { ...h, reminder: { ...h.reminder, enabled } };
      }
      return h;
    });
    persistHabits(updated, enabled ? `Enable habit reminder` : `Disable habit reminder`);
  };

  const handleDeleteHabitReminder = (habitId: string) => {
    handleSaveHabitReminder(habitId, undefined);
  };

  // Reset / Backup Data
  const handleResetData = () => {
    pushUndoSnapshot('Load Sample Week Data');
    const defNotes = getDefaultNotes(startOfWeek);
    const defTasks = getDefaultTasks();
    const defHabits = getDefaultHabits();
    setNotes(defNotes);
    setTasksByDay(defTasks);
    setHabits(defHabits);
    saveSnapshotToStorage(startOfWeek, defNotes, defTasks, defHabits);
  };

  const handleExportData = () => {
    const exportPayload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      userProfile,
      theme,
      soundEnabled,
      activeWeek: startOfWeek,
      notes,
      tasksByDay,
      habits,
      academicState,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-week-backup-${startOfWeek}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.userProfile) setUserProfile(parsed.userProfile);
      if (parsed.theme) setTheme(parsed.theme);
      if (parsed.notes) setNotes(parsed.notes);
      if (parsed.tasksByDay) setTasksByDay(parsed.tasksByDay);
      if (parsed.habits) setHabits(parsed.habits);
      if (parsed.academicState) setAcademicState(parsed.academicState);
      if (parsed.activeWeek) setStartOfWeek(parsed.activeWeek);
      alert('Data imported successfully!');
      setIsSettingsOpen(false);
    } catch (e) {
      alert('Invalid backup JSON file.');
      console.error(e);
    }
  };

  // Wake Challenge Alarms Handlers
  const handleSaveWakeAlarm = (alarm: WakeAlarmItem) => {
    setWakeAlarms((prev) => {
      const idx = prev.findIndex((a) => a.id === alarm.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = alarm;
        return next;
      }
      return [...prev, alarm];
    });
  };

  const handleToggleWakeAlarm = (id: string) => {
    setWakeAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleDeleteWakeAlarm = (id: string) => {
    setWakeAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const handleTestWakeAlarm = (alarm: WakeAlarmItem) => {
    setActiveWakeAlarm(alarm);
  };

  const handleDismissWakeAlarm = () => {
    if (activeWakeAlarm) {
      // If one-time non-repeating alarm, disable it
      if (!activeWakeAlarm.repeatDays || activeWakeAlarm.repeatDays.length === 0) {
        setWakeAlarms((prev) =>
          prev.map((a) => (a.id === activeWakeAlarm.id ? { ...a, enabled: false } : a))
        );
      }
    }
    setActiveWakeAlarm(null);
  };

  const handleSnoozeWakeAlarm = (alarm: WakeAlarmItem, minutes: number = 5) => {
    const snoozeTime = Date.now() + minutes * 60 * 1000;
    setWakeAlarms((prev) =>
      prev.map((a) => (a.id === alarm.id ? { ...a, snoozedUntil: snoozeTime } : a))
    );
    setActiveWakeAlarm(null);
    triggerSystemNotification(
      `⏰ Alarm Snoozed (+${minutes}m)`,
      `"${alarm.label}" will ring again in ${minutes} minutes.`
    );
  };

  // Active reminders count
  const activeRemindersCount =
    (Object.values(tasksByDay) as TaskItem[][]).reduce(
      (acc: number, list: TaskItem[]) => acc + list.filter((t) => t.reminder?.enabled).length,
      0
    ) +
    habits.filter((h) => h.reminder?.enabled).length +
    wakeAlarms.filter((a) => a.enabled).length;

  const totalTasks = (Object.values(tasksByDay) as TaskItem[][]).reduce(
    (acc, l) => acc + l.length,
    0
  );
  const tasksCompleted = (Object.values(tasksByDay) as TaskItem[][]).reduce(
    (acc, l) => acc + l.filter((t) => t.completed).length,
    0
  );

  // Real-time Reminder Scheduler & Trigger Loop
  useEffect(() => {
    const checkReminders = () => {
      const nowTime = getCurrentTimeString();
      const currentDay = getCurrentDayOfWeek();

      // Check Wake Challenge Alarms
      wakeAlarms.forEach((alarm) => {
        if (!alarm.enabled) return;

        // Check if currently snoozed and snooze time reached
        if (alarm.snoozedUntil && Date.now() >= alarm.snoozedUntil) {
          // Trigger snoozed alarm!
          setWakeAlarms((prev) =>
            prev.map((a) => (a.id === alarm.id ? { ...a, snoozedUntil: undefined } : a))
          );
          setActiveWakeAlarm(alarm);
          triggerSystemNotification(
            `⏰ Wake Challenge Alarm: ${alarm.label}`,
            `It's time to wake up and solve your challenge!`
          );
          return;
        }

        // Standard time check
        const appliesToday = isAlarmApplicableToday(alarm, currentDay);
        if (!appliesToday) return;

        if (alarm.time === nowTime) {
          const triggerKey = `wake-alarm-${alarm.id}-${nowTime}`;
          if (!firedMinutesRef.current.has(triggerKey)) {
            firedMinutesRef.current.add(triggerKey);
            setActiveWakeAlarm(alarm);
            triggerSystemNotification(
              `⏰ Wake Challenge Alarm: ${alarm.label}`,
              `Time to wake up! Complete the ${alarm.challengeType} challenge to dismiss.`
            );
          }
        }
      });

      // Check Task Reminders
      (Object.keys(tasksByDay) as DayOfWeek[]).forEach((day) => {
        (tasksByDay[day] || []).forEach((task) => {
          if (!task.reminder || !task.reminder.enabled) return;

          const appliesToday = task.reminder.isRecurring || day === currentDay;
          if (!appliesToday) return;

          if (task.reminder.time === nowTime) {
            const triggerKey = `task-${day}-${task.id}-${nowTime}`;
            if (!firedMinutesRef.current.has(triggerKey)) {
              firedMinutesRef.current.add(triggerKey);

              if (soundEnabled) {
                playReminderChime();
              }
              triggerSystemNotification(
                `⏰ Task Reminder: ${task.text}`,
                task.reminder.isRecurring
                  ? `Daily scheduled reminder for "${task.text}"`
                  : `${day} reminder for "${task.text}"`
              );

              setTriggeredAlerts((prev) => [
                ...prev,
                {
                  id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  title: task.text,
                  subtitle: task.reminder!.isRecurring
                    ? `Daily Task Reminder • ${nowTime}`
                    : `${day} Task Reminder • ${nowTime}`,
                  type: 'task',
                  day,
                  taskId: task.id,
                  time: nowTime,
                  timestamp: Date.now(),
                },
              ]);
            }
          }
        });
      });

      // Check Habit Reminders
      habits.forEach((habit) => {
        if (!habit.reminder || !habit.reminder.enabled) return;

        const appliesToday =
          habit.reminder.isRecurring || habit.reminder.day === currentDay;
        if (!appliesToday) return;

        if (habit.reminder.time === nowTime) {
          const triggerKey = `habit-${habit.id}-${nowTime}`;
          if (!firedMinutesRef.current.has(triggerKey)) {
            firedMinutesRef.current.add(triggerKey);

            if (soundEnabled) {
              playReminderChime();
            }
            triggerSystemNotification(
              `⚡ Habit Reminder: ${habit.name}`,
              habit.reminder.isRecurring
                ? `Daily reminder to complete your habit "${habit.name}"`
                : `${habit.reminder.day} reminder for "${habit.name}"`
            );

            setTriggeredAlerts((prev) => [
              ...prev,
              {
                id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                title: habit.name,
                subtitle: habit.reminder!.isRecurring
                  ? `Daily Habit Goal • ${nowTime}`
                  : `${habit.reminder!.day} Habit Goal • ${nowTime}`,
                type: 'habit',
                habitId: habit.id,
                time: nowTime,
                timestamp: Date.now(),
              },
            ]);
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 5000);
    return () => clearInterval(interval);
  }, [tasksByDay, habits, wakeAlarms, soundEnabled]);

  const handleDismissAlert = (alertId: string) => {
    setTriggeredAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleSnoozeAlert = (alert: TriggeredReminderAlert) => {
    handleDismissAlert(alert.id);
    setTimeout(() => {
      if (soundEnabled) {
        playReminderChime();
      }
      triggerSystemNotification(`⏰ Snoozed Reminder: ${alert.title}`, alert.subtitle);
      setTriggeredAlerts((prev) => [
        ...prev,
        {
          ...alert,
          id: `snooze-${Date.now()}`,
          subtitle: `Snoozed Alert • ${getCurrentTimeString()}`,
          timestamp: Date.now(),
        },
      ]);
    }, 5 * 60 * 1000);
  };

  // If user is not onboarded, or explicitly editing compass in full-screen
  if (!userProfile.onboarded || isEditingCompass) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] dark:bg-[#12100E] flex items-center justify-center p-3 sm:p-6 transition-colors duration-200">
        <OnboardingPage
          theme={activeThemeConfig}
          initialProfile={userProfile}
          isEditing={isEditingCompass}
          onCancelEdit={() => setIsEditingCompass(false)}
          onComplete={(newProfile) => {
            setUserProfile(newProfile);
            setIsEditingCompass(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5EE] dark:bg-[#12100E] flex flex-col lg:flex-row text-[#1C1917] dark:text-[#F5F2EB] font-sans selection:bg-[#B88939] selection:text-white transition-colors duration-200">
      {/* 1. Sidebar Navigation (Desktop & Mobile) */}
      {!focusMode && (
        <SidebarNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userProfile={userProfile}
          theme={activeThemeConfig}
          appearance={appearance}
          resolvedAppearance={resolvedAppearance}
          onSelectAppearance={handleSelectAppearance}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenReminders={() => setIsRemindersModalOpen(true)}
          onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          isOnline={isOnline}
          canInstall={canInstall}
          activeRemindersCount={activeRemindersCount}
          tasksCompleted={tasksCompleted}
          totalTasks={totalTasks}
          habitsCount={habits.length}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      )}

      {/* Floating Focus Mode Bar (Top-Right) */}
      {focusMode && (
        <div className="fixed top-4 right-4 z-40 flex items-center gap-2.5 bg-[#1C1917] text-[#D4AF37] border border-amber-900/40 rounded-full px-3.5 py-1.5 shadow-xl backdrop-blur-xs animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-stone-200">
            Focus Mode
          </span>
          <span className="text-[10px] font-mono text-stone-400 hidden sm:inline">
            (Esc to exit)
          </span>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-1 text-stone-400 hover:text-stone-200 rounded cursor-pointer transition-colors ml-0.5"
            title="Open Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleToggleFocusMode}
            className="flex items-center gap-1 text-[10px] font-serif font-bold uppercase px-2 py-0.5 rounded bg-gradient-to-r from-[#B88939] to-[#D4AF37] text-[#1C1917] hover:brightness-105 cursor-pointer transition-all shadow-2xs ml-1"
            title="Exit Focus Mode (Esc)"
          >
            <Minimize2 className="w-3 h-3" />
            <span>Exit</span>
          </button>
        </div>
      )}

      {/* 2. Main Page Content Canvas */}
      <main
        className={`flex-1 p-3.5 sm:p-6 md:p-8 lg:p-10 pb-24 lg:pb-12 ${
          focusMode ? 'max-w-4xl' : 'max-w-[1600px]'
        } w-full mx-auto flex flex-col`}
      >
        {/* Offline / Online Sync Banner */}
        {!focusMode && (
          <OfflineSyncBanner
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
            canInstall={canInstall}
          />
        )}
        {/* Page 2: Dashboard / This Week */}
        {activeTab === 'dashboard' && (
          <DashboardPage
            tasksByDay={tasksByDay}
            habits={habits}
            notes={notes}
            theme={activeThemeConfig}
            dayDates={dayDates}
            offDays={offDays}
            academicState={academicState}
            onToggleOffDay={handleToggleOffDay}
            onSaveNotes={handleSaveNotes}
            onClearNotes={handleClearNotes}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onMoveTask={handleMoveTask}
            onMoveTaskToDay={handleMoveTaskToDay}
            onRescheduleAllOverdueToToday={handleRescheduleAllOverdueToToday}
            onUpdateTaskMetadata={handleUpdateTaskMetadata}
            onSaveTaskReminder={handleSaveTaskReminder}
            onNavigateWeek={handleNavigateWeek}
            onResetToCurrentWeek={handleResetToCurrentWeek}
            onSelectWeek={handleWeekChange}
            onOpenMonthlyView={() => setActiveTab('monthly')}
            focusMode={focusMode}
            onToggleFocusMode={handleToggleFocusMode}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* Page: Monthly Overview */}
        {activeTab === 'monthly' && (
          <MonthlyViewPage
            currentStartOfWeek={startOfWeek}
            currentMondayISO={startOfWeek}
            theme={activeThemeConfig}
            academicState={academicState}
            userProfile={userProfile}
            offDays={offDays}
            onSelectWeek={(mondayISO) => {
              handleWeekChange(mondayISO);
              setActiveTab('dashboard');
            }}
          />
        )}

        {/* Page 3: Habits */}
        {activeTab === 'habits' && (
          <HabitsPage
            habits={habits}
            theme={activeThemeConfig}
            dayDates={dayDates}
            offDays={offDays}
            startOfWeekISO={startOfWeek}
            onAddHabit={handleAddHabit}
            onToggleHabitDay={handleToggleHabitDay}
            onEditHabitName={handleEditHabitName}
            onDeleteHabit={handleDeleteHabit}
            onSaveHabitReminder={handleSaveHabitReminder}
          />
        )}

        {/* Page 4: School / Academic & Long-Term Goals */}
        {activeTab === 'academic' && (
          <AcademicPage
            academicState={academicState}
            onUpdateAcademicState={handleUpdateAcademicState}
            theme={activeThemeConfig}
            dayDates={dayDates}
            userProfile={userProfile}
          />
        )}

        {/* Page 5: AI Coach */}
        {activeTab === 'coach' && (
          <AICoachPage
            userProfile={userProfile}
            tasksByDay={tasksByDay}
            habits={habits}
            notes={notes}
            startOfWeek={startOfWeek}
            theme={activeThemeConfig}
            dayDates={dayDates}
            offDays={offDays}
            academicContext={academicState}
            onAddTask={handleAddTask}
            onAddHabit={handleAddHabit}
          />
        )}

        {/* Page 6: Language Practice */}
        {activeTab === 'languages' && (
          <LanguagePracticePage
            theme={activeThemeConfig}
            userName={userProfile.name}
            userAvatar={userProfile.avatar}
          />
        )}

        {/* Application Footer */}
        <footer
          id="application-footer"
          className="mt-14 pt-6 pb-6 border-t border-[#D8CFBF] dark:border-[#3D352B] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-stone-500 dark:text-stone-400 no-print"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#26201B] to-[#171412] text-[#D4AF37] border border-[#B88939]/40 flex items-center justify-center font-serif font-black text-xs shadow-xs shrink-0">
              MW
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-stone-900 dark:text-stone-100 tracking-wide text-sm">
                  My Week
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C6826] dark:text-[#E2BE7A] px-2 py-0.5 rounded bg-[#FAF6EE] dark:bg-[#24201B] border border-[#E0D5C1] dark:border-[#3D352B]">
                  Planner & Study Suite
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans mt-0.5">
                Precision Academic, Productivity & Language System
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1 text-center sm:text-right">
            <div className="text-stone-600 dark:text-stone-300 font-serif italic text-xs">
              “Excellence in planning, mastery in daily execution.”
            </div>
            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
              {userProfile.name ? `Personalized for ${userProfile.name}` : 'Built for Daily Focus & Mastery'}
            </span>
          </div>
        </footer>
      </main>

      {/* Settings & Goals Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={theme}
        onSelectTheme={setTheme}
        appearance={appearance}
        resolvedAppearance={resolvedAppearance}
        onSelectAppearance={handleSelectAppearance}
        userProfile={userProfile}
        onUpdateUserProfile={handleUpdateUserProfile}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetData}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onOpenInstallModal={() => {
          setIsSettingsOpen(false);
          setIsInstallModalOpen(true);
        }}
        onOpenProfile={() => {
          setIsSettingsOpen(false);
          setIsProfileOpen(true);
        }}
        canInstall={canInstall}
        focusMode={focusMode}
        onToggleFocusMode={handleToggleFocusMode}
      />

      {/* User Profile & Identity Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
        onUpdateUserProfile={handleUpdateUserProfile}
      />

      {/* Progressive Web App (PWA) Install Modal */}
      <PwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onNativeInstall={handleNativeInstall}
        canNativeInstall={canInstall}
        isStandalone={isRunningStandalone()}
      />

      {/* Centralized Reminders & Wake Alarms Center Modal */}
      <RemindersCenterModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        tasksByDay={tasksByDay}
        habits={habits}
        theme={activeThemeConfig}
        onUpdateTaskReminder={handleUpdateTaskReminderStatus}
        onDeleteTaskReminder={handleDeleteTaskReminder}
        onUpdateHabitReminder={handleUpdateHabitReminderStatus}
        onDeleteHabitReminder={handleDeleteHabitReminder}
        wakeAlarms={wakeAlarms}
        onSaveWakeAlarm={handleSaveWakeAlarm}
        onToggleWakeAlarm={handleToggleWakeAlarm}
        onDeleteWakeAlarm={handleDeleteWakeAlarm}
        onTestWakeAlarm={handleTestWakeAlarm}
      />

      {/* Full-Screen Wake Challenge Modal (triggered by scheduled alarms or testing) */}
      {activeWakeAlarm && (
        <WakeChallengeModal
          alarm={activeWakeAlarm}
          isOpen={!!activeWakeAlarm}
          onDismiss={handleDismissWakeAlarm}
          onSnooze={handleSnoozeWakeAlarm}
        />
      )}

      {/* Global Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        dayDates={dayDates}
        subjects={academicState.subjects}
        theme={activeThemeConfig}
        onAddTask={handleAddTask}
        onLogStudyHours={handleLogStudyHoursFromCapture}
        onAddSubject={handleAddSubjectFromCapture}
      />

      {/* Real-time In-App Reminder / Alarm Banner */}
      <TriggeredAlertBanner
        alerts={triggeredAlerts}
        theme={activeThemeConfig}
        onDismiss={handleDismissAlert}
        onCompleteTask={(day, taskId) => handleToggleTask(day as DayOfWeek, taskId)}
        onSnooze={handleSnoozeAlert}
      />
    </div>
  );
}
