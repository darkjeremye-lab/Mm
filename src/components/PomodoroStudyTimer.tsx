import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AcademicSubject, DayOfWeek, DAYS_OF_WEEK, ThemeConfig } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Coffee,
  Brain,
  Volume2,
  VolumeX,
  CheckCircle2,
  PlusCircle,
  Flame,
  Clock,
  Target,
  ArrowRight,
  Sliders,
  Maximize2,
  Minimize2,
  Check,
} from 'lucide-react';
import { getCurrentDayOfWeek, triggerSystemNotification } from '../utils/notificationService';
import { playStudyCompleteChime, playToggleSound } from '../utils/audio';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

interface PresetOption {
  label: string;
  minutes: number;
  mode: PomodoroMode;
}

const PRESETS: Record<PomodoroMode, PresetOption[]> = {
  focus: [
    { label: '25 min (Classic)', minutes: 25, mode: 'focus' },
    { label: '45 min (Standard)', minutes: 45, mode: 'focus' },
    { label: '50 min (Deep Work)', minutes: 50, mode: 'focus' },
    { label: '90 min (Mastery)', minutes: 90, mode: 'focus' },
  ],
  shortBreak: [
    { label: '5 min (Short Rest)', minutes: 5, mode: 'shortBreak' },
    { label: '10 min (Recharge)', minutes: 10, mode: 'shortBreak' },
  ],
  longBreak: [
    { label: '15 min (Long Break)', minutes: 15, mode: 'longBreak' },
    { label: '20 min (Walk & Water)', minutes: 20, mode: 'longBreak' },
    { label: '30 min (Meal / Walk)', minutes: 30, mode: 'longBreak' },
  ],
};

interface PomodoroStudyTimerProps {
  subjects: AcademicSubject[];
  onLogStudyHours: (subjectId: string, day: DayOfWeek, hours: number) => void;
  theme: ThemeConfig;
  selectedSubjectId?: string;
  onSelectSubjectId?: (id: string) => void;
}

