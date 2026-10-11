import React, { useState, useEffect } from 'react';
import { WeeklyNotes, ThemeConfig } from '../types';
import {
  Calendar,
  Target,
  Gift,
  Sparkles,
  Check,
  Trash2,
  Save,
  Minimize2,
  Settings,
  PenLine,
  Compass,
} from 'lucide-react';
import { getMondayOfWeek, parseISODate } from '../utils/dateUtils';

interface FocusWritingViewProps {
  notes: WeeklyNotes;
  onSaveNotes: (updated: WeeklyNotes) => void;
  onClearNotes: () => void;
  theme: ThemeConfig;
  startLabel: string;
  endLabel: string;
  onWeekChange?: (newStartOfWeek: string) => void;
  onExitFocusMode: () => void;
  onOpenSettings?: () => void;
}

export const FocusWritingView: React.FC<FocusWritingViewProps> = ({
  notes,
  onSaveNotes,
  onClearNotes,
  theme,
  startLabel,
  endLabel,
  onWeekChange,
  onExitFocusMode,
  onOpenSettings,
}) => {
  const [formData, setFormData] = useState<WeeklyNotes>(notes);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');

  useEffect(() => {
    setFormData(notes);
  }, [notes]);

  const handleChange = (field: keyof WeeklyNotes, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    // Real-time auto save
    onSaveNotes(updated);
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.value;
    if (picked) {
      const monday = getMondayOfWeek(parseISODate(picked));
      handleChange('startOfWeek', monday);
      if (onWeekChange) {
        onWeekChange(monday);
      }
    }
  };

  const handleManualSave = () => {
    onSaveNotes(formData);
    setSavedFeedback(true);
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleClear = () => {
    if (window.confirm('Clear weekly focus, reward, and affirmation?')) {
      const cleared: WeeklyNotes = {
        startOfWeek: formData.startOfWeek || getMondayOfWeek(),
        focus: '',
        reward: '',
        affirmation: '',
      };
      setFormData(cleared);
      onSaveNotes(cleared);
      onClearNotes();
    }
  };

  // Word count & character statistics
  const totalWords = [formData.focus, formData.reward, formData.affirmation]
    .filter(Boolean)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const totalChars = [formData.focus, formData.reward, formData.affirmation]
    .filter(Boolean)
    .join('').length;

  return (
    <div className="w-full max-w-3xl mx-auto py-4 sm:py-8 flex flex-col gap-6 animate-fadeIn">
      {/* Top Header Bar */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(20,18,15,0.06)] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE3D5] dark:border-[#2E2820] pb-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-lg bg-[#1C1917] text-[#D4AF37] shadow-sm mt-0.5">
              <PenLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Weekly Notes Sanctuary
                </h1>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1C1917] text-[#D4AF37] border border-amber-900/30">
                  Focus Mode
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">
                Distraction-free environment for crystallizing your focus, reward, and guiding affirmation
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-2 text-xs font-serif font-bold rounded bg-white dark:bg-[#24201B] hover:bg-stone-100 dark:hover:bg-[#2C261F] text-stone-700 dark:text-stone-300 border border-[#D8CFBF] dark:border-[#3D352B] cursor-pointer shadow-2xs transition-all flex items-center gap-1.5"
                title="Open Settings"
              >
                <Settings className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExitFocusMode}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-serif font-bold uppercase tracking-wider rounded bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border border-amber-900/40 cursor-pointer shadow-xs active:scale-95 transition-all"
              title="Exit Focus Mode (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Focus Mode</span>
            </button>
          </div>
        </div>

        {/* Date Selector Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Active Cycle:
            </span>
            <div className="flex items-center gap-2 bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] rounded-md px-3 py-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#B88939]" />
              <input
                type="date"
                value={formData.startOfWeek}
                onChange={handleDateChange}
                className="text-xs font-medium text-stone-900 dark:text-stone-100 bg-transparent focus:outline-none cursor-pointer"
              />
              <span className="text-stone-400 dark:text-stone-500 font-mono text-[10px]">
                ({startLabel} — {endLabel})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400 font-sans">
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <Check className="w-3.5 h-3.5" /> Auto-saved {lastSavedTime}
            </span>
            <span>•</span>
            <span className="font-mono">
              {totalWords} {totalWords === 1 ? 'word' : 'words'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Focus Writing Cards */}
      <div className="flex flex-col gap-5">
        {/* Section 1: Weekly Focus */}
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(20,18,15,0.04)] flex flex-col gap-3 transition-all focus-within:border-[#B88939] focus-within:ring-1 focus-within:ring-[#B88939]/40">
          <div className="flex items-center justify-between border-b border-[#EAE3D5] dark:border-[#2E2820] pb-2.5">
            <label className="flex items-center gap-2 text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              <div className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/50 text-[#B88939] dark:text-[#E2BE7A] border border-amber-200 dark:border-amber-800/50">
                <Target className="w-4 h-4" />
              </div>
              <span>Primary Strategic Focus</span>
            </label>
            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              Core Outcome
            </span>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
            What is your single most pivotal goal or commitment this week? Make it clear, decisive, and actionable.
          </p>

          <textarea
            rows={3}
            value={formData.focus}
            onChange={(e) => handleChange('focus', e.target.value)}
            placeholder="e.g. Master Linear Algebra Chapter 4, complete the scholarship essay second revision, and maintain daily deep study blocks..."
            className="w-full text-sm sm:text-base font-serif leading-relaxed px-4 py-3 rounded-lg bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 placeholder:font-sans placeholder:text-xs focus:outline-none focus:border-[#B88939] shadow-inner resize-y min-h-[90px]"
          />
        </div>

        {/* Section 2: Weekly Reward */}
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(20,18,15,0.04)] flex flex-col gap-3 transition-all focus-within:border-[#B88939] focus-within:ring-1 focus-within:ring-[#B88939]/40">
          <div className="flex items-center justify-between border-b border-[#EAE3D5] dark:border-[#2E2820] pb-2.5">
            <label className="flex items-center gap-2 text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              <div className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/50 text-[#B88939] dark:text-[#E2BE7A] border border-amber-200 dark:border-amber-800/50">
                <Gift className="w-4 h-4" />
              </div>
              <span>Milestone Celebration & Reward</span>
            </label>
            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              Reward
            </span>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
            How will you acknowledge and honor your discipline when Sunday evening arrives?
          </p>

          <textarea
            rows={2}
            value={formData.reward}
            onChange={(e) => handleChange('reward', e.target.value)}
            placeholder="e.g. Weekend artisanal coffee tasting, reading a chapter of classic philosophy in peace, and an evening cinema trip..."
            className="w-full text-sm sm:text-base font-serif leading-relaxed px-4 py-3 rounded-lg bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 placeholder:font-sans placeholder:text-xs focus:outline-none focus:border-[#B88939] shadow-inner resize-y min-h-[75px]"
          />
        </div>

        {/* Section 3: Guiding Affirmation */}
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(20,18,15,0.04)] flex flex-col gap-3 transition-all focus-within:border-[#B88939] focus-within:ring-1 focus-within:ring-[#B88939]/40">
          <div className="flex items-center justify-between border-b border-[#EAE3D5] dark:border-[#2E2820] pb-2.5">
            <label className="flex items-center gap-2 text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              <div className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/50 text-[#B88939] dark:text-[#E2BE7A] border border-amber-200 dark:border-amber-800/50">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Guiding Affirmation & Mantra</span>
            </label>
            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              Anchor
            </span>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
            A mental anchor to realign your thoughts when distractions arise or energy wanes.
          </p>

          <textarea
            rows={2}
            value={formData.affirmation}
            onChange={(e) => handleChange('affirmation', e.target.value)}
            placeholder="e.g. Quiet discipline generates clarity. I am patient with the process and relentless in daily execution."
            className="w-full text-sm sm:text-base font-serif italic leading-relaxed px-4 py-3 rounded-lg bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 placeholder:font-sans placeholder:not-italic placeholder:text-xs focus:outline-none focus:border-[#B88939] shadow-inner resize-y min-h-[75px]"
          />
        </div>
      </div>

      {/* Footer Controls & Distraction-free Exit */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] shadow-xs">
        <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
          <Compass className="w-4 h-4 text-[#B88939]" />
          <span>
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[10px] text-stone-800 dark:text-stone-200">Esc</kbd> anytime to restore standard dashboard view.
          </span>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-serif font-bold uppercase text-stone-600 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg border border-[#D8CFBF] dark:border-[#3D352B] transition-all cursor-pointer"
            title="Clear all fields"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={handleManualSave}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-serif font-bold uppercase rounded-lg transition-all cursor-pointer shadow-xs ${
              savedFeedback
                ? 'bg-emerald-700 text-white'
                : 'bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border border-amber-900/30'
            }`}
          >
            {savedFeedback ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved Successfully</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Notes</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onExitFocusMode}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-serif font-bold uppercase rounded-lg bg-gradient-to-r from-[#B88939] to-[#D4AF37] hover:brightness-105 text-[#1C1917] shadow-xs cursor-pointer transition-all"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Finish Writing</span>
          </button>
        </div>
      </div>
    </div>
  );
};
