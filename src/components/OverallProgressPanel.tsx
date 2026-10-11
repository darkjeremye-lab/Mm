import React from 'react';
import { DayOfWeek, DAYS_OF_WEEK, OffDaysMap, TaskItem, ThemeConfig } from '../types';
import { CircularProgress } from './CircularProgress';
import { CheckCircle2, TrendingUp, Moon } from 'lucide-react';

interface OverallProgressPanelProps {
  tasksByDay: Record<DayOfWeek, TaskItem[]>;
  theme: ThemeConfig;
  dayDates: Record<DayOfWeek, { label: string; fullDate: string; isToday: boolean }>;
  offDays?: OffDaysMap;
}

export const OverallProgressPanel: React.FC<OverallProgressPanelProps> = ({
  tasksByDay,
  theme,
  dayDates,
  offDays = {},
}) => {
  // Compute metrics per day
  const dailyStats = DAYS_OF_WEEK.map((day) => {
    const tasks = tasksByDay[day] || [];
    const dateInfo = dayDates[day];
    const isOff = !!offDays[dateInfo.fullDate]?.isOff;
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const percent = total > 0 ? (completed / total) * 100 : 0;
    return {
      day,
      dateInfo,
      isOff,
      total,
      completed,
      percent,
    };
  });

  // Overall totals across the week (excluding off-days with 0 tasks)
  const activeStats = dailyStats.filter((d) => !d.isOff);
  const totalTasks = dailyStats.reduce((acc, curr) => acc + curr.total, 0);
  const totalCompleted = dailyStats.reduce((acc, curr) => acc + curr.completed, 0);
  
  // Weekly percentage: if off days exist, base on active non-off days or overall
  const activeTasks = activeStats.reduce((acc, curr) => acc + curr.total, 0);
  const activeCompleted = activeStats.reduce((acc, curr) => acc + curr.completed, 0);
  const weeklyPercentage =
    activeTasks > 0
      ? Math.round((activeCompleted / activeTasks) * 100)
      : totalTasks > 0
      ? Math.round((totalCompleted / totalTasks) * 100)
      : 100;

  // Max completed tasks for scaling the bar chart heights proportionally
  const maxCompleted = Math.max(1, ...dailyStats.map((d) => d.completed));
  const chartMax = Math.max(5, maxCompleted);

  const offDaysCount = dailyStats.filter((d) => d.isOff).length;

  return (
    <div className="flex-1 flex flex-col bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 sm:p-5 shadow-[0_4px_20px_rgba(20,18,15,0.06)]">
      {/* Header bar of overall panel */}
      <div className="flex items-center justify-between border-b border-[#EAE3D5] dark:border-[#2E2820] pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[#1C1917] text-[#D4AF37] shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Weekly Momentum & Execution
            </h2>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium hidden sm:block">
              Daily task completion rate relative to weekly volume
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-serif font-bold text-stone-800 dark:text-stone-200">
          {offDaysCount > 0 && (
            <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-[#8A631F] dark:text-[#E2BE7A] px-2.5 py-1 rounded border border-amber-200 dark:border-amber-800/50 text-[11px] font-sans">
              <Moon className="w-3 h-3 fill-current" />
              {offDaysCount} Rest {offDaysCount === 1 ? 'Day' : 'Days'} (Exempt)
            </span>
          )}
          <span className="flex items-center gap-1.5 bg-[#F7F3EB] dark:bg-[#24201B] px-2.5 py-1 rounded border border-[#EAE3D5] dark:border-[#3D352B]">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.barColorHex }} />
            Done: {totalCompleted}
          </span>
          <span className="flex items-center gap-1.5 bg-[#F7F3EB] dark:bg-[#24201B] px-2.5 py-1 rounded border border-[#EAE3D5] dark:border-[#3D352B]">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-600" />
            Left: {totalTasks - totalCompleted}
          </span>
          <span className="bg-[#1C1917] text-[#D4AF37] px-2.5 py-1 text-[11px] font-sans font-bold uppercase rounded border border-amber-900/30">
            Total: {totalTasks}
          </span>
        </div>
      </div>

      {/* Main content: Bar Chart (Left/Center) + Donut Ring (Right) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Daily Bar Chart */}
        <div className="md:col-span-8 flex flex-col justify-between h-full min-h-[170px] pt-1">
          <div className="flex items-center justify-between text-[11px] font-sans font-medium text-stone-500 dark:text-stone-400 mb-2">
            <span>Completed tasks (Monday through Sunday)</span>
            <span className="text-[10px] text-stone-400 dark:text-stone-500">Scale target: {chartMax} tasks</span>
          </div>

          {/* Graphic Bar Chart Area */}
          <div className="relative flex-1 flex items-end justify-between gap-2 sm:gap-4 pb-2 pt-4 border-b border-[#D8CFBF] dark:border-[#3D352B] bg-[#F7F3EB] dark:bg-[#151210] rounded-t-md px-3 sm:px-5">
            {/* Horizontal guide lines */}
            <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-[#E5DEC9] dark:border-[#2E2820] pointer-events-none" />
            <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-[#E5DEC9] dark:border-[#2E2820] pointer-events-none" />
            <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-[#E5DEC9] dark:border-[#2E2820] pointer-events-none" />

            {dailyStats.map(({ day, completed, total, dateInfo, isOff }) => {
              const heightPercent = totalTasks === 0 ? 0 : Math.min(100, Math.max(8, (completed / chartMax) * 100));
              const isZero = completed === 0;

              return (
                <div
                  key={day}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative z-10"
                >
                  {/* Task count on top of bar */}
                  <div className="mb-1.5 text-[11px] font-serif font-bold text-stone-800 dark:text-stone-200 group-hover:scale-110 transition-transform flex items-center gap-0.5">
                    {isOff ? (
                      <span className="text-[9px] font-sans text-amber-800 dark:text-amber-300 font-bold bg-amber-100/90 dark:bg-amber-950/80 px-1 rounded">
                        REST
                      </span>
                    ) : (
                      <>
                        {completed}
                        <span className="text-[9px] text-stone-400 dark:text-stone-500 font-sans font-normal">/{total}</span>
                      </>
                    )}
                  </div>

                  {/* The solid vertical bar */}
                  <div className={`w-full max-w-[34px] rounded-t-sm h-[95px] flex flex-col justify-end overflow-hidden relative shadow-xs ${isOff ? 'bg-[#E5DAC6] dark:bg-[#2A241E] border-t-2 border-amber-500' : 'bg-[#EAE3D5] dark:bg-[#24201B]'}`}>
                    <div
                      className="w-full transition-all duration-300 rounded-t-sm"
                      style={{
                        height: isOff ? '100%' : isZero ? '4px' : `${heightPercent}%`,
                        backgroundColor: isOff ? '#D4AF37' : isZero ? '#D5CCBB' : theme.barColorHex,
                        opacity: isOff ? 0.35 : 1,
                      }}
                    />
                  </div>

                  {/* Day label */}
                  <div className="mt-2 text-center">
                    <span
                      className={`block text-[11px] font-serif font-bold uppercase tracking-tight ${
                        dateInfo.isToday
                          ? 'bg-[#1C1917] text-[#D4AF37] px-1.5 py-0.5 rounded shadow-xs'
                          : isOff
                          ? 'text-amber-800 dark:text-amber-300'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {day}
                    </span>
                    <span className="hidden sm:block text-[9px] font-sans font-medium text-stone-400 dark:text-stone-500 uppercase mt-0.5">
                      {dateInfo.label.split(' ')[1]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut Chart / Weekly Completion Ring */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-3 md:border-l border-[#EAE3D5] dark:border-[#2E2820] bg-[#FDFBF7] dark:bg-[#1C1917] h-full md:pl-6">
          <div className="my-1">
            <CircularProgress
              percentage={weeklyPercentage}
              size={128}
              strokeWidth={12}
              trackColor={theme.ringTrackHex}
              progressColor={theme.ringProgressHex}
              textSizeClass="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="text-center mt-2">
            <span className="text-xs font-serif font-bold tracking-wide uppercase text-stone-800 dark:text-stone-200">
              Total Weekly Completion
            </span>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-sans mt-0.5">
              {totalCompleted} of {totalTasks} tasks fulfilled
              {offDaysCount > 0 && ` (${offDaysCount} off-days exempt)`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
