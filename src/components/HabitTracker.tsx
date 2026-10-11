import React, { useState } from 'react';
import { DayOfWeek, DAYS_OF_WEEK, DAY_FULL_NAMES, HabitItem, HabitReminder, OffDaysMap, ThemeConfig } from '../types';
import { Plus, Trash2, Edit2, Check, CheckSquare, Sparkles, Flame, Bell, Clock, Repeat, Trophy, ShieldCheck, Coffee } from 'lucide-react';
import { HabitReminderModal } from './HabitReminderModal';
import { formatTime12h } from '../utils/notificationService';
import { calculateHabitStreak } from '../utils/streakUtils';

interface HabitTrackerProps {
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

export const HabitTracker: React.FC<HabitTrackerProps> = ({
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
  const [newHabitName, setNewHabitName] = useState('');
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteHabitId, setConfirmDeleteHabitId] = useState<string | null>(null);
  const [reminderModalHabit, setReminderModalHabit] = useState<HabitItem | null>(null);

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName.trim());
    setNewHabitName('');
  };

  const startEdit = (habit: HabitItem) => {
    setEditingHabitId(habit.id);
    setEditingName(habit.name);
  };

  const saveEdit = (habitId: string) => {
    if (editingName.trim()) {
      onEditHabitName(habitId, editingName.trim());
    }
    setEditingHabitId(null);
    setEditingName('');
  };

  // Count active (non-off) days in current week
  const activeDaysCount = DAYS_OF_WEEK.filter((day) => {
    const fullDate = dayDates[day]?.fullDate;
    return !offDays[fullDate]?.isOff;
  }).length;

  const effectiveDenominatorDays = Math.max(1, activeDaysCount);

  // Calculate overall habit completion rate (excluding off-days)
  const totalPossibleChecks = habits.length * effectiveDenominatorDays;
  const totalActualChecks = habits.reduce((acc, h) => {
    return acc + DAYS_OF_WEEK.filter((day) => {
      const fullDate = dayDates[day]?.fullDate;
      const isOff = offDays[fullDate]?.isOff;
      return h.daysCompleted[day] && !isOff;
    }).length;
  }, 0);

  const overallHabitRate = totalPossibleChecks > 0 ? Math.round((totalActualChecks / totalPossibleChecks) * 100) : 0;

  return (
    <div className="w-full bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-5 shadow-[0_4px_20px_rgba(20,18,15,0.06)]">
      {/* Header and Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3D5] dark:border-[#2E2820] pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-[#1C1917] text-[#D4AF37] shadow-xs">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
              <span>Weekly Habit Architecture</span>
              <span className="text-[10px] font-sans font-bold uppercase bg-[#1C1917] text-[#D4AF37] px-2 py-0.5 rounded border border-amber-900/30">
                Continuous Streaks
              </span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Daily micro-disciplines with active streak tracking and no-penalty rest days
            </p>
          </div>
        </div>

        {/* Inline Add Habit Input */}
        <form onSubmit={handleAddHabit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Add habit (e.g. 20m Deep Study)..."
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            className="text-xs font-sans px-3 py-1.5 bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] rounded text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-[#B88939] focus:ring-1 focus:ring-[#B88939] w-48 sm:w-64"
          />
          <button
            type="submit"
            className="flex items-center gap-1 text-xs font-serif font-bold uppercase tracking-wider py-1.5 px-3 rounded bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border border-amber-900/30 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Habit Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-[#D8CFBF] dark:border-[#3D352B] rounded min-w-[760px]">
          {/* Table Header */}
          <thead>
            <tr className={`${theme.headerBg} ${theme.headerText} border-b border-[#2A241E] text-xs font-serif font-bold tracking-wider uppercase`}>
              <th className="py-2.5 px-3.5 border-r border-[#2A241E] w-[260px]">
                Habit Discipline
              </th>
              <th className="py-2.5 px-2.5 border-r border-[#2A241E] w-[140px] text-center">
                Streak Record
              </th>
              {DAYS_OF_WEEK.map((day) => {
                const fullDate = dayDates[day]?.fullDate;
                const isOff = !!offDays[fullDate]?.isOff;
                const isToday = dayDates[day]?.isToday;

                return (
                  <th
                    key={day}
                    className={`py-2 px-1 text-center border-r border-[#2A241E] w-[50px] ${
                      isToday ? 'bg-[#2A241E] text-[#E2BE7A]' : ''
                    } ${isOff ? 'bg-[#212E27] text-emerald-300' : ''}`}
                    title={isOff ? 'Rest / No-guilt day (exempt from penalties)' : undefined}
                  >
                    <div className="leading-tight">
                      <span className="block font-serif font-bold text-[11px]">{day}</span>
                      <span className="block text-[8px] font-sans font-normal opacity-80 uppercase">
                        {isOff ? 'OFF' : dayDates[day].label.split(' ')[1]}
                      </span>
                    </div>
                  </th>
                );
              })}
              <th className="py-2.5 px-3.5 w-[140px] text-right">
                Consistency
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#EDE6D8] dark:divide-[#2E2820]">
            {habits.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-10 text-stone-400 bg-white dark:bg-[#1C1917]">
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles className="w-6 h-6 text-stone-300 dark:text-stone-600" />
                    <span className="text-sm font-serif font-bold text-stone-600 dark:text-stone-300">
                      No Habits Added Yet
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-500 font-sans">
                      Enter a habit name above to start building compound consistency
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              habits.map((habit, index) => {
                const isEditing = editingHabitId === habit.id;
                const isConfirmingDelete = confirmDeleteHabitId === habit.id;
                const hasReminder = !!habit.reminder;
                const reminderEnabled = habit.reminder?.enabled;

                // Calculate streaks taking into account rest/off days
                const { currentStreak, bestStreak, unbrokenAcrossRest } = calculateHabitStreak(
                  habit,
                  offDays,
                  startOfWeekISO
                );

                // Calculate weekly completion
                const completedInActiveDays = DAYS_OF_WEEK.filter((d) => {
                  const date = dayDates[d]?.fullDate;
                  const isOff = offDays[date]?.isOff;
                  return habit.daysCompleted[d] && !isOff;
                }).length;

                const progressPercent = Math.round((completedInActiveDays / effectiveDenominatorDays) * 100);

                return (
                  <tr
                    key={habit.id}
                    className={`transition-colors ${
                      index % 2 === 0 ? 'bg-white dark:bg-[#1C1917]' : 'bg-[#FBF9F4] dark:bg-[#221E1A]'
                    } hover:bg-[#F5F0E5]/60 dark:hover:bg-[#2A241E]`}
                  >
                    {/* Habit Name Cell */}
                    <td className="py-2.5 px-3.5 border-r border-[#EDE6D8] dark:border-[#2E2820]">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(habit.id);
                              if (e.key === 'Escape') setEditingHabitId(null);
                            }}
                            autoFocus
                            className="w-full text-xs font-medium px-2 py-1 bg-white dark:bg-[#24201B] border border-[#B88939] rounded text-stone-900 dark:text-stone-100 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => saveEdit(habit.id)}
                            className="p-1 bg-[#1C1917] text-[#D4AF37] rounded hover:bg-stone-800"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between group">
                            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                              {habit.name}
                            </span>

                            <div className="flex items-center gap-1">
                              {/* Reminder Bell Button */}
                              <button
                                type="button"
                                onClick={() => setReminderModalHabit(habit)}
                                title={hasReminder ? `Reminder set for ${formatTime12h(habit.reminder!.time)}` : 'Set habit reminder'}
                                className={`p-1 rounded transition-colors cursor-pointer ${
                                  hasReminder
                                    ? reminderEnabled
                                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                                      : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                                    : 'opacity-0 group-hover:opacity-100 text-stone-400 dark:text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                                }`}
                              >
                                <Bell className="w-3 h-3" />
                              </button>

                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => startEdit(habit)}
                                  title="Edit habit name"
                                  className="p-1 text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 rounded hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>

                                {/* Delete with confirmation */}
                                {isConfirmingDelete ? (
                                  <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded border border-red-200">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeleteHabit(habit.id);
                                        setConfirmDeleteHabitId(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-red-700 text-white text-[9px] font-bold rounded cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteHabitId(null)}
                                      className="px-1 py-0.5 text-stone-600 text-[9px] cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteHabitId(habit.id)}
                                    title="Delete habit"
                                    className="p-1 text-stone-400 hover:text-red-700 rounded hover:bg-red-50 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Active Reminder Pill */}
                          {hasReminder && (
                            <div
                              onClick={() => setReminderModalHabit(habit)}
                              className={`self-start px-1.5 py-0.5 text-[9px] font-bold rounded flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 ${
                                reminderEnabled ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-stone-200 text-stone-600 line-through'
                              }`}
                              title="Click to edit reminder"
                            >
                              <Clock className="w-2.5 h-2.5 text-amber-700" />
                              <span>{formatTime12h(habit.reminder!.time)}</span>
                              {habit.reminder!.isRecurring ? (
                                <span className="flex items-center gap-0.5 text-[8px] bg-[#1C1917] text-[#D4AF37] px-1 rounded">
                                  <Repeat className="w-2 h-2" /> DAILY
                                </span>
                              ) : (
                                <span className="text-[8px] text-stone-600 font-bold">
                                  ({habit.reminder!.day || 'DAY'})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Streak Tracking Badges Cell */}
                    <td className="py-2.5 px-2.5 border-r border-[#EDE6D8] dark:border-[#2E2820] text-center">
                      <div className="flex flex-col items-center gap-1">
                        {/* Current Streak */}
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-tight shadow-2xs ${
                            currentStreak > 0
                              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                              : 'bg-stone-100 dark:bg-[#24201B] text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-[#3D352B]'
                          }`}
                          title={`Current consecutive-day streak: ${currentStreak} days`}
                        >
                          <Flame
                            className={`w-3.5 h-3.5 ${
                              currentStreak > 0
                                ? 'text-amber-600 dark:text-amber-400 fill-amber-500 animate-pulse'
                                : 'text-stone-400 dark:text-stone-500'
                            }`}
                          />
                          <span>{currentStreak}d streak</span>
                        </div>

                        {/* Personal Record Badge */}
                        <div className="flex items-center gap-1 text-[9px] font-sans text-stone-500 dark:text-stone-400">
                          <Trophy className="w-2.5 h-2.5 text-[#B88939] dark:text-[#E2BE7A]" />
                          <span>PR: {bestStreak}d</span>
                          {unbrokenAcrossRest && (
                            <span
                              className="text-[8px] text-emerald-700 dark:text-emerald-400 font-medium ml-0.5"
                              title="Streak maintained across rest day"
                            >
                              🌿
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Day Checkboxes */}
                    {DAYS_OF_WEEK.map((day) => {
                      const isChecked = !!habit.daysCompleted[day];
                      const fullDate = dayDates[day]?.fullDate;
                      const isOff = !!offDays[fullDate]?.isOff;
                      const isToday = dayDates[day]?.isToday;

                      return (
                        <td
                          key={day}
                          className={`py-2 px-1 text-center border-r border-[#EDE6D8] dark:border-[#2E2820] ${
                            isToday ? 'bg-amber-50/50 dark:bg-amber-950/30' : ''
                          } ${isOff ? 'bg-emerald-50/40 dark:bg-emerald-950/30' : ''}`}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleHabitDay(habit.id, day)}
                            aria-label={`Toggle ${habit.name} for ${day}`}
                            title={isOff ? 'Rest day (optional practice)' : `Toggle for ${day}`}
                            className={`w-6 h-6 mx-auto rounded border flex items-center justify-center transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-[#1C1917] text-[#D4AF37] border-[#1C1917] shadow-xs'
                                : isOff
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:border-emerald-600'
                                : 'bg-white dark:bg-[#24201B] border-stone-300 dark:border-[#3D352B] hover:border-stone-800 dark:hover:border-stone-400'
                            }`}
                          >
                            {isChecked ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : isOff ? (
                              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">~</span>
                            ) : null}
                          </button>
                        </td>
                      );
                    })}

                    {/* Weekly Progress Bar */}
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-baseline gap-1 text-xs">
                          <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
                            {completedInActiveDays}/{effectiveDenominatorDays}
                          </span>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400">
                            ({progressPercent}%)
                          </span>
                        </div>
                        <div className="w-24 h-2 bg-[#EAE3D5] dark:bg-[#3D352B] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#B88939] to-[#D4AF37] rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Overall Summary */}
      <div className="mt-4 pt-3 border-t border-[#EAE3D5] dark:border-[#2E2820] flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
        <div className="flex items-center gap-3">
          <span className="font-serif font-bold text-stone-800 dark:text-stone-200">
            Total Habits Active: {habits.length}
          </span>
          {activeDaysCount < 7 && (
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-sans font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
              <Coffee className="w-3 h-3" />
              {7 - activeDaysCount} Rest Day(s) Excluded from Penalties
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase font-bold text-stone-500 dark:text-stone-400">Weekly Consistency:</span>
          <span className="font-serif font-bold text-[#B88939] dark:text-[#E2BE7A] text-sm">
            {overallHabitRate}%
          </span>
        </div>
      </div>

      {/* Habit Reminder Modal */}
      {reminderModalHabit && (
        <HabitReminderModal
          isOpen={true}
          onClose={() => setReminderModalHabit(null)}
          habit={reminderModalHabit}
          theme={theme}
          onSaveReminder={onSaveHabitReminder}
        />
      )}
    </div>
  );
};
