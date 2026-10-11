import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AcademicState,
  DayOfWeek,
  FocusSession,
  FocusTimerMode,
  TaskItem,
  ThemeConfig,
} from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Coffee,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  Check,
  Calendar,
  AlertCircle,
  Zap,
  Square,
} from 'lucide-react';
import { getCurrentDayOfWeek, triggerSystemNotification } from '../utils/notificationService';
import { playStudyCompleteChime } from '../utils/audio';
import {
  calculateFocusXP,
  getCurrentTimeHHMM,
  getTodayDateISO,
  getTodayFocusSessions,
  getTodayTotalFocusMinutes,
  loadActiveFocusTimerState,
  loadFocusSessions,
  recordFocusSession,
  saveActiveFocusTimerState,
} from '../utils/focusSessionUtils';

interface FocusPageProps {
  theme: ThemeConfig;
  tasksByDay: Record<DayOfWeek, TaskItem[]>;
  academicState: AcademicState;
  onToggleTask: (day: DayOfWeek, taskId: string) => void;
  onLogStudyHours: (subjectId: string, day: DayOfWeek, hours: number) => void;
  onSessionRecorded?: (session: FocusSession) => void;
  onNavigateToDashboard: () => void;
  preselectedTask?: { task: TaskItem; day: DayOfWeek } | null;
  onClearPreselectedTask?: () => void;
}

const TIMER_PRESETS: Record<
  '25_5' | '50_10' | '90_15',
  { label: string; focusMin: number; breakMin: number; desc: string }
> = {
  '25_5': { label: '25 / 5', focusMin: 25, breakMin: 5, desc: 'Classic Pomodoro' },
  '50_10': { label: '50 / 10', focusMin: 50, breakMin: 10, desc: 'Deep Focus Work' },
  '90_15': { label: '90 / 15', focusMin: 90, breakMin: 15, desc: 'Ultradian Mastery' },
};

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Chemistry',
  'Biology',
  'SAT',
  'English',
  'Programming',
];

