import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  CheckSquare,
  Square,
  Clock,
} from 'lucide-react';
import type { Subject, TimetableEntry, AcademicEvent } from '../types';
import { evaluateMultiClassSkip } from '../utils/simulationEngine';
import { getClassesForDate, isAcademicBlackoutDate, getDayOfWeek } from '../utils/calendarEngine';

interface SkipDayCalculatorProps {
  subjects: Subject[];
  timetable: TimetableEntry[];
  events: AcademicEvent[];
  globalTarget: number;
  baselineDate: string;
}

export const SkipDayCalculator: React.FC<SkipDayCalculatorProps> = ({
  subjects,
  timetable,
  events,
  globalTarget,
  baselineDate,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(baselineDate || '2026-09-25');

  const dayOfWeek = getDayOfWeek(selectedDate);
  const classesOnDay = getClassesForDate(selectedDate, timetable, events);

  // Default: all classes on the day are selected to be skipped
  const [skippedClassIds, setSkippedClassIds] = useState<string[]>(() =>
    classesOnDay.map((c) => c.id)
  );

  // Sync skipped class selection when date changes
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const newDayClasses = getClassesForDate(newDate, timetable, events);
    setSkippedClassIds(newDayClasses.map((c) => c.id));
  };

  const toggleClassSkip = (id: string) => {
    setSkippedClassIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllClasses = () => {
    setSkippedClassIds(classesOnDay.map((c) => c.id));
  };

  const deselectAllClasses = () => {
    setSkippedClassIds([]);
  };

  const skipEvaluation = evaluateMultiClassSkip(
    selectedDate,
    skippedClassIds,
    subjects,
    timetable,
    events,
    globalTarget
  );

  const { isBlackout, event } = isAcademicBlackoutDate(selectedDate, events);
  const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

  return (
    <div className="space-y-8">
      {/* Header card */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 text-white rounded-3xl p-6 lg:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-amber-200" />
              <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight">
                Signature "Can I Skip?" Class Simulator
              </h2>
            </div>
            <p className="text-xs lg:text-sm text-amber-100 mt-1 max-w-2xl font-medium">
              Select any target date and check specific scheduled sessions to simulate partial or full day skips with exact mathematical precision.
            </p>
          </div>

          {/* Date Picker */}
          <div className="flex items-center space-x-3.5 bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
            <CalendarIcon className="w-6 h-6 text-amber-200" />
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-bold text-amber-200">Select Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent text-sm lg:text-base font-extrabold text-white focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Date Information & Scheduled Class Toggle Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="px-3 py-1 rounded-full text-xs lg:text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {dayOfWeek}
              </span>
            </div>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Target Threshold: <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{globalTarget}%</strong>
            </p>
          </div>

          {/* Status / Blackout Pill */}
          {isWeekend || isBlackout ? (
            <div className="px-5 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 flex items-center space-x-2.5 text-amber-800 dark:text-amber-300 text-xs lg:text-sm font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>{isWeekend ? `Weekend (${dayOfWeek})` : `${event?.name} (${event?.startDate} to ${event?.endDate})`}</span>
            </div>
          ) : (
            <div className="px-5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs lg:text-sm font-bold">
              {classesOnDay.length} {classesOnDay.length === 1 ? 'Class' : 'Classes'} Scheduled ({skippedClassIds.length} Selected to Skip)
            </div>
          )}
        </div>

        {/* Interactive Class Selector List for the Day */}
        {!isWeekend && !isBlackout && classesOnDay.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Toggle Specific Classes to Skip:
              </span>
              <div className="flex items-center space-x-3 text-xs lg:text-sm font-bold">
                <button
                  onClick={selectAllClasses}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  onClick={deselectAllClasses}
                  className="text-slate-500 hover:underline"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classesOnDay.map((entry) => {
                const isSkipped = skippedClassIds.includes(entry.id);
                return (
                  <div
                    key={entry.id}
                    onClick={() => toggleClassSkip(entry.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 ${
                      isSkipped
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isSkipped ? (
                      <CheckSquare className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm">{entry.subjectCode}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/60 dark:bg-slate-900/60 border">
                          {entry.type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{entry.startTime} - {entry.endTime}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* If Blackout Date */}
      {isWeekend || isBlackout ? (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-3xl p-10 border border-amber-200/80 dark:border-amber-900/40 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-lg lg:text-xl font-bold text-amber-900 dark:text-amber-200">
            No Scheduled Regular Classes on this Date
          </h3>
          <p className="text-xs lg:text-sm text-amber-700 dark:text-amber-400 max-w-lg mx-auto mt-1 font-medium">
            {skipEvaluation.blackoutReason}
          </p>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-4 font-semibold">
            Skipping this day has <strong>0 impact</strong> on your attendance records!
          </p>
        </div>
      ) : (
        <>
          {/* Aggregate Impact Banner */}
          <div className="p-6 lg:p-7 rounded-3xl bg-indigo-900 text-white border border-indigo-800 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3">
              <span className="text-xs lg:text-sm font-extrabold uppercase tracking-wider text-indigo-200">
                AGGREGATE IMPACT
              </span>
              <span className="text-xs font-bold text-indigo-300">
                Overall Target: {globalTarget}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
              <div>
                <span className="text-xs text-indigo-300 block font-semibold">Current Aggregate</span>
                <span className="text-2xl lg:text-3xl font-black">{skipEvaluation.currentAggregatePercentage.toFixed(2)}%</span>
              </div>

              <div>
                <span className="text-xs text-indigo-300 block font-semibold">Projected After Skip</span>
                <span className="text-2xl lg:text-3xl font-black">{skipEvaluation.afterSkipAggregatePercentage.toFixed(2)}%</span>
              </div>

              <div>
                <span className="text-xs text-indigo-300 block font-semibold">Overall Target</span>
                <span className="text-2xl lg:text-3xl font-black">{globalTarget}%</span>
              </div>

              <div>
                <span className="text-xs text-indigo-300 block font-semibold">Aggregate Status</span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold mt-1 ${
                    skipEvaluation.aggregateBuffer >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}
                >
                  {skipEvaluation.aggregateBuffer >= 0
                    ? `Above target by ${skipEvaluation.aggregateBuffer.toFixed(2)} % pts`
                    : `Below target by ${Math.abs(skipEvaluation.aggregateBuffer).toFixed(2)} % pts`}
                </span>
              </div>
            </div>
          </div>

          {/* Post-Skip Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6">
            <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
              <div>
                <span className="text-xs lg:text-sm font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                  Safe After Skip
                </span>
                <div className="text-3xl lg:text-4xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
                  {skipEvaluation.summary.safeCount} subjects
                </div>
              </div>
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>

            <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
              <div>
                <span className="text-xs lg:text-sm font-bold text-amber-700 dark:text-amber-300 uppercase">
                  At Risk After Skip
                </span>
                <div className="text-3xl lg:text-4xl font-black text-amber-900 dark:text-amber-100 mt-1">
                  {skipEvaluation.summary.warningCount} subjects
                </div>
              </div>
              <AlertTriangle className="w-9 h-9 text-amber-500" />
            </div>

            <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
              <div>
                <span className="text-xs lg:text-sm font-bold text-rose-700 dark:text-rose-300 uppercase">
                  Below Target After Skip
                </span>
                <div className="text-3xl lg:text-4xl font-black text-rose-900 dark:text-rose-100 mt-1">
                  {skipEvaluation.summary.dangerCount} subjects
                </div>
              </div>
              <ShieldAlert className="w-9 h-9 text-rose-500" />
            </div>
          </div>

          {/* Affected Subjects Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm lg:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Subject-by-Subject Skip Simulation Breakdown
              </h3>
              <span className="text-xs text-slate-400 font-semibold">
                Simulating {skippedClassIds.length} missed sessions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs lg:text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-extrabold text-xs text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-7 py-4">Subject</th>
                    <th className="px-7 py-4">Skipped on Day</th>
                    <th className="px-7 py-4">Current %</th>
                    <th className="px-7 py-4">After Skip %</th>
                    <th className="px-7 py-4">Impact</th>
                    <th className="px-7 py-4">Resulting Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                  {skipEvaluation.affectedSubjects.map((item) => {
                    const diff = item.afterSkipPercentage - item.currentPercentage;
                    const skippedCount = classesOnDay
                      .filter((c) => c.subjectCode === item.subjectCode && skippedClassIds.includes(c.id))
                      .length;

                    return (
                      <tr key={item.subjectCode} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-7 py-5">
                          <div className="font-extrabold text-slate-900 dark:text-white text-base">
                            {item.subjectCode}
                          </div>
                          <div className="text-xs text-slate-400 font-medium">{item.subjectName}</div>
                        </td>

                        <td className="px-7 py-5">
                          {skippedCount > 0 ? (
                            <span className="px-3 py-1 rounded-lg font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs lg:text-sm">
                              {skippedCount} {skippedCount === 1 ? 'session' : 'sessions'}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">0 skipped</span>
                          )}
                        </td>

                        <td className="px-7 py-5 font-bold">
                          {item.currentPercentage.toFixed(2)}%
                          <span className="text-xs block text-slate-400 font-normal">
                            ({item.currentAttended}/{item.currentDelivered})
                          </span>
                        </td>

                        <td className="px-7 py-5 font-extrabold text-slate-900 dark:text-white text-sm lg:text-base">
                          {item.afterSkipPercentage.toFixed(2)}%
                          <span className="text-xs block text-slate-400 font-normal">
                            ({item.afterSkipAttended}/{item.afterSkipDelivered})
                          </span>
                        </td>

                        <td className="px-7 py-5">
                          {skippedCount > 0 ? (
                            <span className="font-black text-rose-600 dark:text-rose-400">
                              {diff.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">No change</span>
                          )}
                        </td>

                        <td className="px-7 py-5">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              item.subjectMinimumAttendance === null
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                : item.afterSkipStatus === 'danger'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : item.afterSkipStatus === 'warning'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {item.subjectMinimumAttendance === null
                              ? 'No Target Configured'
                              : item.afterSkipStatus === 'danger'
                              ? 'Below Target'
                              : item.afterSkipStatus === 'warning'
                              ? 'At Risk'
                              : 'Safe Buffer'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
