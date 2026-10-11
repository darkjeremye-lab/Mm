import React from 'react';
import { AppearanceMode, NavigationTab, ResolvedAppearance, ThemeConfig, UserProfile } from '../types';
import { UserAvatar } from './UserAvatar';
import {
  Calendar,
  CalendarDays,
  CheckSquare,
  Bot,
  Settings,
  Bell,
  Sparkles,
  Undo2,
  Redo2,
  GraduationCap,
  Zap,
  Smartphone,
  Download,
  Wifi,
  WifiOff,
  Languages,
  User,
  Sun,
  Moon,
  Timer,
  Menu,
  BookOpen,
} from 'lucide-react';
import { isRunningStandalone } from '../utils/pwaService';

interface SidebarNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  userProfile: UserProfile;
  theme: ThemeConfig;
  appearance?: AppearanceMode;
  resolvedAppearance?: ResolvedAppearance;
  onSelectAppearance?: (appearance: AppearanceMode) => void;
  onOpenSettings: () => void;
  onOpenReminders: () => void;
  onOpenProfile?: () => void;
  onOpenQuickCapture?: () => void;
  onOpenInstallModal?: () => void;
  isOnline?: boolean;
  canInstall?: boolean;
  activeRemindersCount: number;
  tasksCompleted: number;
  totalTasks: number;
  habitsCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onSelectTab,
  userProfile,
  theme,
  appearance,
  resolvedAppearance,
  onSelectAppearance,
  onOpenSettings,
  onOpenReminders,
  onOpenProfile,
  onOpenQuickCapture,
  onOpenInstallModal,
  isOnline = true,
  canInstall = false,
  activeRemindersCount,
  tasksCompleted,
  totalTasks,
  habitsCount,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
  const isStandalone = isRunningStandalone();

  const isStudyActive =
    activeTab === 'study' ||
    activeTab === 'focus' ||
    activeTab === 'academic' ||
    activeTab === 'languages';
  const isMoreActive = activeTab === 'more' || activeTab === 'monthly';
  const isCoachActive = activeTab === 'coach';

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible lg+) */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-[#1C1917] border-r border-[#2A241E] p-5 shadow-[4px_0_24px_rgba(0,0,0,0.25)] sticky top-0 h-screen overflow-y-auto no-print justify-between text-stone-100">
        <div className="flex flex-col gap-5">
          {/* Brand Header */}
          <div className="flex items-center gap-3 border-b border-[#2E2822] pb-4">
            <div className="px-3 py-1.5 rounded bg-gradient-to-br from-[#B88939] via-[#D4AF37] to-[#8C6826] text-[#1C1917] font-serif font-black text-lg tracking-tight shadow-md border border-[#F5E6BE]/40">
              MW
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold tracking-wide text-[#FDFBF7] flex items-center gap-1.5">
                <span>My Week</span>
              </h1>
              <p className="text-[10px] font-sans font-semibold text-[#D4AF37] uppercase tracking-wider">
                Excellence & Planner
              </p>
            </div>
          </div>

          {/* User Profile Mini Card */}
          <div className="bg-[#24201B] border border-[#3D352B] rounded-lg p-3.5 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-[#B88939]">
                User Focus
              </span>
              <button
                type="button"
                onClick={onOpenProfile || onOpenSettings}
                className="text-[10px] font-sans text-stone-400 hover:text-[#D4AF37] cursor-pointer flex items-center gap-1 transition-colors"
                title="Edit profile & photo"
              >
                <User className="w-3 h-3" />
                <span>Profile</span>
              </button>
            </div>
            <div
              onClick={onOpenProfile || onOpenSettings}
              className={`flex items-center gap-2.5 ${(onOpenProfile || onOpenSettings) ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
              title="Click to view and edit profile"
            >
              <UserAvatar
                avatar={userProfile.avatar}
                name={userProfile.name}
                size="sm"
                shape="circle"
              />
              <div className="overflow-hidden flex-1">
                <div className="text-xs font-serif font-bold text-[#FDFBF7] truncate">
                  {userProfile.name || 'Visionary Planner'}
                </div>
                <div className="text-[10px] font-sans text-stone-400 truncate">
                  {userProfile.bio || userProfile.goals[0] || 'High-performance goals'}
                </div>
              </div>
            </div>

            {/* Core feeling tags */}
            {userProfile.desiredFeelings && userProfile.desiredFeelings.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 pt-1.5 border-t border-[#352D24]">
                {userProfile.desiredFeelings.slice(0, 3).map((f) => (
                  <span
                    key={f}
                    className="text-[9px] font-medium uppercase px-2 py-0.5 rounded bg-[#1C1917] border border-[#453A2D] text-[#E2BE7A]"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Capture Action Button */}
          {onOpenQuickCapture && (
            <button
              type="button"
              onClick={onOpenQuickCapture}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-[#24201B] to-[#1C1917] hover:from-[#2E2822] hover:to-[#24201B] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-serif font-bold tracking-wider uppercase transition-all shadow-sm hover:shadow-[0_4px_16px_rgba(212,175,55,0.15)] group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-[#D4AF37]/20 text-[#D4AF37] group-hover:scale-110 transition-transform">
                  <Zap className="w-3.5 h-3.5 fill-[#D4AF37]/40" />
                </div>
                <span className="text-[#F5F2EB]">Quick Capture</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-black/40 text-[#D4AF37] border border-[#D4AF37]/30">
                Q
              </kbd>
            </button>
          )}

          {/* Main Navigation Tabs */}
          <nav className="flex flex-col gap-1.5">
            <div className="text-[10px] font-serif font-bold uppercase tracking-wider text-stone-400 px-1 mb-1">
              Modules
            </div>

            {/* 1. Dashboard / This Week */}
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md font-sans text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-[#B88939] to-[#D4AF37] text-[#1C1917] font-bold shadow-md'
                  : 'text-stone-300 hover:bg-[#2A241E] hover:text-[#FDFBF7]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4" />
                <span>This Week</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  activeTab === 'dashboard'
                    ? 'bg-[#1C1917] text-[#D4AF37]'
                    : 'bg-[#2A241E] text-stone-400'
                }`}
              >
                {completionRate}%
              </span>
            </button>

            {/* 2. Study Hub */}
            <button
              type="button"
              onClick={() => onSelectTab('study')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md font-sans text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'study' || activeTab === 'focus' || activeTab === 'academic' || activeTab === 'languages'
                  ? 'bg-gradient-to-r from-[#B88939] to-[#D4AF37] text-[#1C1917] font-bold shadow-md'
                  : 'text-stone-300 hover:bg-[#2A241E] hover:text-[#FDFBF7]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4" />
                <span>Study Hub</span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  isStudyActive
                    ? 'bg-[#1C1917] text-[#D4AF37]'
                    : 'bg-[#2A241E] text-[#B88939]'
                }`}
              >
                STUDY
              </span>
            </button>

            {/* Study Sub-Navigation Links */}
            <div className="pl-5 flex flex-col gap-0.5 border-l border-[#352D24] ml-4 my-0.5">
              <button
                type="button"
                onClick={() => onSelectTab('focus')}
                className={`text-[11px] font-sans text-left py-1 px-2 rounded transition-colors cursor-pointer ${
                  activeTab === 'focus' ? 'text-[#D4AF37] font-bold bg-[#2A241E]' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                • Focus Timer
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('academic')}
                className={`text-[11px] font-sans text-left py-1 px-2 rounded transition-colors cursor-pointer ${
                  activeTab === 'academic' ? 'text-[#D4AF37] font-bold bg-[#2A241E]' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                • School & Schedule
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('languages')}
                className={`text-[11px] font-sans text-left py-1 px-2 rounded transition-colors cursor-pointer ${
                  activeTab === 'languages' ? 'text-[#D4AF37] font-bold bg-[#2A241E]' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                • Language Practice
              </button>
            </div>

            {/* 3. AI Coach */}
            <button
              type="button"
              onClick={() => onSelectTab('coach')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md font-sans text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'coach'
                  ? 'bg-gradient-to-r from-[#B88939] to-[#D4AF37] text-[#1C1917] font-bold shadow-md'
                  : 'text-stone-300 hover:bg-[#2A241E] hover:text-[#FDFBF7]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4" />
                <span>AI Coach</span>
              </div>
              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-[#D4AF37] text-[#1C1917] font-bold rounded shadow-xs">
                <Sparkles className="w-2.5 h-2.5 fill-current" />
                VOICE
              </span>
            </button>

            {/* 4. Habits */}
            <button
              type="button"
              onClick={() => onSelectTab('habits')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md font-sans text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'habits'
                  ? 'bg-gradient-to-r from-[#B88939] to-[#D4AF37] text-[#1C1917] font-bold shadow-md'
                  : 'text-stone-300 hover:bg-[#2A241E] hover:text-[#FDFBF7]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4" />
                <span>Habits</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  activeTab === 'habits'
                    ? 'bg-[#1C1917] text-[#D4AF37]'
                    : 'bg-[#2A241E] text-stone-400'
                }`}
              >
                {habitsCount} active
              </span>
            </button>

            {/* 5. More & Macro */}
            <button
              type="button"
              onClick={() => onSelectTab('more')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md font-sans text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                isMoreActive
                  ? 'bg-gradient-to-r from-[#B88939] to-[#D4AF37] text-[#1C1917] font-bold shadow-md'
                  : 'text-stone-300 hover:bg-[#2A241E] hover:text-[#FDFBF7]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Menu className="w-4 h-4" />
                <span>More & Macro</span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  isMoreActive
                    ? 'bg-[#1C1917] text-[#D4AF37]'
                    : 'bg-[#2A241E] text-[#B88939]'
                }`}
              >
                MORE
              </span>
            </button>
          </nav>

          {/* Undo / Redo Row */}
          <div className="flex items-center gap-2 pt-3 border-t border-[#2E2822]">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo last action [Ctrl+Z]"
              className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-serif font-bold uppercase py-2 px-2 rounded transition-all ${
                canUndo
                  ? 'bg-[#2A241E] text-stone-200 hover:bg-[#3D352B] hover:text-white border border-[#4A3F33] cursor-pointer'
                  : 'bg-[#1F1B17] text-stone-600 border border-[#2A241E] opacity-50 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-3 h-3" />
              <span>Undo</span>
            </button>

            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo action [Ctrl+Y]"
              className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-serif font-bold uppercase py-2 px-2 rounded transition-all ${
                canRedo
                  ? 'bg-[#2A241E] text-stone-200 hover:bg-[#3D352B] hover:text-white border border-[#4A3F33] cursor-pointer'
                  : 'bg-[#1F1B17] text-stone-600 border border-[#2A241E] opacity-50 cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-3 h-3" />
              <span>Redo</span>
            </button>
          </div>
        </div>

        {/* Bottom Utility Controls */}
        <div className="flex flex-col gap-2 pt-4 border-t border-[#2E2822]">
          {/* Offline/Online Status Pill */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded bg-[#161412] border border-[#2A241E] text-[11px] font-sans">
            <span className="flex items-center gap-1.5 text-stone-400">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  <span className="text-emerald-400 font-medium">Online Sync</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                  <span className="text-amber-400 font-medium">Offline Mode</span>
                </>
              )}
            </span>
            <span className="text-[10px] text-stone-500 font-mono">
              {isStandalone ? 'App' : 'PWA Ready'}
            </span>
          </div>

          {/* Install App Button if not standalone or if installable */}
          {onOpenInstallModal && !isStandalone && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#2A241E] to-[#1C1917] hover:from-[#352D24] hover:to-[#24201B] text-[#D4AF37] border border-[#D4AF37]/40 rounded-md font-serif text-xs font-bold tracking-wide cursor-pointer transition-all shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Install App</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 uppercase font-mono font-bold">
                Home
              </span>
            </button>
          )}

          {/* Reminders center trigger */}
          <button
            type="button"
            onClick={onOpenReminders}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#24201B] hover:bg-[#322B22] text-stone-200 border border-[#3D352B] rounded-md font-sans text-xs font-semibold cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Alarms & Reminders</span>
            </div>
            {activeRemindersCount > 0 && (
              <span className="text-[10px] bg-[#B88939] text-[#1C1917] px-1.5 py-0.2 rounded-full font-bold">
                {activeRemindersCount}
              </span>
            )}
          </button>

          {/* User Profile trigger */}
          <button
            type="button"
            onClick={onOpenProfile || onOpenSettings}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#24201B] hover:bg-[#322B22] text-stone-200 border border-[#3D352B] rounded-md font-sans text-xs font-semibold cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>User Profile</span>
            </div>
            {userProfile.avatar ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Photo active" />
            ) : null}
          </button>

          {/* Appearance Mode Segmented Quick Switcher */}
          {onSelectAppearance && (
            <div className="w-full flex items-center justify-between p-1 bg-[#151210] border border-[#2E2820] rounded-md text-[11px] font-sans font-semibold">
              <button
                type="button"
                onClick={() => onSelectAppearance('light')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded transition-colors cursor-pointer ${
                  appearance === 'light'
                    ? 'bg-[#2A241E] text-[#D4AF37] font-bold shadow-2xs border border-[#4D4233]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Light Appearance (Ivory Canvas)"
              >
                <Sun className="w-3 h-3" />
                <span className="text-[10px]">Light</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectAppearance('dark')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded transition-colors cursor-pointer ${
                  appearance === 'dark'
                    ? 'bg-[#2A241E] text-[#D4AF37] font-bold shadow-2xs border border-[#4D4233]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Dark Appearance (Obsidian Sanctuary)"
              >
                <Moon className="w-3 h-3" />
                <span className="text-[10px]">Dark</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectAppearance('system')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded transition-colors cursor-pointer ${
                  appearance === 'system'
                    ? 'bg-[#2A241E] text-[#D4AF37] font-bold shadow-2xs border border-[#4D4233]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title={`System Appearance (Matches OS: ${resolvedAppearance === 'dark' ? 'Dark' : 'Light'})`}
              >
                <Smartphone className="w-3 h-3" />
                <span className="text-[10px]">Auto</span>
              </button>
            </div>
          )}

          {/* Settings & Goals trigger */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2 px-3 py-2 bg-[#1C1917] hover:bg-[#2A241E] text-stone-300 border border-[#3D352B] rounded-md font-sans text-xs font-semibold cursor-pointer transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-stone-400" />
            <span>Settings & Themes</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between bg-[#1C1917] border-b border-[#2A241E] px-3.5 py-2.5 sticky top-0 z-30 shadow-md no-print text-stone-100">
        <button
          type="button"
          onClick={onOpenProfile || onOpenSettings}
          className="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-90 transition-opacity"
          title="Open User Profile"
        >
          <UserAvatar
            avatar={userProfile.avatar}
            name={userProfile.name}
            size="sm"
            shape="circle"
          />
          <div className="flex flex-col">
            <span className="text-xs font-serif font-bold text-[#FDFBF7] tracking-wide leading-none">
              {userProfile.name || 'My Week'}
            </span>
            <span className="text-[10px] font-sans text-stone-400 leading-none mt-0.5">
              {userProfile.bio ? userProfile.bio.slice(0, 22) + (userProfile.bio.length > 22 ? '...' : '') : 'Planner & Focus'}
            </span>
          </div>
          {!isOnline && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 uppercase ml-1">
              Offline
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {onSelectAppearance && (
            <button
              type="button"
              onClick={() => {
                const nextMode: AppearanceMode =
                  appearance === 'light' ? 'dark' : appearance === 'dark' ? 'system' : 'light';
                onSelectAppearance(nextMode);
              }}
              title={`Appearance: ${appearance} (tap to cycle: Light → Dark → Auto)`}
              className="p-2 bg-[#2A241E] border border-[#3D352B] rounded text-[#D4AF37] hover:text-white cursor-pointer flex items-center justify-center"
            >
              {appearance === 'light' ? (
                <Sun className="w-4 h-4 text-[#D4AF37]" />
              ) : appearance === 'dark' ? (
                <Moon className="w-4 h-4 text-[#D4AF37]" />
              ) : (
                <Smartphone className="w-4 h-4 text-[#D4AF37]" />
              )}
            </button>
          )}
          {onOpenInstallModal && !isStandalone && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              title="Install App"
              className="px-2 py-1.5 bg-[#2A241E] border border-[#D4AF37]/40 rounded text-[#D4AF37] hover:text-white cursor-pointer flex items-center gap-1 text-xs font-serif font-bold"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xs:inline text-[10px]">Install</span>
            </button>
          )}

          {onOpenQuickCapture && (
            <button
              type="button"
              onClick={onOpenQuickCapture}
              title="Quick Capture"
              className="p-2 bg-[#2A241E] border border-[#D4AF37]/40 rounded text-[#D4AF37] hover:text-white cursor-pointer flex items-center gap-1"
            >
              <Zap className="w-4 h-4 fill-[#D4AF37]/30" />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenReminders}
            title="Reminders"
            className="p-2 bg-[#2A241E] border border-[#3D352B] rounded text-stone-200 hover:text-white cursor-pointer relative"
          >
            <Bell className="w-4 h-4 text-[#D4AF37]" />
            {activeRemindersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-stone-900 rounded-full text-[9px] font-bold flex items-center justify-center">
                {activeRemindersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Settings & Themes"
            className="p-2 bg-[#2A241E] border border-[#3D352B] rounded text-stone-200 hover:text-white cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (5-Destination Clean Luxury System) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1C1917]/95 backdrop-blur-md border-t border-[#2A241E] px-2 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] flex items-center justify-between z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.55)] no-print overflow-visible"
      >
        {/* 1. WEEK */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          aria-label="Week View"
          className="flex-1 py-1 flex flex-col items-center justify-center group cursor-pointer transition-transform active:scale-95 min-w-0"
        >
          <div
            className={`px-3 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
              activeTab === 'dashboard'
                ? 'bg-[#2E2820] text-[#D4AF37] border border-[#B88939]/40 shadow-[0_0_12px_rgba(212,175,55,0.18)]'
                : 'text-stone-400 group-hover:text-stone-200'
            }`}
          >
            <Calendar className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span
            className={`text-[10px] font-sans transition-colors duration-150 mt-0.5 tracking-tight ${
              activeTab === 'dashboard'
                ? 'text-[#D4AF37] font-bold'
                : 'text-stone-400 font-medium'
            }`}
          >
            Week
          </span>
        </button>

        {/* 2. STUDY */}
        <button
          type="button"
          onClick={() => onSelectTab('study')}
          aria-label="Study Hub"
          className="flex-1 py-1 flex flex-col items-center justify-center group cursor-pointer transition-transform active:scale-95 min-w-0"
        >
          <div
            className={`px-3 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
              isStudyActive
                ? 'bg-[#2E2820] text-[#D4AF37] border border-[#B88939]/40 shadow-[0_0_12px_rgba(212,175,55,0.18)]'
                : 'text-stone-400 group-hover:text-stone-200'
            }`}
          >
            <GraduationCap className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span
            className={`text-[10px] font-sans transition-colors duration-150 mt-0.5 tracking-tight ${
              isStudyActive
                ? 'text-[#D4AF37] font-bold'
                : 'text-stone-400 font-medium'
            }`}
          >
            Study
          </span>
        </button>

        {/* 3. AI COACH (Physically Centered & Floating Prominent Action) */}
        <div className="flex-1 flex flex-col items-center justify-center relative min-w-0">
          <button
            type="button"
            onClick={() => onSelectTab('coach')}
            aria-label="AI Coach"
            title="Open AI Coach"
            className={`-mt-5 w-[48px] h-[48px] xs:w-[50px] xs:h-[50px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-[0_6px_20px_rgba(184,137,57,0.35)] active:scale-90 ${
              isCoachActive
                ? 'bg-gradient-to-tr from-[#A67C2E] via-[#F3DE9D] to-[#D4AF37] ring-4 ring-[#D4AF37]/70 ring-offset-2 ring-offset-[#1C1917] shadow-[0_0_24px_rgba(212,175,55,0.65)] scale-105'
                : 'bg-gradient-to-tr from-[#7A591C] via-[#D4AF37] to-[#C99C35] hover:brightness-110 ring-2 ring-[#D4AF37]/50 ring-offset-2 ring-offset-[#1C1917]'
            }`}
          >
            <Sparkles className="w-5 h-5 text-[#1C1917] fill-[#1C1917]/20 stroke-[2.4]" />
          </button>
          <span
            className={`text-[10px] font-sans transition-colors duration-150 mt-0.5 tracking-tight ${
              isCoachActive
                ? 'text-[#D4AF37] font-bold'
                : 'text-stone-300 font-semibold'
            }`}
          >
            AI
          </span>
        </div>

        {/* 4. HABITS */}
        <button
          type="button"
          onClick={() => onSelectTab('habits')}
          aria-label="Habits"
          className="flex-1 py-1 flex flex-col items-center justify-center group cursor-pointer transition-transform active:scale-95 min-w-0"
        >
          <div
            className={`px-3 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
              activeTab === 'habits'
                ? 'bg-[#2E2820] text-[#D4AF37] border border-[#B88939]/40 shadow-[0_0_12px_rgba(212,175,55,0.18)]'
                : 'text-stone-400 group-hover:text-stone-200'
            }`}
          >
            <CheckSquare className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span
            className={`text-[10px] font-sans transition-colors duration-150 mt-0.5 tracking-tight ${
              activeTab === 'habits'
                ? 'text-[#D4AF37] font-bold'
                : 'text-stone-400 font-medium'
            }`}
          >
            Habits
          </span>
        </button>

        {/* 5. MORE */}
        <button
          type="button"
          onClick={() => onSelectTab('more')}
          aria-label="More"
          className="flex-1 py-1 flex flex-col items-center justify-center group cursor-pointer transition-transform active:scale-95 min-w-0"
        >
          <div
            className={`px-3 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
              isMoreActive
                ? 'bg-[#2E2820] text-[#D4AF37] border border-[#B88939]/40 shadow-[0_0_12px_rgba(212,175,55,0.18)]'
                : 'text-stone-400 group-hover:text-stone-200'
            }`}
          >
            <Menu className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span
            className={`text-[10px] font-sans transition-colors duration-150 mt-0.5 tracking-tight ${
              isMoreActive
                ? 'text-[#D4AF37] font-bold'
                : 'text-stone-400 font-medium'
            }`}
          >
            More
          </span>
        </button>
      </nav>
    </>
  );
};
