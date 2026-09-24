import React from 'react';
import { Percent, ShieldCheck, Sparkles, Calendar, Clock, TrendingUp } from 'lucide-react';
import type { SubjectCalculation, TimetableEntry, AcademicEvent } from '../types';
import { calculateAggregateStats } from '../utils/attendanceEngine';
import { getClassesForDate, getDayOfWeek, parseISODate } from '../utils/calendarEngine';

interface DashboardSummaryProps {
  stats: SubjectCalculation[];
  overallTarget: number;
  baselineDate: string;
  timetable: TimetableEntry[];
  events: AcademicEvent[];
  onOpenSkipSimulator?: () => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  stats,
  overallTarget,
  baselineDate,
  timetable,
  events,
  onOpenSkipSimulator,
}) => {
  const subjectsList = stats.map((s) => s.subject);
  const agg = calculateAggregateStats(subjectsList, overallTarget);

  // Today's Intelligence
  const todayClasses = getClassesForDate(baselineDate, timetable, events);
  const dayName = getDayOfWeek(baselineDate);
  const formattedTodayDate = parseISODate(baselineDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const uniqueTodaySubjects = Array.from(new Set(todayClasses.map((c) => c.subjectCode)));

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* 1. OVERALL ATTENDANCE HERO (Spans 7 cols on desktop) */}
      <div className="col-span-12 lg:col-span-7 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-7 lg:p-8 shadow-md border border-indigo-800/60 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 border border-indigo-400/30">
              <Percent className="w-5 h-5" />
            </div>
            <span className="text-xs lg:text-sm font-extrabold uppercase tracking-wider text-indigo-200">
              OVERALL ATTENDANCE
            </span>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            Target: {overallTarget}%
          </span>
        </div>

        <div className="my-6">
          <div className="text-5xl lg:text-6xl font-black tracking-tight text-white">
            {agg.currentPercentage.toFixed(2)}%
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs lg:text-sm text-indigo-200 font-semibold">
            <span>Total Attended: <strong className="text-white font-extrabold">{agg.totalAttended} / {agg.totalConducted}</strong></span>
            <span>•</span>
            <span>Buffer: <strong className="text-emerald-300 font-extrabold">+{agg.bufferPercentage.toFixed(2)} % pts</strong></span>
            <span>•</span>
            <span>Safe-miss budget: <strong className="text-amber-300 font-extrabold">{agg.safeMissBudget} classes</strong></span>
          </div>
        </div>

        <div className="pt-4 border-t border-indigo-800/60 flex items-center justify-between text-xs text-indigo-300/80 font-medium">
          <span>Baseline Date: <strong className="text-white">{baselineDate}</strong></span>
          <span>Pooled Aggregate Logic Active</span>
        </div>
      </div>

      {/* 2. AGGREGATE SAFETY BUFFER CARD (Spans 5 cols on desktop) */}
      <div className="col-span-12 lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-7 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs lg:text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            SAFE-MISS BUFFER
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="my-4">
          <div className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {agg.safeMissBudget} <span className="text-lg lg:text-xl font-bold text-slate-400">classes</span>
          </div>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            before aggregate falls below <strong className="text-slate-900 dark:text-white font-extrabold">{overallTarget}%</strong>
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1.5 font-medium">
          <div className="flex items-center justify-between">
            <span>Current Aggregate:</span>
            <strong className="text-slate-900 dark:text-white">{agg.currentPercentage.toFixed(2)}%</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Target Threshold:</span>
            <strong className="text-indigo-600 dark:text-indigo-400">{overallTarget}%</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Current Safety Margin:</span>
            <strong className="text-emerald-600 dark:text-emerald-400">+{agg.bufferPercentage.toFixed(2)} % pts</strong>
          </div>
        </div>
      </div>

      {/* 3. TODAY'S ATTENDANCE INTELLIGENCE (Spans 6 cols on desktop) */}
      <div className="col-span-12 md:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-7 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/40">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm lg:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Today's Attendance Intelligence
              </h4>
              <p className="text-xs text-slate-400 font-medium">{formattedTodayDate}</p>
            </div>
          </div>

          {onOpenSkipSimulator && (
            <button
              onClick={onOpenSkipSimulator}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Skip Simulator</span>
            </button>
          )}
        </div>

        <div>
          {todayClasses.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center">
              <p className="text-xs lg:text-sm font-semibold text-slate-500 dark:text-slate-400 italic">
                No regular classes scheduled today ({dayName})
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs lg:text-sm font-bold text-slate-700 dark:text-slate-300">
                <span>{todayClasses.length} sessions scheduled</span>
                <span>{uniqueTodaySubjects.length} subjects</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {todayClasses.map((cls) => (
                  <span
                    key={cls.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{cls.subjectCode} ({cls.startTime})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. ATTENDANCE PROJECTION (Spans 6 cols on desktop) */}
      <div className="col-span-12 md:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-7 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm lg:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Projected Attendance
              </h4>
              <p className="text-xs text-slate-400 font-medium">Deterministic Future Forecast</p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            Forecast Active
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs lg:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Current Baseline Aggregate:</span>
            <strong className="text-slate-900 dark:text-white font-extrabold">{agg.currentPercentage.toFixed(2)}%</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium">If 100% upcoming attended:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">≥ {agg.currentPercentage.toFixed(2)}%</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Target Threshold:</span>
            <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{overallTarget}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

