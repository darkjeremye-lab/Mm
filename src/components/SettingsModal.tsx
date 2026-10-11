import React, { useState } from 'react';
import { AppearanceMode, ResolvedAppearance, ThemeConfig, ThemeType, UserProfile } from '../types';
import { THEMES } from '../theme';
import { UserAvatar } from './UserAvatar';
import {
  X,
  Palette,
  Target,
  Check,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  VolumeX,
  Smartphone,
  Wifi,
  WifiOff,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  PenLine,
  User,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { isRunningStandalone, isIosDevice } from '../utils/pwaService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeType;
  onSelectTheme: (theme: ThemeType) => void;
  appearance: AppearanceMode;
  resolvedAppearance: ResolvedAppearance;
  onSelectAppearance: (appearance: AppearanceMode) => void;
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
  onResetData: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenInstallModal?: () => void;
  onOpenProfile?: () => void;
  canInstall?: boolean;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  appearance,
  resolvedAppearance,
  onSelectAppearance,
  userProfile,
  onUpdateUserProfile,
  onExportData,
  onImportData,
  onResetData,
  soundEnabled,
  onToggleSound,
  onOpenInstallModal,
  onOpenProfile,
  canInstall,
  focusMode = false,
  onToggleFocusMode,
}) => {
  const [name, setName] = useState(userProfile.name);
  const [goals, setGoals] = useState<string[]>(
    userProfile.goals.length > 0 ? userProfile.goals : ['', '', '']
  );
  const [feelings, setFeelings] = useState<string[]>(
    userProfile.desiredFeelings.length > 0 ? userProfile.desiredFeelings : ['Focused', 'Disciplined']
  );
  const [newFeeling, setNewFeeling] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [cacheRefreshed, setCacheRefreshed] = useState(false);

  const isStandalone = isRunningStandalone();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!isOpen) return null;

  const handleGoalChange = (idx: number, val: string) => {
    const updated = [...goals];
    updated[idx] = val;
    setGoals(updated);
  };

  const handleRemoveFeeling = (idx: number) => {
    setFeelings(feelings.filter((_, i) => i !== idx));
  };

  const handleAddFeeling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeeling.trim()) return;
    const trimmed = newFeeling.trim();
    if (!feelings.includes(trimmed)) {
      setFeelings([...feelings, trimmed]);
    }
    setNewFeeling('');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredGoals = goals.map((g) => g.trim()).filter((g) => g.length > 0);
    const updated: UserProfile = {
      ...userProfile,
      name: name.trim() || 'Visionary Planner',
      goals: filteredGoals.length > 0 ? filteredGoals : ['Master core focus'],
      desiredFeelings: feelings.length > 0 ? feelings : ['Focused'],
    };
    onUpdateUserProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        onImportData(content);
      }
    };
    reader.readAsText(file);
  };

  const handleRefreshCache = async () => {
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) await reg.update();
        }
        setCacheRefreshed(true);
        setTimeout(() => setCacheRefreshed(false), 3000);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FDFBF7] dark:bg-[#181513] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] text-stone-900 dark:text-stone-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DFC8] dark:border-[#2E2820] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#1C1917] text-[#D4AF37] shadow-xs border border-amber-900/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                Settings & Aesthetics
              </h2>
              <p className="text-xs font-sans text-stone-500 dark:text-stone-400">
                Light & dark appearance, luxury palettes, PWA, sound, and data portability
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#24201B] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-[#2C261F] cursor-pointer shadow-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {/* 1. Global Appearance Setting (Light / Dark / System) */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#B88939]" />
                <span>Appearance Mode</span>
              </label>
              <span className="text-[11px] font-sans text-stone-500 dark:text-stone-400">
                {appearance === 'system'
                  ? `📱 System (${resolvedAppearance === 'dark' ? 'Dark active' : 'Light active'})`
                  : appearance === 'dark'
                  ? '🌙 Dark mode active'
                  : '☀️ Light mode active'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Light */}
              <button
                type="button"
                onClick={() => onSelectAppearance('light')}
                className={`p-3.5 rounded-lg border text-left flex flex-col gap-2 transition-all cursor-pointer shadow-xs ${
                  appearance === 'light'
                    ? 'bg-[#1C1917] text-stone-100 border-[#D4AF37] ring-1 ring-[#D4AF37]'
                    : 'bg-white dark:bg-[#24201B] text-stone-800 dark:text-stone-200 border-[#D8CFBF] dark:border-[#3D352B] hover:bg-[#F7F3EB] dark:hover:bg-[#2C261F]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className={`w-4 h-4 ${appearance === 'light' ? 'text-[#D4AF37]' : 'text-amber-600'}`} />
                    <span className="text-xs font-serif font-bold tracking-wide">☀️ Light</span>
                  </div>
                  {appearance === 'light' && <Check className="w-4 h-4 text-[#D4AF37]" />}
                </div>
                <span className={`text-[11px] font-sans leading-tight ${appearance === 'light' ? 'text-stone-300' : 'text-stone-500 dark:text-stone-400'}`}>
                  Clean ivory canvas & parchment aesthetic
                </span>
              </button>

              {/* Option 2: Dark */}
              <button
                type="button"
                onClick={() => onSelectAppearance('dark')}
                className={`p-3.5 rounded-lg border text-left flex flex-col gap-2 transition-all cursor-pointer shadow-xs ${
                  appearance === 'dark'
                    ? 'bg-[#1C1917] text-stone-100 border-[#D4AF37] ring-1 ring-[#D4AF37]'
                    : 'bg-white dark:bg-[#24201B] text-stone-800 dark:text-stone-200 border-[#D8CFBF] dark:border-[#3D352B] hover:bg-[#F7F3EB] dark:hover:bg-[#2C261F]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className={`w-4 h-4 ${appearance === 'dark' ? 'text-[#D4AF37]' : 'text-amber-400'}`} />
                    <span className="text-xs font-serif font-bold tracking-wide">🌙 Dark</span>
                  </div>
                  {appearance === 'dark' && <Check className="w-4 h-4 text-[#D4AF37]" />}
                </div>
                <span className={`text-[11px] font-sans leading-tight ${appearance === 'dark' ? 'text-stone-300' : 'text-stone-500 dark:text-stone-400'}`}>
                  Deep velvet obsidian & high-contrast glow
                </span>
              </button>

              {/* Option 3: System */}
              <button
                type="button"
                onClick={() => onSelectAppearance('system')}
                className={`p-3.5 rounded-lg border text-left flex flex-col gap-2 transition-all cursor-pointer shadow-xs ${
                  appearance === 'system'
                    ? 'bg-[#1C1917] text-stone-100 border-[#D4AF37] ring-1 ring-[#D4AF37]'
                    : 'bg-white dark:bg-[#24201B] text-stone-800 dark:text-stone-200 border-[#D8CFBF] dark:border-[#3D352B] hover:bg-[#F7F3EB] dark:hover:bg-[#2C261F]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className={`w-4 h-4 ${appearance === 'system' ? 'text-[#D4AF37]' : 'text-stone-500'}`} />
                    <span className="text-xs font-serif font-bold tracking-wide">📱 System</span>
                  </div>
                  {appearance === 'system' && <Check className="w-4 h-4 text-[#D4AF37]" />}
                </div>
                <span className={`text-[11px] font-sans leading-tight ${appearance === 'system' ? 'text-stone-300' : 'text-stone-500 dark:text-stone-400'}`}>
                  Matches device OS preference automatically
                </span>
              </button>
            </div>
          </div>

          {/* 2. Theme Palette Selector (Obsidian Gold, Emerald Brass, Rose Sand) */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#B88939]" />
              <span>Aesthetic Theme Profile</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(THEMES) as ThemeType[]).map((tKey) => {
                const t = THEMES[tKey];
                const isSelected = currentTheme === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => onSelectTheme(tKey)}
                    className={`p-3.5 rounded-lg border text-left flex flex-col gap-2.5 transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'bg-[#1C1917] text-stone-100 border-[#D4AF37] ring-1 ring-[#D4AF37]'
                        : 'bg-white dark:bg-[#24201B] text-stone-800 dark:text-stone-200 border-[#D8CFBF] dark:border-[#3D352B] hover:bg-[#F7F3EB] dark:hover:bg-[#2C261F]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-serif font-bold tracking-wide">{t.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#D4AF37]" />}
                    </div>

                    {/* Color Swatch Bars */}
                    <div className="flex items-center gap-2 pt-1">
                      <div
                        className="w-5 h-5 rounded-sm border border-stone-400/50 shadow-2xs"
                        style={{ backgroundColor: t.barColorHex }}
                        title="Accent Header"
                      />
                      <div
                        className="w-5 h-5 rounded-sm border border-stone-400/50"
                        style={{ backgroundColor: t.ringTrackHex }}
                        title="Track Ring"
                      />
                      <div
                        className="w-5 h-5 rounded-sm border border-stone-400/50"
                        style={{ backgroundColor: resolvedAppearance === 'dark' ? '#1C1917' : '#FDFBF7' }}
                        title="Card Canvas"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Global Distraction-Free Focus Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 rounded-lg border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#221E1A] shadow-xs">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-lg border shadow-xs transition-colors ${
                  focusMode
                    ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/40'
                    : 'bg-[#FDFBF7] dark:bg-[#1A1714] text-stone-600 dark:text-stone-400 border-[#D8CFBF] dark:border-[#3D352B]'
                }`}
              >
                {focusMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100">
                    Distraction-Free Focus Mode
                  </span>
                  <span
                    className={`text-[9px] font-sans font-bold uppercase px-1.5 py-0.5 rounded border ${
                      focusMode
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {focusMode ? 'Active' : 'Off'}
                  </span>
                </div>
                <span className="text-[11px] text-stone-600 dark:text-stone-400 font-sans mt-0.5">
                  Hides the navigation sidebar and non-essential UI to create a minimalist, serene writing sanctuary for weekly notes.
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-1">
                  Tip: Press <kbd className="px-1 py-0.2 rounded bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300">Esc</kbd> anytime to exit
                </span>
              </div>
            </div>

            {onToggleFocusMode && (
              <button
                type="button"
                onClick={() => {
                  onToggleFocusMode();
                }}
                className={`px-4 py-2 text-xs font-serif font-bold uppercase tracking-wider rounded border transition-all cursor-pointer whitespace-nowrap self-start sm:self-center shadow-xs active:scale-95 ${
                  focusMode
                    ? 'bg-gradient-to-r from-[#B88939] via-[#D4AF37] to-[#8C6826] text-[#1C1917] border-amber-800 font-bold'
                    : 'bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border-amber-900/40'
                }`}
              >
                {focusMode ? 'Exit Focus Mode' : 'Enable Focus Mode'}
              </button>
            )}
          </div>

          {/* 4. Audio Chime Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#221E1A] shadow-xs">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-[#B88939]" />
              ) : (
                <VolumeX className="w-5 h-5 text-stone-400" />
              )}
              <div>
                <span className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 block">
                  Acoustic Reminder Chimes
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
                  Play harmonic chime when alarms trigger
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleSound}
              className={`px-3.5 py-1.5 text-xs font-serif font-bold uppercase rounded border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900/40'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700'
              }`}
            >
              {soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          {/* 5. Life Goals Compass */}
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 p-4 rounded-lg border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#221E1A] shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#B88939]" />
                <span>Life Goals & Coach Context</span>
              </label>
              {savedSuccess && (
                <span className="text-xs font-sans font-bold text-emerald-700 dark:text-emerald-400">
                  ✓ Profile saved!
                </span>
              )}
            </div>

            {/* Quick Profile & Avatar Link */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF6EE] dark:bg-[#1A1714] border border-[#E0D5C1] dark:border-[#383026]">
              <div className="flex items-center gap-3">
                <UserAvatar
                  avatar={userProfile.avatar}
                  name={userProfile.name}
                  size="md"
                  shape="circle"
                />
                <div>
                  <div className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100">
                    {userProfile.name || 'Visionary Planner'}
                  </div>
                  <div className="text-[10px] font-sans text-stone-500 dark:text-stone-400 truncate max-w-[200px] sm:max-w-xs">
                    {userProfile.bio || (userProfile.goals && userProfile.goals[0]) || 'Daily mastery & focus'}
                  </div>
                </div>
              </div>
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfile();
                  }}
                  className="px-3 py-1.5 text-xs font-serif font-bold rounded bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border border-amber-900/40 cursor-pointer shadow-xs transition-all flex items-center gap-1 shrink-0"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Full Profile</span>
                </button>
              )}
            </div>

            <div>
              <span className="text-[11px] font-sans font-semibold text-stone-600 dark:text-stone-400 mb-1 block">Your Name / Title:</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs sm:text-sm font-medium px-3.5 py-2 rounded-md bg-[#FDFBF7] dark:bg-[#181513] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#B88939]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-sans font-semibold text-stone-600 dark:text-stone-400">Top 3 Life Goals:</span>
              {goals.map((g, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-stone-500 w-5">#{idx + 1}</span>
                  <input
                    type="text"
                    value={g}
                    onChange={(e) => handleGoalChange(idx, e.target.value)}
                    placeholder={`Goal #${idx + 1}`}
                    className="flex-1 text-xs font-medium px-3 py-1.5 rounded-md bg-[#FDFBF7] dark:bg-[#181513] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] rounded-md text-xs font-serif font-bold uppercase cursor-pointer transition-colors"
              >
                Save Profile
              </button>
            </div>
          </form>

          {/* 6. PWA & Offline Engine Status Strip */}
          <div className="p-4 rounded-lg border border-[#D8CFBF] dark:border-[#3D352B] bg-[#FAF7F0] dark:bg-[#1F1B17] flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#B88939]" />
                <span>PWA & Offline Architecture</span>
              </span>
              <span
                className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded flex items-center gap-1.5 ${
                  isOnline
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                }`}
              >
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? 'Online (Ready to Sync)' : 'Offline (Local Safe)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans text-stone-700 dark:text-stone-300">
              <div className="p-2.5 rounded bg-white dark:bg-[#24201B] border border-[#E5DCB] dark:border-[#3D352B] flex items-center justify-between">
                <span>App Mode:</span>
                <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
                  {isStandalone ? '📱 Standalone App' : '🌐 Browser Window'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-white dark:bg-[#24201B] border border-[#E5DCB] dark:border-[#3D352B] flex items-center justify-between">
                <span>Offline Storage:</span>
                <span className="font-serif font-bold text-emerald-800 dark:text-emerald-400">
                  ✓ Active (Service Worker v2)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {onOpenInstallModal && (
                <button
                  type="button"
                  onClick={onOpenInstallModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-serif font-bold rounded bg-[#1C1917] text-[#D4AF37] hover:bg-stone-800 cursor-pointer shadow-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isStandalone ? 'View PWA Diagnostics' : 'Install App on Home Screen'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRefreshCache}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-serif font-bold rounded bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#2E2822] cursor-pointer transition-all"
              >
                <Layers className="w-3.5 h-3.5 text-stone-500" />
                <span>{cacheRefreshed ? '✓ Cache Updated' : 'Refresh Offline Cache'}</span>
              </button>
            </div>
          </div>

          {/* 7. Backup & Export */}
          <div className="p-4 rounded-lg border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#221E1A] flex flex-col gap-3 shadow-xs">
            <span className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Data Portability & Backup
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onExportData}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-serif font-bold rounded bg-[#FDFBF7] dark:bg-[#181513] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#2A241E] cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Backup</span>
              </button>

              <label className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-serif font-bold rounded bg-[#FDFBF7] dark:bg-[#181513] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#2A241E] cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset this week with default curated sample data?')) {
                    onResetData();
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-serif font-bold rounded bg-[#FDFBF7] dark:bg-[#181513] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 cursor-pointer transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Load Sample Week</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