export const FocusPage: React.FC<FocusPageProps> = ({
  theme,
  tasksByDay,
  academicState,
  onToggleTask,
  onLogStudyHours,
  onSessionRecorded,
  onNavigateToDashboard,
  preselectedTask,
  onClearPreselectedTask,
}) => {
  const todayDay = getCurrentDayOfWeek();

  // 1. Session History
  const [sessions, setSessions] = useState<FocusSession[]>(() => loadFocusSessions());

  // 2. Timer Configuration Mode
  const [timerMode, setTimerMode] = useState<FocusTimerMode>('25_5');
  const [customFocusMinutes, setCustomFocusMinutes] = useState<number>(30);
  const [customBreakMinutes, setCustomBreakMinutes] = useState<number>(5);

  // 3. Selection mode: 'subject' | 'task'
  const [targetType, setTargetType] = useState<'subject' | 'task'>(() => {
    return preselectedTask ? 'task' : 'subject';
  });

  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    return academicState.subjects[0]?.name || DEFAULT_SUBJECTS[0];
  });
  const [customSubjectInput, setCustomSubjectInput] = useState<string>('');

  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => {
    return preselectedTask?.task.id || '';
  });
  const [selectedTaskDay, setSelectedTaskDay] = useState<DayOfWeek>(() => {
    return preselectedTask?.day || todayDay;
  });

  // 4. Timer State
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'break' | 'break_paused' | 'completed'>(() => {
    const saved = loadActiveFocusTimerState();
    if (saved && saved.status !== 'idle') return saved.status;
    return 'idle';
  });

  const [totalSeconds, setTotalSeconds] = useState<number>(() => {
    const saved = loadActiveFocusTimerState();
    if (saved) return saved.focusMinutes * 60;
    return 25 * 60;
  });

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const saved = loadActiveFocusTimerState();
    if (saved) {
      if (saved.endTimestamp && (saved.status === 'running' || saved.status === 'break')) {
        const left = Math.max(0, Math.ceil((saved.endTimestamp - Date.now()) / 1000));
        return left;
      }
      return saved.remainingSeconds;
    }
    return 25 * 60;
  });

  const [sessionStartTime, setSessionStartTime] = useState<string>(() => {
    const saved = loadActiveFocusTimerState();
    return saved?.sessionStartTime || getCurrentTimeHHMM();
  });

  const [activeLabel, setActiveLabel] = useState<string>(() => {
    const saved = loadActiveFocusTimerState();
    return saved?.subjectOrTask || selectedSubject;
  });

  // End timestamp for exact accurate tick calculation
  const endTimestampRef = useRef<number | null>(null);

  // 5. Completion Card state
  const [completedSessionInfo, setCompletedSessionInfo] = useState<{
    durationMinutes: number;
    subjectOrTask: string;
    xpEarned: number;
    taskId?: string;
    taskDay?: DayOfWeek;
    isAssociatedTaskDone?: boolean;
  } | null>(null);

  // 6. Early exit confirmation dialog
  const [showEarlyExitDialog, setShowEarlyExitDialog] = useState(false);

  // 7. Show History Accordion
  const [showHistory, setShowHistory] = useState(false);

  // Sync preselectedTask if changed externally
  useEffect(() => {
    if (preselectedTask) {
      setTargetType('task');
      setSelectedTaskId(preselectedTask.task.id);
      setSelectedTaskDay(preselectedTask.day);
      setActiveLabel(preselectedTask.task.text);
      if (onClearPreselectedTask) onClearPreselectedTask();
    }
  }, [preselectedTask, onClearPreselectedTask]);

  // Combine subjects from academicState and defaults
  const availableSubjects = Array.from(
    new Set([
      ...academicState.subjects.map((s) => s.name),
      ...DEFAULT_SUBJECTS,
    ])
  );

  // Get active focus duration based on mode
  const getFocusMinutes = useCallback(() => {
    if (timerMode === 'custom') return customFocusMinutes;
    return TIMER_PRESETS[timerMode].focusMin;
  }, [timerMode, customFocusMinutes]);

  const getBreakMinutes = useCallback(() => {
    if (timerMode === 'custom') return customBreakMinutes;
    return TIMER_PRESETS[timerMode].breakMin;
  }, [timerMode, customBreakMinutes]);

  // Update total seconds if idle and mode changes
  useEffect(() => {
    if (status === 'idle') {
      const focusMins = getFocusMinutes();
      setTotalSeconds(focusMins * 60);
      setRemainingSeconds(focusMins * 60);
    }
  }, [timerMode, customFocusMinutes, status, getFocusMinutes]);

  // Save active timer state on changes
  useEffect(() => {
    if (status === 'idle') {
      saveActiveFocusTimerState(null);
    } else {
      saveActiveFocusTimerState({
        status,
        mode: timerMode,
        focusMinutes: getFocusMinutes(),
        breakMinutes: getBreakMinutes(),
        remainingSeconds,
        endTimestamp: endTimestampRef.current,
        subjectOrTask: activeLabel,
        taskId: targetType === 'task' ? selectedTaskId : undefined,
        sessionStartTime,
        isBreak: status === 'break' || status === 'break_paused',
      });
    }
  }, [status, timerMode, remainingSeconds, activeLabel, sessionStartTime, targetType, selectedTaskId, getFocusMinutes, getBreakMinutes]);

  // Find all unfinished tasks across today & week for selection
  const allWeekUnfinishedTasks: Array<{ task: TaskItem; day: DayOfWeek }> = [];
  const daysOrder: DayOfWeek[] = [
    todayDay,
    ...['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter((d) => d !== todayDay) as DayOfWeek[],
  ];
  daysOrder.forEach((d) => {
    (tasksByDay[d] || []).forEach((t) => {
      if (!t.completed) {
        allWeekUnfinishedTasks.push({ task: t, day: d });
      }
    });
  });

  const selectedTaskObj = allWeekUnfinishedTasks.find(
    (item) => item.task.id === selectedTaskId
  );

  // Log hours to academic state
  const logHoursToSubject = useCallback(
    (minutes: number, targetName: string) => {
      if (minutes <= 0) return;
      const hours = parseFloat((minutes / 60).toFixed(2));
      const match = academicState.subjects.find(
        (s) => s.name.toLowerCase() === targetName.toLowerCase()
      );
      if (match) {
        onLogStudyHours(match.id, todayDay, hours);
      } else if (academicState.subjects.length > 0) {
        onLogStudyHours(academicState.subjects[0].id, todayDay, hours);
      }
    },
    [academicState.subjects, onLogStudyHours, todayDay]
  );

  // Complete focus session naturally or early
  const finalizeFocusSession = useCallback(
    (minutesStudied: number, completedNaturally: boolean) => {
      if (minutesStudied <= 0) return;

      const xp = calculateFocusXP(minutesStudied);
      const endTime = getCurrentTimeHHMM();

      const newSession = recordFocusSession({
        date: getTodayDateISO(),
        startTime: sessionStartTime,
        endTime,
        durationMinutes: minutesStudied,
        subjectOrTask: activeLabel,
        taskId: targetType === 'task' ? selectedTaskId : undefined,
        completed: completedNaturally,
        xpEarned: xp,
      });

      // Update state
      setSessions((prev) => [newSession, ...prev]);

      // Connect to study total in academic state & dashboard
      logHoursToSubject(minutesStudied, activeLabel);

      if (onSessionRecorded) {
        onSessionRecorded(newSession);
      }

      // Play completion chime
      playStudyCompleteChime();

      // System notification
      triggerSystemNotification(
        completedNaturally ? '🏆 Focus Session Complete!' : '⏹ Focus Session Saved',
        `Logged ${minutesStudied} minutes on "${activeLabel}". +${xp} XP awarded!`
      );

      // Show completion screen
      setCompletedSessionInfo({
        durationMinutes: minutesStudied,
        subjectOrTask: activeLabel,
        xpEarned: xp,
        taskId: targetType === 'task' ? selectedTaskId : undefined,
        taskDay: targetType === 'task' ? selectedTaskDay : undefined,
        isAssociatedTaskDone: false,
      });

      setStatus('completed');
      endTimestampRef.current = null;
    },
    [
      sessionStartTime,
      activeLabel,
      targetType,
      selectedTaskId,
      selectedTaskDay,
      logHoursToSubject,
      onSessionRecorded,
    ]
  );

  // Accurate Timer Loop using Date.now() difference
  useEffect(() => {
    if (status !== 'running' && status !== 'break') {
      endTimestampRef.current = null;
      return;
    }

    if (!endTimestampRef.current) {
      endTimestampRef.current = Date.now() + remainingSeconds * 1000;
    }

    const interval = setInterval(() => {
      if (!endTimestampRef.current) return;
      const now = Date.now();
      const diffMs = endTimestampRef.current - now;
      const left = Math.max(0, Math.ceil(diffMs / 1000));

      setRemainingSeconds(left);

      if (left <= 0) {
        clearInterval(interval);
        endTimestampRef.current = null;

        if (status === 'running') {
          // Focus timer hit zero!
          const focusMins = getFocusMinutes();
          finalizeFocusSession(focusMins, true);
        } else if (status === 'break') {
          // Break finished
          playStudyCompleteChime();
          triggerSystemNotification('☕ Break Finished', 'Ready to resume your next focus session?');
          // Reset to idle focus
          const focusMins = getFocusMinutes();
          setStatus('idle');
          setTotalSeconds(focusMins * 60);
          setRemainingSeconds(focusMins * 60);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [status, remainingSeconds, getFocusMinutes, finalizeFocusSession]);

  // Actions
  const handleStartSession = () => {
    let label = '';
    if (targetType === 'task') {
      label = selectedTaskObj?.task.text || 'Focus Task';
    } else {
      label = customSubjectInput.trim() || selectedSubject;
    }
    setActiveLabel(label);
    setSessionStartTime(getCurrentTimeHHMM());

    const focusMins = getFocusMinutes();
    const secs = focusMins * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);

    endTimestampRef.current = Date.now() + secs * 1000;
    setStatus('running');
  };

  const handlePause = () => {
    if (endTimestampRef.current) {
      const left = Math.max(0, Math.ceil((endTimestampRef.current - Date.now()) / 1000));
      setRemainingSeconds(left);
      endTimestampRef.current = null;
    }
    if (status === 'running') {
      setStatus('paused');
    } else if (status === 'break') {
      setStatus('break_paused');
    }
  };

  const handleResume = () => {
    endTimestampRef.current = Date.now() + remainingSeconds * 1000;
    if (status === 'paused') {
      setStatus('running');
    } else if (status === 'break_paused') {
      setStatus('break');
    }
  };

  const handleRequestEndEarly = () => {
    setShowEarlyExitDialog(true);
  };

  const handleConfirmEndEarly = () => {
    setShowEarlyExitDialog(false);
    const focusMins = getFocusMinutes();
    const elapsedSeconds = Math.max(0, totalSeconds - remainingSeconds);
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    if (elapsedMinutes >= 1) {
      finalizeFocusSession(elapsedMinutes, false);
    } else {
      handleCancelSession();
    }
  };

  const handleCancelSession = () => {
    setShowEarlyExitDialog(false);
    endTimestampRef.current = null;
    setStatus('idle');
    const focusMins = getFocusMinutes();
    setTotalSeconds(focusMins * 60);
    setRemainingSeconds(focusMins * 60);
    saveActiveFocusTimerState(null);
  };

  const handleStartBreak = () => {
    const breakMins = getBreakMinutes();
    const secs = breakMins * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    endTimestampRef.current = Date.now() + secs * 1000;
    setStatus('break');
    setCompletedSessionInfo(null);
  };

  const handleSkipBreak = () => {
    endTimestampRef.current = null;
    const focusMins = getFocusMinutes();
    setTotalSeconds(focusMins * 60);
    setRemainingSeconds(focusMins * 60);
    setStatus('idle');
    setCompletedSessionInfo(null);
  };

  // Helper formatting: MM:SS or HH:MM:SS
  const formatTimeDisplay = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Progress percentage (0 to 100)
  const progressPercent = totalSeconds > 0
    ? Math.min(100, Math.max(0, Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100)))
    : 0;

  // Stats for today
  const todayMinutes = getTodayTotalFocusMinutes(sessions);
  const todayHoursPart = Math.floor(todayMinutes / 60);
  const todayMinsPart = todayMinutes % 60;
  const todayFormatted =
    todayMinutes <= 0
      ? '0m'
      : todayHoursPart > 0 && todayMinsPart > 0
      ? `${todayHoursPart}h ${todayMinsPart}m`
      : todayHoursPart > 0
      ? `${todayHoursPart}h`
      : `${todayMinsPart}m`;

  const todaySessionsList = getTodayFocusSessions(sessions);
  const todayXP = todaySessionsList.reduce((sum, s) => sum + (s.xpEarned || 0), 0);

  return (
    <div className="w-full flex flex-col gap-5 animate-fadeIn max-w-4xl mx-auto pb-12">
      {/* 1. Executive Sanctuary Header Bar */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(20,18,15,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-[#B88939] dark:text-[#E2BE7A] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Focus & Deep Work Sanctuary
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Focus Mode
          </h1>
        </div>

        {/* Today's Focus Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Today's Total Focus Time */}
          <div className="flex items-center gap-2 bg-[#F7F3EB] dark:bg-[#24201B] px-3 py-1.5 rounded-lg border border-[#EAE3D5] dark:border-[#3D352B] shadow-2xs">
            <Clock className="w-4 h-4 text-[#B88939]" />
            <div>
              <span className="text-[9px] font-sans font-bold text-stone-500 uppercase tracking-wider block">
                Today's Focus
              </span>
              <span className="text-xs sm:text-sm font-serif font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                {todayFormatted}
              </span>
            </div>
          </div>

          {/* Today's XP */}
          <div className="flex items-center gap-2 bg-[#F7F3EB] dark:bg-[#24201B] px-3 py-1.5 rounded-lg border border-[#EAE3D5] dark:border-[#3D352B] shadow-2xs">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <div>
              <span className="text-[9px] font-sans font-bold text-stone-500 uppercase tracking-wider block">
                Focus XP
              </span>
              <span className="text-xs sm:text-sm font-serif font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                +{todayXP} XP
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="px-3 py-1.5 text-xs font-serif font-bold uppercase rounded-lg bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer shadow-2xs transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* 2. Main Timer Canvas Card */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-2xl p-5 sm:p-8 shadow-[0_8px_30px_rgba(20,18,15,0.08)] flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Subtle background luxury glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: status === 'break' ? '#10B981' : theme.goldAccent }}
        />

        {/* Mode & Subject Pill */}
        <div className="mb-4 flex items-center gap-2 flex-wrap justify-center">
          <span className="px-3 py-1 rounded-full text-xs font-serif font-bold uppercase tracking-wider bg-amber-500/10 text-[#B88939] dark:text-[#E2BE7A] border border-amber-500/20">
            {status === 'break' || status === 'break_paused'
              ? '☕ Break Time'
              : status === 'running'
              ? '🔥 Deep Focus'
              : status === 'paused'
              ? '⏸ Paused'
              : 'Target Configuration'}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#F0EBE0] dark:bg-[#26211C] text-stone-800 dark:text-stone-200 border border-[#DDD5C5] dark:border-[#3D352B] max-w-xs truncate">
            {activeLabel}
          </span>
        </div>

        {/* Circular Progress & Time Display (Responsive 360px+) */}
        <div className="relative my-4 flex items-center justify-center">
          {/* SVG Circular Progress Ring */}
          <svg className="w-56 h-56 sm:w-72 sm:h-72 -rotate-90 transform" viewBox="0 0 240 240">
            {/* Background track */}
            <circle
              cx="120"
              cy="120"
              r="100"
              stroke="currentColor"
              strokeWidth="10"
              className="text-stone-200/80 dark:text-stone-800/80"
              fill="transparent"
            />
            {/* Active progress */}
            <circle
              cx="120"
              cy="120"
              r="100"
              stroke={status === 'break' || status === 'break_paused' ? '#10B981' : theme.goldAccent}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 100}
              strokeDashoffset={2 * Math.PI * 100 * (1 - progressPercent / 100)}
              className="transition-all duration-300"
              fill="transparent"
            />
          </svg>

          {/* Center Digital Clock Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl sm:text-6xl font-mono font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {formatTimeDisplay(remainingSeconds)}
            </span>
            <span className="text-xs sm:text-sm font-serif font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mt-1">
              {status === 'break' || status === 'break_paused'
                ? 'Rest & Recharge'
                : `${progressPercent}% Completed`}
            </span>
          </div>
        </div>

        {/* Control Buttons Bar (Thumb-Friendly for Android 360px-412px) */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 w-full max-w-md flex-wrap">
          {status === 'idle' && (
            <button
              type="button"
              onClick={handleStartSession}
              className="flex-1 min-h-[50px] flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1C1917] text-[#D4AF37] hover:bg-stone-800 text-sm sm:text-base font-serif font-bold tracking-wider uppercase border border-amber-900/40 shadow-lg cursor-pointer transition-all active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Focus Session</span>
            </button>
          )}

          {status === 'running' && (
            <>
              <button
                type="button"
                onClick={handlePause}
                className="flex-1 min-h-[48px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1C1917] text-[#D4AF37] hover:bg-stone-800 text-sm font-serif font-bold uppercase border border-amber-900/40 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </button>

              <button
                type="button"
                onClick={handleRequestEndEarly}
                className="flex-1 min-h-[48px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-800 dark:text-stone-200 hover:text-stone-900 text-sm font-serif font-bold uppercase shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <Square className="w-4 h-4" />
                <span>End Session</span>
              </button>
            </>
          )}

          {status === 'paused' && (
            <>
              <button
                type="button"
                onClick={handleResume}
                className="flex-1 min-h-[48px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1C1917] text-[#D4AF37] hover:bg-stone-800 text-sm font-serif font-bold uppercase border border-amber-900/40 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </button>

              <button
                type="button"
                onClick={handleRequestEndEarly}
                className="flex-1 min-h-[48px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-800 dark:text-stone-200 text-sm font-serif font-bold uppercase shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <Square className="w-4 h-4" />
                <span>End & Save</span>
              </button>

              <button
                type="button"
                onClick={handleCancelSession}
                className="px-3.5 py-3 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-red-600 text-xs font-serif font-bold uppercase cursor-pointer"
                title="Reset session without saving"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}

          {(status === 'break' || status === 'break_paused') && (
            <>
              {status === 'break' ? (
                <button
                  type="button"
                  onClick={handlePause}
                  className="flex-1 min-h-[48px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-800 text-white hover:bg-emerald-700 text-sm font-serif font-bold uppercase shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Break</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResume}
                  className="flex-1 min-h-[48px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-800 text-white hover:bg-emerald-700 text-sm font-serif font-bold uppercase shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Break</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSkipBreak}
                className="flex-1 min-h-[48px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-800 dark:text-stone-200 text-sm font-serif font-bold uppercase shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Skip Break</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. Session Target & Timer Mode Configuration (Visible when Idle) */}
      {status === 'idle' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
          {/* Left Box: Choose Timer Mode */}
          <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-[#EAE3D5] dark:border-[#2E2820] pb-2.5">
              <Clock className="w-4 h-4 text-[#B88939]" />
              <h2 className="text-xs sm:text-sm font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                1. Select Timer Mode
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['25_5', '50_10', '90_15', 'custom'] as const).map((m) => {
                const isSelected = timerMode === m;
                const info = m !== 'custom' ? TIMER_PRESETS[m] : null;

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTimerMode(m)}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/40 shadow-xs ring-1 ring-[#B88939]'
                        : 'bg-white dark:bg-[#24201B] border-[#D8CFBF] dark:border-[#3D352B] text-stone-800 dark:text-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <span className="text-sm font-serif font-bold">
                      {m === 'custom' ? 'Custom Timer' : info?.label}
                    </span>
                    <span
                      className={`text-[10px] font-sans mt-0.5 ${
                        isSelected ? 'text-stone-300' : 'text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      {m === 'custom'
                        ? `${customFocusMinutes}m / ${customBreakMinutes}m`
                        : info?.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Timer Inputs */}
            {timerMode === 'custom' && (
              <div className="flex items-center gap-3 pt-2 border-t border-[#EAE3D5] dark:border-[#2E2820] text-xs">
                <div className="flex-1 flex flex-col gap-1">
                  <label htmlFor="custom-focus-minutes" className="text-[10px] font-serif font-bold uppercase text-stone-500">
                    Focus Duration (Minutes):
                  </label>
                  <input
                    id="custom-focus-minutes"
                    type="number"
                    min="1"
                    max="180"
                    value={customFocusMinutes}
                    onChange={(e) => setCustomFocusMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="px-3 py-1.5 rounded bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 font-mono font-bold"
                  />
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <label htmlFor="custom-break-minutes" className="text-[10px] font-serif font-bold uppercase text-stone-500">
                    Break Duration (Minutes):
                  </label>
                  <input
                    id="custom-break-minutes"
                    type="number"
                    min="1"
                    max="60"
                    value={customBreakMinutes}
                    onChange={(e) => setCustomBreakMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="px-3 py-1.5 rounded bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 font-mono font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Box: Choose Target (Subject vs Task) */}
          <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#EAE3D5] dark:border-[#2E2820] pb-2.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#B88939]" />
                <h2 className="text-xs sm:text-sm font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  2. Choose Focus Target
                </h2>
              </div>

              {/* Segmented Switcher */}
              <div className="inline-flex p-0.5 bg-[#EAE3D5] dark:bg-[#24201B] rounded-md border border-[#D8CFBF] dark:border-[#3D352B]">
                <button
                  type="button"
                  onClick={() => setTargetType('subject')}
                  className={`px-2.5 py-1 text-[10px] font-serif font-bold uppercase rounded transition-all cursor-pointer ${
                    targetType === 'subject'
                      ? 'bg-[#1C1917] text-[#D4AF37] shadow-xs'
                      : 'text-stone-700 dark:text-stone-300'
                  }`}
                >
                  Subject
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('task')}
                  className={`px-2.5 py-1 text-[10px] font-serif font-bold uppercase rounded transition-all cursor-pointer ${
                    targetType === 'task'
                      ? 'bg-[#1C1917] text-[#D4AF37] shadow-xs'
                      : 'text-stone-700 dark:text-stone-300'
                  }`}
                >
                  Task
                </button>
              </div>
            </div>

            {/* Subject Selector */}
            {targetType === 'subject' && (
              <div className="flex flex-col gap-2.5">
                <label htmlFor="focus-subject-select" className="text-[10px] font-serif font-bold uppercase text-stone-500">
                  Select Academic Discipline or Project:
                </label>
                <select
                  id="focus-subject-select"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full text-xs font-serif font-bold uppercase px-3 py-2.5 rounded-lg bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-800 dark:text-stone-200 cursor-pointer"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-sans text-stone-400">or type custom:</span>
                  <input
                    type="text"
                    placeholder="e.g. Physics, Research Paper..."
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    className="flex-1 text-xs px-2.5 py-1.5 rounded bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 placeholder-stone-400"
                  />
                </div>
              </div>
            )}

            {/* Task Selector */}
            {targetType === 'task' && (
              <div className="flex flex-col gap-2">
                <label htmlFor="focus-task-select" className="text-[10px] font-serif font-bold uppercase text-stone-500">
                  Select Existing Task to Execute:
                </label>
                {allWeekUnfinishedTasks.length === 0 ? (
                  <p className="text-xs text-stone-500 dark:text-stone-400 py-3 text-center border border-dashed rounded-lg">
                    No unfinished tasks found this week. Create one on the Dashboard!
                  </p>
                ) : (
                  <select
                    id="focus-task-select"
                    value={selectedTaskId}
                    onChange={(e) => {
                      setSelectedTaskId(e.target.value);
                      const found = allWeekUnfinishedTasks.find(
                        (i) => i.task.id === e.target.value
                      );
                      if (found) {
                        setSelectedTaskDay(found.day);
                        setActiveLabel(found.task.text);
                      }
                    }}
                    className="w-full text-xs font-medium px-3 py-2.5 rounded-lg bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-800 dark:text-stone-200 cursor-pointer"
                  >
                    <option value="">-- Choose a task --</option>
                    {allWeekUnfinishedTasks.map(({ task, day }) => (
                      <option key={task.id} value={task.id}>
                        [{day}] {task.priority ? `(${task.priority.toUpperCase()}) ` : ''}
                        {task.text.slice(0, 50)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Session Completion Modal / Card (Requirement 8) */}
      {status === 'completed' && completedSessionInfo && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-600/40 rounded-2xl p-5 sm:p-7 shadow-xl animate-fadeIn flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Milestone Achieved
              </span>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-emerald-950 dark:text-emerald-100">
                Focus Session Complete!
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white/70 dark:bg-[#1C1917]/70 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
            <div>
              <span className="text-[10px] font-serif font-bold uppercase text-stone-500">Duration</span>
              <p className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
                {completedSessionInfo.durationMinutes} min
              </p>
            </div>
            <div>
              <span className="text-[10px] font-serif font-bold uppercase text-stone-500">Subject / Task</span>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                {completedSessionInfo.subjectOrTask}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-serif font-bold uppercase text-stone-500">XP Earned</span>
              <p className="text-base font-serif font-bold text-[#B88939] dark:text-[#E2BE7A]">
                +{completedSessionInfo.xpEarned} XP
              </p>
            </div>
            <div>
              <span className="text-[10px] font-serif font-bold uppercase text-stone-500">Today's Study Total</span>
              <p className="text-base font-serif font-bold text-emerald-700 dark:text-emerald-400">
                {todayFormatted}
              </p>
            </div>
          </div>

          {/* Option to complete associated task */}
          {completedSessionInfo.taskId && completedSessionInfo.taskDay && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#201C18] border border-emerald-200 dark:border-emerald-850">
              <span className="text-xs font-serif font-bold text-stone-800 dark:text-stone-200">
                Mark task as completed in your planner?
              </span>
              <button
                type="button"
                onClick={() => {
                  onToggleTask(completedSessionInfo.taskDay!, completedSessionInfo.taskId!);
                  setCompletedSessionInfo((prev) =>
                    prev ? { ...prev, isAssociatedTaskDone: !prev.isAssociatedTaskDone } : null
                  );
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold uppercase rounded cursor-pointer transition-all ${
                  completedSessionInfo.isAssociatedTaskDone
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#1C1917] text-[#D4AF37]'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {completedSessionInfo.isAssociatedTaskDone ? 'Completed ✓' : 'Mark Done'}
                </span>
              </button>
            </div>
          )}

          {/* Post-Session Next Step Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap pt-2">
            <button
              type="button"
              onClick={handleStartBreak}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 text-white hover:bg-emerald-700 text-xs font-serif font-bold uppercase shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Coffee className="w-4 h-4" />
              <span>Take Break ({getBreakMinutes()}m)</span>
            </button>

            <button
              type="button"
              onClick={handleSkipBreak}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C1917] text-[#D4AF37] hover:bg-stone-800 text-xs font-serif font-bold uppercase shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>Start Next Focus</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#24201B] border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-serif font-bold uppercase cursor-pointer"
            >
              Done for Now
            </button>
          </div>
        </div>
      )}

      {/* 5. Session History Accordion (Requirement 4) */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-4 shadow-xs">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between text-xs font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#B88939]" />
            <span>Completed Focus Session History ({sessions.length})</span>
          </div>
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHistory && (
          <div className="mt-3 pt-3 border-t border-[#EAE3D5] dark:border-[#2E2820] flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {sessions.length === 0 ? (
              <p className="text-xs text-stone-400 py-3 text-center">
                No focus sessions recorded yet. Start your first session above!
              </p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-[#201C18] border border-[#EAE3D5] dark:border-[#332C24] text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        s.completed ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-serif font-bold text-stone-900 dark:text-stone-100 truncate">
                        {s.subjectOrTask}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 font-sans">
                        {s.date} • {s.startTime} - {s.endTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-mono font-bold text-stone-700 dark:text-stone-300">
                      {s.durationMinutes} min
                    </span>
                    <span className="text-[10px] font-serif font-bold text-[#B88939] bg-amber-500/10 px-2 py-0.5 rounded">
                      +{s.xpEarned} XP
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Early Exit Confirmation Dialog */}
      {showEarlyExitDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
                End Focus Session?
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-sans leading-relaxed">
              Would you like to save the time you've studied so far and earn proportional XP, or discard this session?
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleConfirmEndEarly}
                className="flex-1 py-2 rounded-lg bg-[#1C1917] text-[#D4AF37] hover:bg-stone-800 text-xs font-serif font-bold uppercase cursor-pointer"
              >
                Save & End Early
              </button>
              <button
                type="button"
                onClick={handleCancelSession}
                className="py-2 px-3 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-serif font-bold uppercase cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => setShowEarlyExitDialog(false)}
                className="py-2 px-3 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-serif font-bold uppercase cursor-pointer"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
