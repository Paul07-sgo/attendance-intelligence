import React, { useState } from 'react';
import { Sparkles, MinusCircle, PlusCircle, RotateCcw, ArrowRight } from 'lucide-react';
import type { SubjectCalculation } from '../types';
import {
  calculateWhatIfMiss,
  calculateWhatIfAttend,
  calculateAggregateStats,
  calculateAggregateWhatIfMiss,
  calculateAggregateWhatIfAttend,
  getAttendanceStatus,
} from '../utils/attendanceEngine';

interface WhatIfCalculatorProps {
  stats: SubjectCalculation[];
  overallTarget?: number;
}

export const WhatIfCalculator: React.FC<WhatIfCalculatorProps> = ({ stats, overallTarget = 87 }) => {
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(stats[0]?.subject.code || '');
  const [mode, setMode] = useState<'miss' | 'attend'>('miss');
  const [classCount, setClassCount] = useState<number>(3);

  const currentStat = stats.find((s) => s.subject.code === selectedSubjectCode) || stats[0];

  if (!currentStat) {
    return null;
  }

  const { subject, subjectMinimumAttendance } = currentStat;
  const subjectsList = stats.map((s) => s.subject);

  // Current aggregate stats across all included subjects
  const aggStats = calculateAggregateStats(subjectsList, overallTarget);

  // A. Subject Impact calculations
  const subjectAttended = subject.attended;
  const subjectDelivered = subject.delivered;
  const currentSubjectPct = currentStat.currentPercentage;

  const projectedSubjectAttended = mode === 'miss' ? subjectAttended : subjectAttended + classCount;
  const projectedSubjectDelivered = subjectDelivered + classCount;
  const projectedSubjectPct =
    mode === 'miss'
      ? calculateWhatIfMiss(subjectAttended, subjectDelivered, classCount)
      : calculateWhatIfAttend(subjectAttended, subjectDelivered, classCount);

  const hasSubjectTarget = subjectMinimumAttendance !== null;
  const projectedSubjectStatus = hasSubjectTarget
    ? getAttendanceStatus(
        projectedSubjectPct,
        subjectMinimumAttendance,
        mode === 'miss' ? (currentStat.classesCanMiss !== null ? currentStat.classesCanMiss - classCount : 0) : 2
      )
    : 'no_target';

  // B. Aggregate Impact calculations
  const currentAggPct = aggStats.currentPercentage;
  const projectedAggPct =
    mode === 'miss'
      ? calculateAggregateWhatIfMiss(aggStats.totalAttended, aggStats.totalConducted, classCount)
      : calculateAggregateWhatIfAttend(aggStats.totalAttended, aggStats.totalConducted, classCount);

  const projectedAggConducted = aggStats.totalConducted + classCount;
  const aggDiff = projectedAggPct - overallTarget;
  const isAggAboveTarget = projectedAggPct >= overallTarget - 1e-9;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
      {/* Simulator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-6 h-6 text-amber-100" />
          </div>
          <div>
            <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <span>⚡ Attendance Simulator</span>
            </h3>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Simulate absences and attendance before they affect your real record.
            </p>
          </div>
        </div>

        {/* Controls: Subject Selector & Mode Switch */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode switch */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setMode('miss')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                mode === 'miss'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Miss X Classes</span>
            </button>
            <button
              onClick={() => setMode('attend')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                mode === 'attend'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Attend X Classes</span>
            </button>
          </div>

          {/* Subject Selector */}
          <select
            value={selectedSubjectCode}
            onChange={(e) => setSelectedSubjectCode(e.target.value)}
            className="px-4 py-2 text-xs lg:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {stats.map((s) => (
              <option key={s.subject.id} value={s.subject.code}>
                {s.subject.code} — {s.subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Slider / Numeric Input Bar */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label className="text-xs lg:text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {mode === 'miss' ? 'Classes to Miss:' : 'Classes to Attend:'}
          </label>
          <input
            type="number"
            min={1}
            max={30}
            value={classCount}
            onChange={(e) => setClassCount(Math.max(1, parseInt(e.target.value) || 1))}
            className={`w-20 px-3 py-1.5 font-black text-center text-lg bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white ${
              mode === 'miss' ? 'border-rose-300 dark:border-rose-800' : 'border-emerald-300 dark:border-emerald-800'
            }`}
          />
        </div>

        <div className="flex-1 w-full max-w-md flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-400">1</span>
          <input
            type="range"
            min={1}
            max={15}
            value={classCount}
            onChange={(e) => setClassCount(parseInt(e.target.value))}
            className={`w-full h-2.5 rounded-lg appearance-none cursor-pointer ${
              mode === 'miss' ? 'bg-rose-200 dark:bg-rose-950 accent-rose-600' : 'bg-emerald-200 dark:bg-emerald-950 accent-emerald-600'
            }`}
          />
          <span className="text-xs font-bold text-slate-400">15</span>
        </div>

        <button
          onClick={() => setClassCount(3)}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center space-x-1 font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* TWO PANELS: LEFT (Subject Impact) & RIGHT (Aggregate Impact) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {/* LEFT PANEL: SUBJECT IMPACT */}
        <div className="p-6 lg:p-7 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
            <span className="text-xs lg:text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              SUBJECT IMPACT — {subject.code}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {subject.name}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs lg:text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Current Attendance:</span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {subjectAttended} / {subjectDelivered} ({currentSubjectPct.toFixed(2)}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs lg:text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {mode === 'miss' ? `Miss ${classCount} classes:` : `Attend ${classCount} classes:`}
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {projectedSubjectAttended} / {projectedSubjectDelivered}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Projected Subject %</span>
                <span className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {projectedSubjectPct.toFixed(2)}%
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Subject Status</span>
                {!hasSubjectTarget ? (
                  <span className="inline-block mt-1 text-xs font-semibold text-slate-400 italic">
                    No individual target configured
                  </span>
                ) : (
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold mt-1 ${
                      projectedSubjectStatus === 'danger'
                        ? 'bg-rose-600 text-white'
                        : projectedSubjectStatus === 'warning'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {projectedSubjectStatus === 'danger'
                      ? 'Below Target'
                      : projectedSubjectStatus === 'warning'
                      ? 'At Risk'
                      : 'Safe Buffer'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: AGGREGATE IMPACT */}
        <div className="p-6 lg:p-7 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-5">
          <div className="flex items-center justify-between border-b border-indigo-200/60 dark:border-indigo-900/40 pb-3">
            <span className="text-xs lg:text-sm font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              AGGREGATE IMPACT
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Overall Target: {overallTarget}%
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs lg:text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Current Pooled Aggregate:</span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {aggStats.totalAttended} / {aggStats.totalConducted} ({currentAggPct.toFixed(2)}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs lg:text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {mode === 'miss' ? `Miss ${classCount} classes:` : `Attend ${classCount} classes:`}
              </span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {mode === 'miss' ? `${aggStats.totalAttended} / ${projectedAggConducted}` : `${aggStats.totalAttended + classCount} / ${projectedAggConducted}`}
              </span>
            </div>

            <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-900/40 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Projected Aggregate %</span>
                <span className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {projectedAggPct.toFixed(2)}%
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Target Status</span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold mt-1 ${
                    isAggAboveTarget ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {isAggAboveTarget
                    ? `Above target by ${aggDiff.toFixed(2)} % pts`
                    : `Below target by ${Math.abs(aggDiff).toFixed(2)} % pts`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPACT PROJECTION VISUALIZATION */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs lg:text-sm">
          <div className="flex items-center space-x-3 font-semibold text-slate-600 dark:text-slate-300">
            <span className="text-slate-400 uppercase font-bold text-[11px]">Projection Flow:</span>
            <span>Current ({currentAggPct.toFixed(2)}%)</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-900 dark:text-white">
              {mode === 'miss' ? `After missing ${classCount}` : `After attending ${classCount}`}: {projectedAggPct.toFixed(2)}%
            </span>
          </div>

          <div className="flex items-center space-x-2 font-bold text-indigo-600 dark:text-indigo-400">
            <span>Target: {overallTarget}%</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                isAggAboveTarget ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {isAggAboveTarget ? 'Safe' : 'At Risk'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

