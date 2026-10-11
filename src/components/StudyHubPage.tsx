import React, { useState, useEffect } from 'react';
import {
  AcademicState,
  DayOfWeek,
  FocusSession,
  TaskItem,
  ThemeConfig,
  UserProfile,
} from '../types';
import {
  Timer,
  GraduationCap,
  Languages,
  BookOpen,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
  ChevronLeft,
  Calendar,
  CheckCircle2,
  TrendingUp,
  History,
} from 'lucide-react';
import { FocusPage } from './FocusPage';
import { AcademicPage } from './AcademicPage';
import { LanguagePracticePage } from './LanguagePracticePage';
import {
  loadFocusSessions,
  getTodayTotalFocusMinutes,
  getTodayFocusSessions,
} from '../utils/focusSessionUtils';

export type StudySection = 'hub' | 'focus' | 'academic' | 'languages' | 'history';

interface StudyHubPageProps {
  initialSection?: StudySection;
  theme: ThemeConfig;
  userProfile: UserProfile;
  academicState: AcademicState;
  tasksByDay: Record<DayOfWeek, TaskItem[]>;
  dayDates: Record<DayOfWeek, { label: string; fullDate: string; isToday: boolean }>;
  onUpdateAcademicState: (state: AcademicState) => void;
  onToggleTask: (day: DayOfWeek, taskId: string) => void;
  onLogStudyHours: (subjectId: string, day: DayOfWeek, hours: number) => void;
  onNavigateToDashboard: () => void;
}