export const PomodoroStudyTimer: React.FC<PomodoroStudyTimerProps> = ({
  subjects,
  onLogStudyHours,
  theme,
  selectedSubjectId,
  onSelectSubjectId,
}) => {
  // 1. Current subject selection
  const [internalSubjectId, setInternalSubjectId] = useState<string>(() => {
    return selectedSubjectId || subjects[0]?.id || '';
  });

  const activeSubjectId = selectedSubjectId !== undefined ? selectedSubjectId : internalSubjectId;
  const currentSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  const handleChooseSubject = (id: string) => {
    setInternalSubjectId(id);
    if (onSelectSubjectId) onSelectSubjectId(id);
  };

  // 2. Timer state
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [customMinutes, setCustomMinutes] = useState<number>(25);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // 3. Intention / Topic for this session
  const [sessionGoal, setSessionGoal] = useState<string>('');

  // 4. Cycle & Completed Stats
  const [completedSessionsCount, setCompletedSessionsCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pomodoro_today_count');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [cycleRound, setCycleRound] = useState<number>(1); // 1 through 4

  // 5. Success Toast notification
  const [logToast, setLogToast] = useState<{
    subjectName: string;
    hours: number;
    day: DayOfWeek;
  } | null>(null);

  // 6. Sound & Ambient
  const [soundMuted, setSoundMuted] = useState(false);
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const ambientGainRef = useRef<GainNode | null>(null);
  const ambientAudioCtxRef = useRef<AudioContext | null>(null);

  // 7. Background accurate timing refs
  const timerEndTimestampRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sync timeLeft when duration or mode changes if not running
  const setPreset = (preset: PresetOption) => {
    setIsRunning(false);
    setIsCustomMode(false);
    setMode(preset.mode);
    setDurationMinutes(preset.minutes);
    setTimeLeft(preset.minutes * 60);
    playToggleSound();
  };

  const handleCustomDurationChange = (mins: number) => {
    const val = Math.max(1, Math.min(180, mins));
    setCustomMinutes(val);
    setDurationMinutes(val);
    if (!isRunning) {
      setTimeLeft(val * 60);
    }
  };

  // Switch mode directly
  const handleSwitchMode = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setIsCustomMode(false);
    setMode(newMode);
    const defaultMins = PRESETS[newMode][0].minutes;
    setDurationMinutes(defaultMins);
    setTimeLeft(defaultMins * 60);
    playToggleSound();
  };

  // Helper to log hours to subject for current day
  const logStudyTime = useCallback(
    (minutesToLog: number, isAutoFinish: boolean = false) => {
      if (!currentSubject || minutesToLog <= 0) return;
      const currentDay = getCurrentDayOfWeek();

      // Convert minutes to hours rounded to 2 decimal places (e.g. 25m = 0.42h, 50m = 0.83h)
      const hoursToAdd = parseFloat((minutesToLog / 60).toFixed(2));
      if (hoursToAdd <= 0) return;

      const currentVal = Number(currentSubject.dailyHours?.[currentDay]) || 0;
      const newVal = parseFloat((currentVal + hoursToAdd).toFixed(2));

      onLogStudyHours(currentSubject.id, currentDay, newVal);

      // Play completion chime
      if (!soundMuted) {
        playStudyCompleteChime();
      }

      // Show in-card toast
      setLogToast({
        subjectName: currentSubject.name,
        hours: hoursToAdd,
        day: currentDay,
      });
      setTimeout(() => setLogToast(null), 6000);

      // Desktop system notification
      triggerSystemNotification(
        `🏆 Pomodoro Finished: ${currentSubject.name}`,
        `Superb focus! Automatically logged +${hoursToAdd}h to ${currentSubject.name} for ${currentDay}.`
      );

      // Update completed count
      setCompletedSessionsCount((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem('pomodoro_today_count', String(next));
        } catch {}
        return next;
      });

      // Cycle round advance
      if (mode === 'focus') {
        setCycleRound((prev) => (prev >= 4 ? 1 : prev + 1));
      }
    },
    [currentSubject, mode, onLogStudyHours, soundMuted]
  );

  // Timer Tick Mechanism using Date.now() timestamp for exact accuracy
  useEffect(() => {
    if (!isRunning) {
      timerEndTimestampRef.current = null;
      return;
    }

    if (!timerEndTimestampRef.current) {
      timerEndTimestampRef.current = Date.now() + timeLeft * 1000;
    }

    const interval = setInterval(() => {
      if (!timerEndTimestampRef.current) return;
      const now = Date.now();
      const remainingMs = timerEndTimestampRef.current - now;
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearInterval(interval);
        setIsRunning(false);
        timerEndTimestampRef.current = null;

        // Auto log study hours if focus mode
        if (mode === 'focus') {
          logStudyTime(durationMinutes, true);
          // Suggest short break
          setTimeout(() => {
            const nextMode: PomodoroMode = cycleRound % 4 === 0 ? 'longBreak' : 'shortBreak';
            handleSwitchMode(nextMode);
          }, 800);
        } else {
          // Break finished
          if (!soundMuted) playStudyCompleteChime();
          triggerSystemNotification('☕ Break Finished', 'Ready to resume your next study session?');
          setTimeout(() => {
            handleSwitchMode('focus');
          }, 800);
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, durationMinutes, logStudyTime, cycleRound, soundMuted]);

  // Start / Pause
  const handleTogglePlay = () => {
    if (!isRunning) {
      timerEndTimestampRef.current = Date.now() + timeLeft * 1000;
      setIsRunning(true);
      playToggleSound();
    } else {
      setIsRunning(false);
      timerEndTimestampRef.current = null;
      playToggleSound();
    }
  };

  // Reset Timer
  const handleResetTimer = () => {
    setIsRunning(false);
    timerEndTimestampRef.current = null;
    setTimeLeft(durationMinutes * 60);
    playToggleSound();
  };

  // Finish early & log accrued time
  const handleFinishEarlyAndLog = () => {
    if (mode !== 'focus') {
      handleResetTimer();
      return;
    }
    const elapsedSeconds = durationMinutes * 60 - timeLeft;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    if (elapsedMinutes < 1) {
      if (window.confirm('Session has less than 1 minute elapsed. Reset timer without logging?')) {
        handleResetTimer();
      }
      return;
    }

    if (
      window.confirm(
        `Finish study block early and log ${elapsedMinutes} minutes (+${(elapsedMinutes / 60).toFixed(2)}h) to ${
          currentSubject?.name || 'Subject'
        }?`
      )
    ) {
      setIsRunning(false);
      timerEndTimestampRef.current = null;
      logStudyTime(elapsedMinutes, false);
      setTimeLeft(durationMinutes * 60);
    }
  };

  // Ambient Study Noise Synthesizer (Gentle warm brown noise / soft binaural hum)
  const toggleAmbientSound = () => {
    try {
      if (ambientPlaying) {
        if (ambientGainRef.current) {
          ambientGainRef.current.gain.linearRampToValueAtTime(
            0.001,
            ambientAudioCtxRef.current?.currentTime || 0 + 0.5
          );
          setTimeout(() => {
            ambientAudioCtxRef.current?.close();
            ambientAudioCtxRef.current = null;
          }, 500);
        }
        setAmbientPlaying(false);
      } else {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        ambientAudioCtxRef.current = ctx;

        // Generate gentle brown noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 1.5; // boost
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Lowpass filter for deep soothing focus drone
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1);
        ambientGainRef.current = gainNode;

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        noise.start();
        setAmbientPlaying(true);
      }
    } catch (e) {
      console.warn('Ambient sound not available', e);
    }
  };

  // Stop ambient audio on unmount
  useEffect(() => {
    return () => {
      if (ambientAudioCtxRef.current) {
        ambientAudioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculate Progress Percent (0 to 100)
  const totalSeconds = durationMinutes * 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  // SVG Circular Gauge Math
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const currentDay = getCurrentDayOfWeek();
  const todayLoggedForSubject = currentSubject?.dailyHours?.[currentDay] || 0;

  return (
    <div className="bg-[#FBF9F4] border border-[#D8CFBF] rounded-xl p-5 sm:p-6 shadow-[0_6px_24px_rgba(20,18,15,0.06)] relative overflow-hidden transition-all">
      {/* Top subtle leather decorative header line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9E742A] via-[#D4AF37] to-[#9E742A]" />

      {/* Success Notification Banner */}
      {logToast && (
        <div className="mb-4 p-3.5 bg-[#1C1917] border border-[#D4AF37] rounded-lg shadow-lg text-stone-100 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-full bg-[#D4AF37] text-stone-950 font-bold">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-serif font-bold text-[#E2BE7A]">
                Study Hours Automatically Logged!
              </p>
              <p className="text-[11px] text-stone-300">
                Added <strong className="text-white">+{logToast.hours} hrs</strong> to{' '}
                <strong className="text-amber-300">{logToast.subjectName}</strong> for {logToast.day}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLogToast(null)}
            className="text-stone-400 hover:text-white text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header Bar: Title, Subject Selector, Cycle Indicators */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8DFC8] dark:border-[#2E2820] pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1C1917] border border-amber-900/40 text-[#D4AF37] flex items-center justify-center shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                Academic Focus & Pomodoro Timer
              </h2>
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-[#EDE6D8] dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-700 dark:text-stone-300">
                Auto-Log Hours
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Conduct structured study blocks that directly record into your weekly subject matrix
            </p>
          </div>
        </div>

        {/* Top Badges: Completed today + Sound / Ambient toggles */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Completed streak counter */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1C1917] rounded-md border border-amber-900/30 text-[#E2BE7A] text-xs font-serif font-semibold shadow-xs">
            <Flame className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
            <span>{completedSessionsCount} blocks completed today</span>
          </div>

          {/* Ambient Noise Generator Toggle */}
          <button
            type="button"
            onClick={toggleAmbientSound}
            title={ambientPlaying ? 'Stop focus sound' : 'Play calming study background noise'}
            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded border transition-colors cursor-pointer ${
              ambientPlaying
                ? 'bg-amber-900/20 text-amber-900 dark:text-amber-300 border-amber-600/40 ring-1 ring-amber-600/30'
                : 'bg-white dark:bg-[#24201B] text-stone-600 dark:text-stone-300 border-[#D8CFBF] dark:border-[#3D352B] hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#B88939] dark:text-[#E2BE7A]" />
            <span>{ambientPlaying ? 'Noise Active' : 'Focus Sound'}</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={() => setSoundMuted((prev) => !prev)}
            title={soundMuted ? 'Unmute chimes' : 'Mute chimes'}
            className="p-1.5 rounded border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#24201B] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer shadow-2xs"
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#B88939] dark:text-[#E2BE7A]" />}
          </button>
        </div>
      </div>

      {/* 2. Main Timer Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column (5 cols): Visual Circular Countdown Display */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#F5F0E6] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl relative shadow-inner">
          {/* Mode Pill Badges */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-200/80 dark:bg-[#24201B] rounded-lg mb-4 border border-stone-300/60 dark:border-[#3D352B] shadow-2xs">
            <button
              type="button"
              onClick={() => handleSwitchMode('focus')}
              className={`px-3 py-1 text-xs font-serif font-bold uppercase rounded-md transition-all cursor-pointer ${
                mode === 'focus'
                  ? 'bg-[#1C1917] text-[#D4AF37] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Study Focus
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('shortBreak')}
              className={`px-2.5 py-1 text-xs font-serif font-bold uppercase rounded-md transition-all cursor-pointer ${
                mode === 'shortBreak'
                  ? 'bg-[#1C1917] text-emerald-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Short Break
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('longBreak')}
              className={`px-2.5 py-1 text-xs font-serif font-bold uppercase rounded-md transition-all cursor-pointer ${
                mode === 'longBreak'
                  ? 'bg-[#1C1917] text-cyan-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Long Break
            </button>
          </div>

          {/* SVG Circular Progress Ring */}
          <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center my-1">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-[#E0D7C6] dark:text-[#332B22]"
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
              />
              {/* Animated Foreground Arc */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={
                  mode === 'focus'
                    ? currentSubject?.color || '#B88939'
                    : mode === 'shortBreak'
                    ? '#059669'
                    : '#0891B2'
                }
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-300 ease-linear"
              />
            </svg>

            {/* Inner Content Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                className={`text-3xl sm:text-4xl font-mono font-bold tracking-tight text-stone-900 dark:text-stone-100 ${
                  isRunning ? 'animate-pulse' : ''
                }`}
              >
                {formatTime(timeLeft)}
              </span>

              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      mode === 'focus'
                        ? currentSubject?.color || '#B88939'
                        : mode === 'shortBreak'
                        ? '#059669'
                        : '#0891B2',
                  }}
                />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  {mode === 'focus'
                    ? isRunning
                      ? 'Deep Study'
                      : 'Ready'
                    : mode === 'shortBreak'
                    ? 'Resting'
                    : 'Long Rest'}
                </span>
              </div>

              {mode === 'focus' && currentSubject && (
                <span className="text-[11px] font-serif font-bold text-stone-800 dark:text-stone-200 max-w-[140px] truncate mt-0.5">
                  {currentSubject.name}
                </span>
              )}
            </div>
          </div>

          {/* Cycle Dots (● ● ○ ○) */}
          <div className="flex items-center gap-2 mt-3 text-stone-600 dark:text-stone-400">
            <span className="text-[10px] font-mono uppercase font-bold text-stone-500 dark:text-stone-400">
              Cycle Round:
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((roundNum) => {
                const isPassed = roundNum < cycleRound;
                const isCurrent = roundNum === cycleRound;
                return (
                  <div
                    key={roundNum}
                    title={`Session ${roundNum} of 4`}
                    className={`w-3 h-3 rounded-full border transition-all ${
                      isPassed
                        ? 'bg-[#1C1917] border-amber-800'
                        : isCurrent
                        ? 'bg-[#D4AF37] border-amber-900 ring-2 ring-amber-500/40'
                        : 'bg-white dark:bg-[#24201B] border-stone-300 dark:border-stone-700'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="flex items-center gap-2.5 mt-5">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-serif font-bold uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-95 ${
                isRunning
                  ? 'bg-stone-800 hover:bg-stone-900 text-stone-100 border border-stone-700'
                  : 'bg-[#1C1917] hover:bg-stone-900 text-[#D4AF37] border border-amber-900/40'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 text-amber-400" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{timeLeft === durationMinutes * 60 ? 'Start Focus' : 'Resume'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetTimer}
              title="Reset Timer"
              className="p-2.5 rounded-lg border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#24201B] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-[#2C2620] cursor-pointer shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {mode === 'focus' && (
              <button
                type="button"
                onClick={handleFinishEarlyAndLog}
                title="Finish now and log elapsed study time"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#24201B] hover:bg-amber-50 dark:hover:bg-amber-950/30 text-stone-800 dark:text-stone-200 text-xs font-serif font-bold uppercase cursor-pointer shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Log & Finish</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Configuration & Subject Assignment */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Subject Selection Box */}
          <div className="p-4 bg-white dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg shadow-xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#B88939] dark:text-[#E2BE7A]" />
                <span>Target Subject for this Session</span>
              </label>
              {currentSubject && (
                <span className="text-[11px] font-mono text-stone-600 dark:text-stone-400">
                  Today logged:{' '}
                  <strong className="text-stone-900 dark:text-stone-100">{todayLoggedForSubject.toFixed(1)}h</strong> /{' '}
                  {currentSubject.weeklyTargetHours}h week
                </span>
              )}
            </div>

            {subjects.length === 0 ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-900 dark:text-amber-300">
                No subjects registered yet. Add a subject below or study under General focus.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {subjects.map((sub) => {
                  const isSelected = sub.id === activeSubjectId;
                  const todayLogged = Number(sub.dailyHours?.[currentDay]) || 0;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleChooseSubject(sub.id)}
                      className={`p-2.5 rounded-md border text-left flex items-start justify-between gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1C1917] text-stone-100 border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-xs'
                          : 'bg-[#FDFBF7] dark:bg-[#24201B] text-stone-800 dark:text-stone-200 border-[#D8CFBF] dark:border-[#3D352B] hover:bg-[#F2ECE1] dark:hover:bg-[#2C2620]'
                      }`}
                    >
                      <div className="flex items-start gap-2 overflow-hidden">
                        <span
                          className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                          style={{ backgroundColor: sub.color || '#B88939' }}
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-serif font-bold truncate leading-tight">
                            {sub.name}
                          </p>
                          {sub.currentTopic && (
                            <p className="text-[10px] opacity-75 truncate mt-0.5">
                              {sub.currentTopic}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono shrink-0 ${
                          isSelected ? 'text-[#E2BE7A]' : 'text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {todayLogged.toFixed(1)}h
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Intention / Task input */}
          <div className="p-3.5 bg-white dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg shadow-xs flex flex-col gap-1.5">
            <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Session Objective (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Read Chapter 4 & complete problem set 1-8..."
              value={sessionGoal}
              onChange={(e) => setSessionGoal(e.target.value)}
              className="text-xs font-medium px-3 py-2 bg-[#FDFBF7] dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] rounded text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#B88939]"
            />
          </div>

          {/* Interval Presets & Custom Slider */}
          <div className="p-3.5 bg-white dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg shadow-xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Duration Presets
              </span>
              <span className="text-[11px] font-mono font-bold text-[#B88939] dark:text-[#E2BE7A]">
                {durationMinutes} min session (+{(durationMinutes / 60).toFixed(2)}h)
              </span>
            </div>

            {/* Presets buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESETS[mode].map((preset) => {
                const isSelected = !isCustomMode && durationMinutes === preset.minutes;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPreset(preset)}
                    className={`px-3 py-1.5 rounded text-xs font-serif font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/40 shadow-xs'
                        : 'bg-[#FDFBF7] dark:bg-[#24201B] text-stone-700 dark:text-stone-300 border-[#D8CFBF] dark:border-[#3D352B] hover:bg-stone-100 dark:hover:bg-[#2E2822]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setIsCustomMode(true);
                  handleCustomDurationChange(customMinutes);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-serif font-semibold border transition-all cursor-pointer ${
                  isCustomMode
                    ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/40 shadow-xs'
                    : 'bg-[#FDFBF7] dark:bg-[#24201B] text-stone-700 dark:text-stone-300 border-[#D8CFBF] dark:border-[#3D352B] hover:bg-stone-100 dark:hover:bg-[#2E2822]'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Custom</span>
              </button>
            </div>

            {/* Custom Minutes Slider */}
            {isCustomMode && (
              <div className="p-2.5 bg-[#FDFBF7] dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] rounded-md flex items-center gap-3 animate-in fade-in duration-200">
                <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300 w-14">
                  {customMinutes} min
                </span>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={customMinutes}
                  onChange={(e) => handleCustomDurationChange(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#B88939] cursor-pointer"
                />
                <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                  +{(customMinutes / 60).toFixed(2)}h
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
