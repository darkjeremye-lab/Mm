import React from 'react';
import {
  AppearanceMode,
  NavigationTab,
  ResolvedAppearance,
  ThemeConfig,
  UserProfile,
} from '../types';
import {
  CalendarDays,
  BarChart3,
  Compass,
  Settings,
  Bell,
  User,
  Smartphone,
  Sun,
  Moon,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Flame,
  Award,
  Layers,
  ChevronRight,
  Volume2,
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface MoreHubPageProps {
  theme: ThemeConfig;
  userProfile: UserProfile;
  activeRemindersCount: number;
  totalTasks: number;
  tasksCompleted: number;
  habitsCount: number;
  streakCount?: number;
  currentXP?: number;
  currentLevel?: number;
  appearance?: AppearanceMode;
  resolvedAppearance?: ResolvedAppearance;
  canInstall?: boolean;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenSettings: () => void;
  onOpenReminders: () => void;
  onOpenProfile: () => void;
  onOpenInstallModal: () => void;
  onSelectAppearance?: (mode: AppearanceMode) => void;
}

export const MoreHubPage: React.FC<MoreHubPageProps> = ({
  theme,
  userProfile,
  activeRemindersCount,
  totalTasks,
  tasksCompleted,
  habitsCount,
  streakCount = 0,
  currentXP = 0,
  currentLevel = 1,
  appearance = 'system',
  resolvedAppearance = 'dark',
  canInstall = false,
  onSelectTab,
  onOpenSettings,
  onOpenReminders,
  onOpenProfile,
  onOpenInstallModal,
  onSelectAppearance,
}) => {
  const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn max-w-4xl mx-auto pb-12">
      {/* 1. Header Profile & Status Card */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(20,18,15,0.06)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#B88939]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            onClick={onOpenProfile}
            className="flex items-center gap-3.5 cursor-pointer group"
            title="Edit Profile"
          >
            <div className="relative">
              <UserAvatar
                avatar={userProfile.avatar}
                name={userProfile.name}
                size="md"
                shape="circle"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1C1917]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#B88939] dark:group-hover:text-[#E2BE7A] transition-colors">
                  {userProfile.name || 'Visionary Planner'}
                </h1>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-[#B88939] dark:text-[#E2BE7A] border border-amber-500/20">
                  Lvl {currentLevel}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5 max-w-sm truncate">
                {userProfile.bio || userProfile.goals[0] || 'Precision Planning & Habit Execution'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F0] dark:bg-[#24201B] border border-[#EAE3D5] dark:border-[#3D352B]">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100">
                {streakCount}d Streak
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F0] dark:bg-[#24201B] border border-[#EAE3D5] dark:border-[#3D352B]">
              <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100">
                {currentXP} XP
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenProfile}
              className="text-xs font-serif font-bold text-[#B88939] dark:text-[#E2BE7A] hover:underline px-2 py-1"
            >
              Profile →
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary Secondary Destinations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Destination: Monthly Overview */}
        <div
          onClick={() => onSelectTab('monthly')}
          className="group bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] hover:border-[#B88939]/70 dark:hover:border-[#D4AF37]/60 rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-[#B88939] dark:text-[#E2BE7A] group-hover:scale-105 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#B88939] dark:group-hover:text-[#E2BE7A] transition-colors">
                Monthly View
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
                Strategic 30-day macro calendar & weekly horizons
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#B88939] dark:group-hover:text-[#E2BE7A] group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Destination: Reminders & Alarm Center */}
        <div
          onClick={onOpenReminders}
          className="group bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] hover:border-[#B88939]/70 dark:hover:border-[#D4AF37]/60 rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform relative">
              <Bell className="w-5 h-5" />
              {activeRemindersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-stone-900 rounded-full text-[9px] font-bold flex items-center justify-center">
                  {activeRemindersCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#B88939] dark:group-hover:text-[#E2BE7A] transition-colors">
                Reminders & Wake Alarms
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
                Wake challenges, motivation & scheduled chimes
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#B88939] dark:group-hover:text-[#E2BE7A] group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Destination: Settings & Themes */}
        <div
          onClick={onOpenSettings}
          className="group bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] hover:border-[#B88939]/70 dark:hover:border-[#D4AF37]/60 rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stone-500/10 border border-stone-500/25 flex items-center justify-center text-stone-700 dark:text-stone-300 group-hover:scale-105 transition-transform">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#B88939] dark:group-hover:text-[#E2BE7A] transition-colors">
                Settings & Themes
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
                Luxury palettes (Gold/Green/Pink), backup & sound
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#B88939] dark:group-hover:text-[#E2BE7A] group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Destination: Install App (PWA) */}
        {canInstall && (
          <div
            onClick={onOpenInstallModal}
            className="group bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] hover:border-[#B88939]/70 dark:hover:border-[#D4AF37]/60 rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#B88939] dark:group-hover:text-[#E2BE7A] transition-colors">
                  Install Application
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
                  Offline-ready progressive web app for phone home screen
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#B88939] dark:group-hover:text-[#E2BE7A] group-hover:translate-x-0.5 transition-all" />
          </div>
        )}
      </div>

      {/* 3. Appearance Quick Mode Card */}
      {onSelectAppearance && (
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-2xs">
          <div>
            <h3 className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
              Display Appearance
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans mt-0.5">
              Current mode: <span className="font-semibold capitalize">{appearance}</span> ({resolvedAppearance})
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#FAF7F0] dark:bg-[#24201B] p-1 rounded-lg border border-[#EAE3D5] dark:border-[#3D352B]">
            <button
              type="button"
              onClick={() => onSelectAppearance('light')}
              className={`px-3 py-1.5 rounded-md text-xs font-serif font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                appearance === 'light'
                  ? 'bg-white dark:bg-[#1C1917] text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-[#B88939]" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectAppearance('dark')}
              className={`px-3 py-1.5 rounded-md text-xs font-serif font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                appearance === 'dark'
                  ? 'bg-white dark:bg-[#1C1917] text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectAppearance('system')}
              className={`px-3 py-1.5 rounded-md text-xs font-serif font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                appearance === 'system'
                  ? 'bg-white dark:bg-[#1C1917] text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>System</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Strategic Life Goals & Aspirations */}
      {userProfile.goals && userProfile.goals.length > 0 && (
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B88939] dark:text-[#E2BE7A]">
              Life Goals & Roadmap Targets
            </span>
            <button
              type="button"
              onClick={onOpenProfile}
              className="text-[11px] font-sans font-semibold text-[#B88939] hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="space-y-1.5">
            {userProfile.goals.map((g, idx) => (
              <div
                key={idx}
                className="text-xs text-stone-800 dark:text-stone-200 font-sans flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>{g}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