export const StudyHubPage: React.FC<StudyHubPageProps> = ({
  initialSection = 'hub',
  theme,
  userProfile,
  academicState,
  tasksByDay,
  dayDates,
  onUpdateAcademicState,
  onToggleTask,
  onLogStudyHours,
  onNavigateToDashboard,
}) => {
  const [section, setSection] = useState<StudySection>(initialSection);

  // Sync if initialSection prop changes from outside (e.g. navigation link)
  useEffect(() => {
    if (initialSection) {
      setSection(initialSection);
    }
  }, [initialSection]);

  const [sessions, setSessions] = useState<FocusSession[]>(() => loadFocusSessions());

  // Reload sessions when returning to hub or history
  useEffect(() => {
    if (section === 'hub' || section === 'history') {
      setSessions(loadFocusSessions());
    }
  }, [section]);

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

  const todaySessions = getTodayFocusSessions(sessions);
  const todayXP = todaySessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0);

  // If viewing a dedicated sub-tool, render with a top sub-navigation bar
  if (section === 'focus') {
    return (
      <div className="w-full flex flex-col gap-4 animate-fadeIn">
        {/* Hub Return / Sub-Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-2 bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] px-3.5 py-2.5 rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => setSection('hub')}
            className="flex items-center gap-1.5 text-xs font-serif font-bold text-stone-700 dark:text-stone-300 hover:text-[#B88939] dark:hover:text-[#E2BE7A] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#B88939]" />
            <span>Study Hub</span>
          </button>

          {/* Quick Switcher Pills */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#24201B] p-1 rounded-lg border border-[#EAE3D5] dark:border-[#3D352B] overflow-x-auto text-[11px] font-sans">
            <button
              type="button"
              onClick={() => setSection('focus')}
              className="px-2.5 py-1 rounded bg-[#1C1917] dark:bg-[#2E2820] text-[#D4AF37] font-bold shadow-2xs whitespace-nowrap"
            >
              Focus Timer
            </button>
            <button
              type="button"
              onClick={() => setSection('academic')}
              className="px-2.5 py-1 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap transition-colors"
            >
              School
            </button>
            <button
              type="button"
              onClick={() => setSection('languages')}
              className="px-2.5 py-1 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap transition-colors"
            >
              Language
            </button>
            <button
              type="button"
              onClick={() => setSection('history')}
              className="px-2.5 py-1 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap transition-colors"
            >
              History
            </button>
          </div>
        </div>

        <FocusPage
          theme={theme}
          tasksByDay={tasksByDay}
          academicState={academicState}
          onToggleTask={onToggleTask}
          onLogStudyHours={onLogStudyHours}
          onSessionRecorded={(newSession) => {
            setSessions((prev) => [newSession, ...prev]);
          }}
          onNavigateToDashboard={onNavigateToDashboard}
        />
      </div>
    );
  }

  if (section === 'academic') {
    return (
      <div className="w-full flex flex-col gap-4 animate-fadeIn">
        <div className="flex items-center justify-between gap-2 bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] px-3.5 py-2.5 rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => setSection('hub')}
            className="flex items-center gap-1.5 text-xs font-serif font-bold text-stone-700 dark:text-stone-300 hover:text-[#B88939] dark:hover:text-[#E2BE7A] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#B88939]" />
            <span>Study Hub</span>
          </button>

          <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#24201B] p-1 rounded-lg border border-[#EAE3D5] dark:border-[#3D352B] overflow-x-auto text-[11px] font-sans">
            <button
              type="button"
              onClick={() => setSection('focus')}
              className="px-2.5 py-1 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap transition-colors"
            >
              Focus Timer
            </button>
            <button
              type="button"
              onClick={() => setSection('academic')}
              className="px-2.5 py-1 rounded bg-[#1C1917] dark:bg-[#2E2820] text-[#D4AF37] font-bold shadow-2xs whitespace-nowrap"
            >
              School
            </button>
            <button
              type="button"
              onClick={() => setSection('languages')}
              className="px-2.5 py-1 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap transition-colors"
            >
              Language
            </button>
            <button
              type="button"
              onClick={() => setSection('history')}
              className="px-2.5 py-1 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap transition-colors"
            >
              History
            </button>
          </div>
        </div>

        <AcademicPage
          academicState={academicState}
          onUpdateAcademicState={onUpdateAcademicState}
          theme={theme}
          dayDates={dayDates}
          userProfile={userProfile}
        />
      </div>
    );
  }

  if (section === 'languages') {
    return (
      <div className="w-full flex flex-col gap-4 animate-fadeIn">
        <div className="flex items-center justify-between gap-2 bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] px-3.5 py-2.5 rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => setSection('hub')}
            className="flex items-center gap-1.5 text-xs font-serif font-bold text-stone-700 dark:text-stone-300 hover:text-[#B88939] dark:hover:text-[#E2BE7A] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#B88939]" />
            <span>Study Hub</span>
          </button>

          <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#24201B] p-1 rounded-lg border border-[#EAE3D5] dark:border-[#3D352B] overflow-x-auto text-[11px] font-sans">
            <button
              type="button"
              onClick={() => setSection('focus')}
              className="px-2.5 py-1 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap transition-colors"
            >
              Focus Timer
            </button>
            <button
              type="button"
              onClick={() => setSection('academic')}
              className="px-2.5 py-1 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap transition-colors"
            >
              School
            </button>
            <button
              type="button"
              onClick={() => setSection('languages')}
              className="px-2.5 py-1 rounded bg-[#1C1917] dark:bg-[#2E2820] text-[#D4AF37] font-bold shadow-2xs whitespace-nowrap"
            >
              Language
            </button>
            <button
              type="button"
              onClick={() => setSection('history')}
              className="px-2.5 py-1 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap transition-colors"
            >
              History
            </button>
          </div>
        </div>

        <LanguagePracticePage
          theme={theme}
          userName={userProfile.name}
          userAvatar={userProfile.avatar}
        />
      </div>
    );
  }

  // Study History View
  if (section === 'history') {
    return (
      <div className="w-full flex flex-col gap-5 animate-fadeIn max-w-4xl mx-auto pb-12">
        <div className="flex items-center justify-between gap-2 bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] px-3.5 py-2.5 rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => setSection('hub')}
            className="flex items-center gap-1.5 text-xs font-serif font-bold text-stone-700 dark:text-stone-300 hover:text-[#B88939] dark:hover:text-[#E2BE7A] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#B88939]" />
            <span>Study Hub</span>
          </button>

          <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#24201B] p-1 rounded-lg border border-[#EAE3D5] dark:border-[#3D352B] overflow-x-auto text-[11px] font-sans">
            <button
              type="button"
              onClick={() => setSection('focus')}
              className="px-2.5 py-1 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap transition-colors"
            >
              Focus Timer
            </button>
            <button
              type="button"
              onClick={() => setSection('academic')}
              className="px-2.5 py-1 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap transition-colors"
            >
              School
            </button>
            <button
              type="button"
              onClick={() => setSection('languages')}
              className="px-2.5 py-1 rounded text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap transition-colors"
            >
              Language
            </button>
            <button
              type="button"
              onClick={() => setSection('history')}
              className="px-2.5 py-1 rounded bg-[#1C1917] dark:bg-[#2E2820] text-[#D4AF37] font-bold shadow-2xs whitespace-nowrap"
            >
              History
            </button>
          </div>
        </div>

        {/* Header Banner */}
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-sans font-bold uppercase tracking-wider text-[#B88939] dark:text-[#E2BE7A] mb-1">
                <History className="w-3.5 h-3.5" />
                <span>Session Archive</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
                Study & Focus History
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-[#FAF7F0] dark:bg-[#24201B] border border-[#EAE3D5] dark:border-[#3D352B]">
                <span className="text-[9px] font-sans font-bold text-stone-500 uppercase block">
                  Total Sessions
                </span>
                <span className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100">
                  {sessions.length}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#FAF7F0] dark:bg-[#24201B] border border-[#EAE3D5] dark:border-[#3D352B]">
                <span className="text-[9px] font-sans font-bold text-stone-500 uppercase block">
                  Total Focus
                </span>
                <span className="text-sm font-serif font-bold text-[#B88939] dark:text-[#E2BE7A]">
                  {Math.round(sessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60)}h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-2xl p-5 shadow-sm">
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <BookOpen className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-serif font-medium">No recorded focus sessions yet.</p>
              <p className="text-xs text-stone-400 mt-1">Start a focus session to log your study time.</p>
              <button
                type="button"
                onClick={() => setSection('focus')}
                className="mt-4 px-4 py-2 rounded-lg bg-[#1C1917] dark:bg-[#2A241E] text-[#D4AF37] border border-[#B88939]/40 text-xs font-serif font-bold uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-xs"
              >
                Start Focus Timer
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#EAE3D5] dark:divide-[#2E2820]">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        sess.completed
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {sess.completed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <span>{sess.subjectOrTask}</span>
                        {sess.completed ? (
                          <span className="text-[9px] font-sans font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            Completed
                          </span>
                        ) : (
                          <span className="text-[9px] font-sans font-bold uppercase px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">
                            Stopped early
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-500 font-sans mt-0.5">
                        {sess.date} • {sess.startTime} - {sess.endTime}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-stone-900 dark:text-stone-100">
                      {sess.durationMinutes} min
                    </div>
                    <div className="text-[10px] font-serif font-bold text-[#B88939] dark:text-[#E2BE7A]">
                      +{sess.xpEarned} XP
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: Main Study Hub Overview Page
  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn max-w-5xl mx-auto pb-12">
      {/* 1. Study Hub Hero Sanctuary */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-2xl p-5 sm:p-7 shadow-[0_8px_30px_rgba(20,18,15,0.06)] relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#B88939]/10 via-[#D4AF37]/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B88939] dark:text-[#E2BE7A] px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                Academic & Focus Sanctuary
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Study Hub
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-xl font-sans leading-relaxed">
              Your unified workstation for focused deep work, academic course mastery, language practice, and study metrics.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Today's Focus */}
            <div className="bg-[#FAF7F0] dark:bg-[#24201B] border border-[#EAE3D5] dark:border-[#3D352B] rounded-xl px-3.5 py-2.5 shadow-2xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#B88939] dark:text-[#E2BE7A]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-sans font-bold text-stone-500 uppercase tracking-wider block">
                  Today's Study
                </span>
                <span className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100">
                  {todayFormatted}
                </span>
              </div>
            </div>

            {/* Focus XP */}
            <div className="bg-[#FAF7F0] dark:bg-[#24201B] border border-[#EAE3D5] dark:border-[#3D352B] rounded-xl px-3.5 py-2.5 shadow-2xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#D4AF37]">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-sans font-bold text-stone-500 uppercase tracking-wider block">
                  Focus XP
                </span>
                <span className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100">
                  +{todayXP} XP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Destination Grid (Focus, School, Language, History) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Focus */}
        <div
          onClick={() => setSection('focus')}
          className="group bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] hover:border-[#B88939]/70 dark:hover:border-[#D4AF37]/60 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-[0_8px_24px_rgba(184,137,57,0.12)] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#26201B] to-[#171412] text-[#D4AF37] border border-[#B88939]/40 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Timer className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-[#B88939] dark:text-[#E2BE7A] border border-amber-500/20">
                Pomodoro & Flow
              </span>
            </div>
            <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#B88939] dark:group-hover:text-[#E2BE7A] transition-colors flex items-center gap-1.5">
              <span>Focus Mode</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-sans mt-1.5 leading-relaxed">
              Focus sessions and study timer with custom intervals (25/5, 50/10, 90/15), task linking, break reminders, and XP rewards.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[#EAE3D5] dark:border-[#2E2820] flex items-center justify-between text-xs">
            <span className="text-stone-500 dark:text-stone-400 font-sans">
              {todayMinutes > 0 ? `${todayFormatted} logged today` : 'Ready to start'}
            </span>
            <span className="font-serif font-bold text-[#B88939] dark:text-[#E2BE7A] flex items-center gap-1">
              <span>Start Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* 2. School */}
        <div
          onClick={() => setSection('academic')}
          className="group bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] hover:border-[#B88939]/70 dark:hover:border-[#D4AF37]/60 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-[0_8px_24px_rgba(184,137,57,0.12)] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#26201B] to-[#171412] text-[#D4AF37] border border-[#B88939]/40 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Academic & Goals
              </span>
            </div>
            <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#B88939] dark:group-hover:text-[#E2BE7A] transition-colors flex items-center gap-1.5">
              <span>School</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-sans mt-1.5 leading-relaxed">
              Academic schedule, study tools, course tracking, GPA milestones, and long-term subject mastery.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[#EAE3D5] dark:border-[#2E2820] flex items-center justify-between text-xs">
            <span className="text-stone-500 dark:text-stone-400 font-sans">
              {academicState.subjects.length} active subject{academicState.subjects.length !== 1 ? 's' : ''}
            </span>
            <span className="font-serif font-bold text-[#B88939] dark:text-[#E2BE7A] flex items-center gap-1">
              <span>Open Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* 3. Language */}
        <div
          onClick={() => setSection('languages')}
          className="group bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] hover:border-[#B88939]/70 dark:hover:border-[#D4AF37]/60 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-[0_8px_24px_rgba(184,137,57,0.12)] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#26201B] to-[#171412] text-[#D4AF37] border border-[#B88939]/40 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Languages className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Spaced Repetition
              </span>
            </div>
            <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#B88939] dark:group-hover:text-[#E2BE7A] transition-colors flex items-center gap-1.5">
              <span>Language</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-sans mt-1.5 leading-relaxed">
              Vocabulary flashcards, pronunciation tools, daily exercises, and multilingual mastery.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[#EAE3D5] dark:border-[#2E2820] flex items-center justify-between text-xs">
            <span className="text-stone-500 dark:text-stone-400 font-sans">
              Spanish, French, German & more
            </span>
            <span className="font-serif font-bold text-[#B88939] dark:text-[#E2BE7A] flex items-center gap-1">
              <span>Practice Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* 4. Study History */}
        <div
          onClick={() => setSection('history')}
          className="group bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] hover:border-[#B88939]/70 dark:hover:border-[#D4AF37]/60 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-[0_8px_24px_rgba(184,137,57,0.12)] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#26201B] to-[#171412] text-[#D4AF37] border border-[#B88939]/40 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Session Logs
              </span>
            </div>
            <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#B88939] dark:group-hover:text-[#E2BE7A] transition-colors flex items-center gap-1.5">
              <span>Study History</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-sans mt-1.5 leading-relaxed">
              Previous study sessions, focus completion rates, XP history, and subject breakdown statistics.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[#EAE3D5] dark:border-[#2E2820] flex items-center justify-between text-xs">
            <span className="text-stone-500 dark:text-stone-400 font-sans">
              {sessions.length} recorded session{sessions.length !== 1 ? 's' : ''}
            </span>
            <span className="font-serif font-bold text-[#B88939] dark:text-[#E2BE7A] flex items-center gap-1">
              <span>View Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Recent Sessions Quick Preview */}
      {sessions.length > 0 && (
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#EAE3D5] dark:border-[#2E2820]">
            <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#B88939]" />
              <span>Recent Focus Sessions</span>
            </h3>
            <button
              type="button"
              onClick={() => setSection('history')}
              className="text-[11px] font-sans font-semibold text-[#B88939] dark:text-[#E2BE7A] hover:underline"
            >
              View all ({sessions.length}) →
            </button>
          </div>

          <div className="divide-y divide-[#EAE3D5] dark:divide-[#2E2820]">
            {sessions.slice(0, 3).map((s) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      s.completed
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-stone-500/10 text-stone-500'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
                      {s.subjectOrTask}
                    </span>
                    <span className="text-[10px] text-stone-500 block">
                      {s.date} • {s.startTime}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                    {s.durationMinutes}m
                  </span>
                  <span className="text-[10px] text-[#B88939] dark:text-[#E2BE7A] block font-semibold">
                    +{s.xpEarned} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
