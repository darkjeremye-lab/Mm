import React, { useState } from 'react';
import { DayOfWeek, HabitItem, HabitReminder, OffDaysMap, ThemeConfig } from '../types';
import { HabitTracker } from './HabitTracker';
import {
  CheckSquare,
  Flame,
  Plus,
  Target,
  Sparkles,
  Trophy,
  Activity,
  Calendar,
  Zap,
} from 'lucide-react';

interface HabitsPageProps {
  habits: HabitItem[];
  theme: ThemeConfig;
  dayDates: Record<DayOfWeek, { label: string; fullDate: string; isToday: boolean }>;
  offDays?: OffDaysMap;
  startOfWeekISO?: string;
  onAddHabit: (name: string) => void;
  onToggleHabitDay: (habitId: string, day: DayOfWeek) => void;
  onEditHabitName: (habitId: string, newName: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onSaveHabitReminder: (habitId: string, reminder: HabitReminder | undefined) => void;
}

const PRESET_HABITS = [
  { name: 'Morning 20m Deep Focus', category: 'Productivity' },
  { name: 'Hydrate 2L Water', category: 'Health' },
  { name: '45m Gym / Workout', category: 'Fitness' },
  { name: 'Read 15 Pages', category: 'Growth' },
  { name: 'Daily Evening Reflection', category: 'Mindset' },
  { name: 'No Screen 30m Before Bed', category: 'Recovery' },
];

export const HabitsPage: React.FC<HabitsPageProps> = ({
  habits,
  theme,
  dayDates,
  offDays = {},
  startOfWeekISO,
  onAddHabit,
  onToggleHabitDay,
  onEditHabitName,
  onDeleteHabit,
  onSaveHabitReminder,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Compute metrics
  const totalSlots = habits.length * 7;
  const completedSlots = habits.reduce(
    (acc, h) => acc + Object.values(h.daysCompleted).filter(Boolean).length,
    0
  );
  const consistencyRate = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;

  // Perfect habits this week
  const perfectHabits = habits.filter(
    (h) => Object.values(h.daysCompleted).filter(Boolean).length === 7
  );

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5">
      {/* Top Banner */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-5 sm:p-6 shadow-[0_4px_20px_rgba(20,18,15,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="p-2.5 rounded-md bg-[#1C1917] text-[#D4AF37] shadow-xs"
          >
            <CheckSquare className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Habit Architecture & Streaks
              </h1>
              <span className="text-[10px] font-sans font-bold uppercase bg-[#1C1917] text-[#D4AF37] px-2 py-0.5 rounded shadow-xs">
                Streak Engine
              </span>
            </div>
            <p className="text-xs font-sans text-stone-500 dark:text-stone-400 mt-0.5">
              Atomic daily behaviors tracked consecutively — rest days protect your active streak.
            </p>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-serif font-bold text-stone-800 dark:text-stone-200">
          <div className="px-3 py-1.5 bg-[#F7F3EB] dark:bg-[#25201B] border border-[#EAE3D5] dark:border-[#3D352B] rounded-md flex items-center gap-1.5 shadow-2xs">
            <Activity className="w-3.5 h-3.5 text-[#8A631F] dark:text-[#D4AF37]" />
            <span>Consistency: {consistencyRate}%</span>
          </div>

          <div className="px-3 py-1.5 bg-[#F7F3EB] dark:bg-[#25201B] border border-[#EAE3D5] dark:border-[#3D352B] rounded-md flex items-center gap-1.5 shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>
              {perfectHabits.length} Perfect Streak{perfectHabits.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Main Habit Table component */}
      <HabitTracker
        habits={habits}
        theme={theme}
        dayDates={dayDates}
        offDays={offDays}
        startOfWeekISO={startOfWeekISO}
        onAddHabit={onAddHabit}
        onToggleHabitDay={onToggleHabitDay}
        onEditHabitName={onEditHabitName}
        onDeleteHabit={onDeleteHabit}
        onSaveHabitReminder={onSaveHabitReminder}
      />

      {/* Preset Inspiration Pills */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 shadow-[0_2px_12px_rgba(20,18,15,0.04)]">
        <div className="flex items-center gap-2 mb-2.5">
          <Zap className="w-4 h-4 text-[#B88939]" />
          <span className="text-xs font-serif font-bold tracking-wide uppercase text-stone-900 dark:text-stone-100">
            Quick Add High-Impact Habits
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESET_HABITS.map((preset) => {
            const alreadyAdded = habits.some(
              (h) => h.name.toLowerCase() === preset.name.toLowerCase()
            );
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  if (!alreadyAdded) {
                    onAddHabit(preset.name);
                  }
                }}
                disabled={alreadyAdded}
                className={`text-xs font-sans font-medium px-3 py-1.5 rounded-md border flex items-center gap-1.5 transition-all ${
                  alreadyAdded
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700 cursor-not-allowed opacity-60'
                    : 'bg-white dark:bg-[#24201B] hover:bg-stone-900 dark:hover:bg-stone-800 hover:text-[#D4AF37] hover:border-stone-900 dark:hover:border-[#3D352B] text-stone-800 dark:text-stone-200 border-[#D8CFBF] dark:border-[#3D352B] cursor-pointer shadow-2xs'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-[#B88939]" />
                <span>{preset.name}</span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500">({preset.category})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
