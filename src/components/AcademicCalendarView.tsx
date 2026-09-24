import React from 'react';
import { CalendarCheck2, AlertOctagon } from 'lucide-react';
import type { AcademicEvent } from '../types';

interface AcademicCalendarViewProps {
  events: AcademicEvent[];
  baselineDate: string;
  termEndDate: string;
}

export const AcademicCalendarView: React.FC<AcademicCalendarViewProps> = ({ events }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Academic Calendar & Blackout Rules</h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              Autumn Term / Term-I Session 2026-27 • Section K3P25UG
            </p>
          </div>
        </div>
      </div>

      {/* Important Engine Rule Alert */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start space-x-3 text-amber-900 dark:text-amber-200">
        <AlertOctagon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <strong className="font-bold text-sm block">Deterministic Calendar Blackout Rule:</strong>
          <p>
            The Attendance Engine <strong>automatically excludes</strong> all examination periods, term breaks, and winter vacations from future scheduled class counts. No fake or hallucinated classes are ever counted during these blackout dates.
          </p>
        </div>
      </div>

      {/* Key Dates Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Official Academic Term Schedule (Session 2026-27)
        </h3>

        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {/* Milestone 1: Commencement */}
          <div className="relative flex items-start space-x-4 pl-8">
            <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
            <div>
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                August 10, 2026 (Monday)
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Commencement of Autumn Term Classes
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official start of regular teaching timetable.
              </p>
            </div>
          </div>

          {/* Milestone 2: Baseline Snapshot Date */}
          <div className="relative flex items-start space-x-4 pl-8">
            <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
            <div>
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                September 24, 2026 (Thursday) — Current Baseline
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Known Attendance Snapshot Baseline
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Initial attendance state loaded for all 7 subjects (CSE202, CSE205, CSE276, CSE306, INT335, MTH401, PEL132).
              </p>
            </div>
          </div>

          {/* Academic Events / Blackouts */}
          {events.map((evt) => (
            <div key={evt.id} className="relative flex items-start space-x-4 pl-8">
              <div
                className={`absolute left-1.5 top-1 w-4 h-4 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                  evt.type === 'exam'
                    ? 'bg-rose-500'
                    : evt.type === 'break'
                    ? 'bg-amber-500'
                    : 'bg-purple-500'
                }`}
              />
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {evt.name}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    NO REGULAR CLASSES
                  </span>
                </div>
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                  {evt.startDate} to {evt.endDate}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {evt.description}
                </p>
              </div>
            </div>
          ))}

          {/* Close of Term */}
          <div className="relative flex items-start space-x-4 pl-8">
            <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-slate-900 dark:bg-white ring-4 ring-white dark:ring-slate-900" />
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                December 11, 2026 (Friday)
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Close of Autumn Term Teaching
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                End of regular class delivery for Autumn Term 2026-27.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
