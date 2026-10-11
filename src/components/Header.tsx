import React from 'react';
import { ThemeConfig, ThemeType } from '../types';
import { ThemeSelector } from './ThemeSelector';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Printer,
  CalendarDays,
  CheckCheck,
  Undo2,
  Redo2,
  Bell,
} from 'lucide-react';
import { shiftWeek, parseISODate, getMondayOfWeek } from '../utils/dateUtils';

interface HeaderProps {
  startOfWeek: string;
  onWeekChange: (newStartOfWeek: string) => void;
  currentTheme: ThemeType;
  themeConfig: ThemeConfig;
  onSelectTheme: (theme: ThemeType) => void;
  onResetData: () => void;
  onClearAll: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  onUndo: () => void;
  onRedo: () => void;
  lastActionLabel?: string;
  activeRemindersCount: number;
  onOpenReminders: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  startOfWeek,
  onWeekChange,
  currentTheme,
  themeConfig,
  onSelectTheme,
  onResetData,
  canUndo,
  canRedo,
  undoCount,
  redoCount,
  onUndo,
  onRedo,
  lastActionLabel,
  activeRemindersCount,
  onOpenReminders,
}) => {
  const baseMonday = parseISODate(startOfWeek);
  const endSunday = new Date(baseMonday);
  endSunday.setDate(baseMonday.getDate() + 6);

  const startFormatted = baseMonday
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
  const endFormatted = endSunday
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();

  const isCurrentWeek = startOfWeek === getMondayOfWeek();

  const handlePrevWeek = () => {
    onWeekChange(shiftWeek(startOfWeek, -1));
  };

  const handleNextWeek = () => {
    onWeekChange(shiftWeek(startOfWeek, 1));
  };

  const handleToday = () => {
    onWeekChange(getMondayOfWeek());
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="w-full bg-white border-[4px] border-black p-3.5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3">
      {/* Top Banner Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b-2 border-black pb-3">
        {/* App Title & Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-2.5 py-1 border-[3px] border-black ${themeConfig.headerBg} ${themeConfig.headerText} font-black text-lg tracking-tight shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`}
          >
            WP//01
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              <span>Weekly Planner</span>
              <span className="text-neutral-400 font-bold">&</span>
              <span>Habit Tracker</span>
            </h1>
            <p className="text-[10px] font-black text-neutral-600 tracking-wide uppercase">
              Graphic, High-Contrast Task Management & Daily Streak Architecture
            </p>
          </div>
        </div>

        {/* Theme Switcher & Utility Actions */}
        <div className="flex flex-wrap items-center gap-2.5 no-print">
          <ThemeSelector currentTheme={currentTheme} onSelectTheme={onSelectTheme} />

          {/* Undo / Redo Control Cluster */}
          <div className="flex items-center gap-1.5 border-l-2 border-black pl-2.5">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title={canUndo ? `Undo last action (${undoCount} available) [Ctrl+Z]` : 'Nothing to undo'}
              className={`flex items-center gap-1 text-xs font-black uppercase py-1 px-2.5 border-2 border-black transition-all ${
                canUndo
                  ? 'bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-300 opacity-60 cursor-not-allowed shadow-none'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Undo</span>
              {canUndo && (
                <span className="text-[9px] bg-black text-white px-1 py-0.2 rounded-none font-black ml-0.5">
                  {undoCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title={canRedo ? `Redo action (${redoCount} available) [Ctrl+Y / Ctrl+Shift+Z]` : 'Nothing to redo'}
              className={`flex items-center gap-1 text-xs font-black uppercase py-1 px-2.5 border-2 border-black transition-all ${
                canRedo
                  ? 'bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-300 opacity-60 cursor-not-allowed shadow-none'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Redo</span>
              {canRedo && (
                <span className="text-[9px] bg-black text-white px-1 py-0.2 rounded-none font-black ml-0.5">
                  {redoCount}
                </span>
              )}
            </button>
          </div>

          {/* Reminders Button */}
          <div className="flex items-center border-l-2 border-black pl-2.5">
            <button
              type="button"
              onClick={onOpenReminders}
              title="Open Reminders & Alarm Center"
              className={`flex items-center gap-1.5 text-xs font-black uppercase py-1 px-2.5 border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all ${
                activeRemindersCount > 0
                  ? `${themeConfig.accentBg} ${themeConfig.accentText} hover:invert`
                  : 'bg-white text-black hover:bg-black hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Reminders</span>
              {activeRemindersCount > 0 && (
                <span className="text-[9px] bg-black text-white px-1 font-black">
                  {activeRemindersCount}
                </span>
              )}
            </button>
          </div>

          {/* Print & Sample Data */}
          <div className="flex items-center gap-1.5 border-l-2 border-black pl-2.5">
            <button
              type="button"
              onClick={handlePrint}
              title="Print Weekly Planner"
              className="flex items-center gap-1 text-xs font-black uppercase py-1 px-2.5 bg-white text-black border-2 border-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Load sample tasks, habits, and focus for this week?')) {
                  onResetData();
                }
              }}
              title="Load Sample Week Data"
              className="flex items-center gap-1 text-xs font-black uppercase py-1 px-2.5 bg-white text-black border-2 border-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Sample Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Week Navigation & Status Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Previous Week */}
          <button
            type="button"
            onClick={handlePrevWeek}
            aria-label="Previous Week"
            className="p-1.5 bg-white border-2 border-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[3]" />
          </button>

          {/* Date Range Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#EEE] border-2 border-black text-xs sm:text-sm font-black uppercase tracking-wider text-black">
            <CalendarDays className="w-4 h-4 stroke-[3]" />
            <span>
              {startFormatted} — {endFormatted}
            </span>
          </div>

          {/* Next Week */}
          <button
            type="button"
            onClick={handleNextWeek}
            aria-label="Next Week"
            className="p-1.5 bg-white border-2 border-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>

          {/* Current Week Quick Jump */}
          {!isCurrentWeek && (
            <button
              type="button"
              onClick={handleToday}
              className={`text-xs font-black uppercase py-1 px-2.5 border-2 border-black ${themeConfig.accentBg} ${themeConfig.accentText} hover:invert shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer`}
            >
              Jump to This Week
            </button>
          )}
        </div>

        {/* Quick status & Keyboard shortcut banner */}
        <div className="flex items-center gap-3 text-xs font-black uppercase text-neutral-700">
          {lastActionLabel && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] bg-neutral-100 px-2 py-0.5 border border-black text-black">
              Latest: {lastActionLabel}
            </span>
          )}

          <span className="hidden lg:inline text-[9px] font-bold text-neutral-400">
            Shortcuts: [Ctrl+Z] Undo • [Ctrl+Y] Redo
          </span>

          <span className="flex items-center gap-1 text-[11px]">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
            Auto-Saved
          </span>
        </div>
      </div>
    </header>
  );
};
