import React, { useState } from 'react';
import { X, User, Calendar, TrendingUp, Clock } from 'lucide-react';
import type { SubjectCalculation, TimetableEntry, AcademicEvent } from '../types';
import { getUpcomingClassesForSubject } from '../utils/calendarEngine';
import { calculateWhatIfMiss, calculateWhatIfAttend, getAttendanceStatus } from '../utils/attendanceEngine';

interface SubjectDetailModalProps {
  calc: SubjectCalculation;
  timetable: TimetableEntry[];
  events: AcademicEvent[];
  baselineDate: string;
  termEndDate: string;
  onClose: () => void;
  onEdit: () => void;
}

export const SubjectDetailModal: React.FC<SubjectDetailModalProps> = ({
  calc,
  timetable,
  events,
  baselineDate,
  termEndDate,
  onClose,
  onEdit,
}) => {
  const { subject, subjectMinimumAttendance, currentPercentage, status, classesCanMiss, classesNeededToRecover } =
    calc;

  const hasSubjectTarget = subjectMinimumAttendance !== null;

  const [missInput, setMissInput] = useState<number>(1);
  const [attendInput, setAttendInput] = useState<number>(3);

  // Fetch all upcoming scheduled classes up to term end
  const upcomingClasses = getUpcomingClassesForSubject(
    subject.code,
    baselineDate,
    termEndDate,
    timetable,
    events
  );

  // What-if miss projection
  const projectedMissPct = calculateWhatIfMiss(subject.attended, subject.delivered, missInput);

  // What-if attend projection
  const projectedAttendPct = calculateWhatIfAttend(subject.attended, subject.delivered, attendInput);

  // Absence Trajectory data (1 to 8 absences)
  const trajectoryRows = Array.from({ length: 8 }, (_, i) => {
    const miss = i + 1;
    const pct = calculateWhatIfMiss(subject.attended, subject.delivered, miss);
    const rowCanMiss = hasSubjectTarget && classesCanMiss !== null ? Math.max(0, classesCanMiss - miss) : null;
    const rowStatus = getAttendanceStatus(pct, subjectMinimumAttendance, rowCanMiss);
    return { miss, pct, rowStatus };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-extrabold tracking-tight">{subject.code}</span>
              <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                {subject.name}
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1 flex items-center space-x-2">
              <User className="w-3.5 h-3.5" />
              <span>Faculty: {subject.faculty}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Edit Subject
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: Current Attendance */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Subject Attendance
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {currentPercentage.toFixed(2)}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {subject.attended} / {subject.delivered} classes • {hasSubjectTarget ? `Target: ${subjectMinimumAttendance}%` : 'No subject target'}
              </div>
            </div>

            {/* Metric 2: Buffer (Classes Can Miss) */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">
                Absence Buffer
              </span>
              <div className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-1">
                {hasSubjectTarget ? `${classesCanMiss} ${classesCanMiss === 1 ? 'Class' : 'Classes'}` : 'N/A'}
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 font-medium">
                {hasSubjectTarget ? `Max misses while remaining ≥ ${subjectMinimumAttendance}%` : 'No individual target configured'}
              </div>
            </div>

            {/* Metric 3: Recovery Needed */}
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase">
                Recovery Needed
              </span>
              <div className="text-3xl font-extrabold text-indigo-900 dark:text-indigo-100 mt-1">
                {!hasSubjectTarget
                  ? 'N/A'
                  : status === 'danger'
                  ? classesNeededToRecover === Infinity
                    ? 'Impossible'
                    : `${classesNeededToRecover} classes`
                  : 'Above Target ✓'}
              </div>
              <div className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 font-medium">
                {!hasSubjectTarget
                  ? 'No individual target configured'
                  : status === 'danger'
                  ? 'Consecutive attendances required'
                  : 'Maintaining subject minimum target'}
              </div>
            </div>
          </div>

          {/* Interactive What-If Section for this subject */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Subject Attendance Simulation</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* If Miss */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30">
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-2">
                  If I miss {missInput} upcoming {missInput === 1 ? 'class' : 'classes'}:
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={missInput}
                    onChange={(e) => setMissInput(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{missInput}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Resulting %:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {projectedMissPct.toFixed(2)}% ({subject.attended} / {subject.delivered + missInput})
                  </span>
                </div>
              </div>

              {/* If Attend */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/30">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  If I attend {attendInput} upcoming {attendInput === 1 ? 'class' : 'classes'}:
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={attendInput}
                    onChange={(e) => setAttendInput(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{attendInput}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Resulting %:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {projectedAttendPct.toFixed(2)}% ({subject.attended + attendInput} / {subject.delivered + attendInput})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Absence Trajectory Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Absence Trajectory Table
              </h4>
              <span className="text-xs text-slate-400">
                {hasSubjectTarget ? `Target: ${subjectMinimumAttendance}%` : 'No subject target'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 uppercase text-[10px] text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Absences</th>
                    <th className="px-4 py-2.5">Delivered</th>
                    <th className="px-4 py-2.5">Projected %</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {trajectoryRows.map((row) => (
                    <tr key={row.miss} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2 font-bold text-slate-900 dark:text-white">
                        + {row.miss} {row.miss === 1 ? 'miss' : 'misses'}
                      </td>
                      <td className="px-4 py-2">
                        {subject.attended} / {subject.delivered + row.miss}
                      </td>
                      <td className="px-4 py-2 font-bold text-slate-900 dark:text-white">
                        {row.pct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            !hasSubjectTarget
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              : row.rowStatus === 'danger'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : row.rowStatus === 'warning'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {!hasSubjectTarget
                            ? 'No Target'
                            : row.rowStatus === 'danger'
                            ? 'Below Target'
                            : row.rowStatus === 'warning'
                            ? 'At Risk'
                            : 'Safe'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Scheduled Classes List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Upcoming Scheduled Classes ({upcomingClasses.length} till term end)</span>
              </h4>
              <span className="text-xs text-slate-400 font-medium">Excludes Midterm & Breaks</span>
            </div>

            {upcomingClasses.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No remaining classes scheduled in current term.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {upcomingClasses.map((item, idx) => (
                  <div
                    key={`${item.date}-${idx}`}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 w-24">
                        {item.date}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 w-20">
                        {item.dayOfWeek}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-semibold text-[10px]">
                        {item.entry.type}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {item.entry.startTime} - {item.entry.endTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
