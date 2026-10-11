import React, { useState, useEffect } from 'react';
import { WeeklyNotes, ThemeConfig } from '../types';
import { Calendar, Target, Gift, Sparkles, Check, Trash2, Save } from 'lucide-react';
import { getMondayOfWeek, parseISODate } from '../utils/dateUtils';

interface TopStackedPanelProps {
  notes: WeeklyNotes;
  onSaveNotes: (updated: WeeklyNotes) => void;
  onClearNotes: () => void;
  theme: ThemeConfig;
  onWeekChange?: (newStartOfWeek: string) => void;
}

export const TopStackedPanel: React.FC<TopStackedPanelProps> = ({
  notes,
  onSaveNotes,
  onClearNotes,
  theme,
  onWeekChange,
}) => {
  const [formData, setFormData] = useState<WeeklyNotes>(notes);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    setFormData(notes);
  }, [notes]);

  const handleChange = (field: keyof WeeklyNotes, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    // Auto-save so user never loses their focus, reward or affirmation
    onSaveNotes(updated);
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

  return (
    <div className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 flex flex-col gap-2.5 border border-[#D8CFBF] dark:border-[#3D352B] bg-[#FDFBF7] dark:bg-[#1C1917] p-4 rounded-lg shadow-[0_4px_20px_rgba(20,18,15,0.06)]">
      <div className="flex items-center justify-between border-b border-[#EAE3D5] dark:border-[#2E2820] pb-2 mb-1">
        <span className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 tracking-wide uppercase">
          Weekly Intentions
        </span>
        <span className="text-[10px] font-sans text-[#B88939] dark:text-[#E2BE7A] font-semibold">
          ACTIVE CYCLE
        </span>
      </div>

      {/* Box 1: Start of the week */}
      <div className="flex flex-col">
        <label className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-stone-700 dark:text-stone-300 mb-1">
          <Calendar className="w-3.5 h-3.5 text-[#B88939]" />
          <span>Start of Week</span>
        </label>
        <input
          type="date"
          value={formData.startOfWeek}
          onChange={handleDateChange}
          className="border border-[#D8CFBF] dark:border-[#3D352B] rounded p-2 text-xs font-medium bg-white dark:bg-[#24201B] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#B88939] cursor-pointer"
        />
      </div>

      {/* Box 2: Weekly focus */}
      <div className="flex flex-col">
        <label className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-stone-700 dark:text-stone-300 mb-1">
          <Target className="w-3.5 h-3.5 text-[#B88939]" />
          <span>Weekly Focus</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Master Linear Algebra & Ship Module 2..."
          value={formData.focus}
          onChange={(e) => handleChange('focus', e.target.value)}
          className="border border-[#D8CFBF] dark:border-[#3D352B] rounded p-2 text-xs font-medium bg-white dark:bg-[#24201B] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#B88939]"
        />
      </div>

      {/* Box 3: Reward */}
      <div className="flex flex-col">
        <label className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-stone-700 dark:text-stone-300 mb-1">
          <Gift className="w-3.5 h-3.5 text-[#B88939]" />
          <span>Reward</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Weekend artisanal coffee tasting & cinema..."
          value={formData.reward}
          onChange={(e) => handleChange('reward', e.target.value)}
          className="border border-[#D8CFBF] dark:border-[#3D352B] rounded p-2 text-xs font-medium bg-white dark:bg-[#24201B] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#B88939]"
        />
      </div>

      {/* Box 4: Affirmation */}
      <div className="flex flex-col">
        <label className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-stone-700 dark:text-stone-300 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-[#B88939]" />
          <span>Affirmation</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Focus is a muscle; quiet effort creates mastery."
          value={formData.affirmation}
          onChange={(e) => handleChange('affirmation', e.target.value)}
          className="border border-[#D8CFBF] dark:border-[#3D352B] rounded p-2 text-xs font-medium bg-white dark:bg-[#24201B] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#B88939]"
        />
      </div>

      {/* Action Buttons: Save & Clear */}
      <div className="flex gap-2 mt-2 pt-2 border-t border-[#EAE3D5] dark:border-[#2E2820]">
        <button
          type="button"
          onClick={handleManualSave}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold uppercase py-2 px-3 rounded transition-all cursor-pointer shadow-xs ${
            savedFeedback
              ? 'bg-emerald-700 text-white'
              : 'bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border border-amber-900/30'
          }`}
        >
          {savedFeedback ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleClear}
          title="Clear all fields"
          className="flex items-center justify-center gap-1 text-xs font-bold uppercase py-2 px-3 border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#24201B] text-stone-600 dark:text-stone-300 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
};
