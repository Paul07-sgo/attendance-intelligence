import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ChevronRight, User, Edit3, HelpCircle } from 'lucide-react';
import type { SubjectCalculation } from '../types';

interface SubjectCardProps {
  calc: SubjectCalculation;
  onSelectSubject: (subjectCode: string) => void;
  onEditSubject: (subjectCode: string) => void;
  className?: string;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  calc,
  onSelectSubject,
  onEditSubject,
  className = '',
}) => {
  const { subject, subjectMinimumAttendance, currentPercentage, status, classesCanMiss, classesNeededToRecover } =
    calc;

  const hasSubjectTarget = subjectMinimumAttendance !== null;

  const getStatusBadge = () => {
    if (!hasSubjectTarget) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>No Target</span>
        </span>
      );
    }

    switch (status) {
      case 'safe':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Safe Buffer</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>At Risk</span>
          </span>
        );
      case 'danger':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Below Target</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getProgressColor = () => {
    if (!hasSubjectTarget) return 'bg-indigo-600 dark:bg-indigo-500';
    if (status === 'danger') return 'bg-rose-500';
    if (status === 'warning') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-7 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group space-y-5 ${className}`}
    >
      <div>
        {/* Header: Code & Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-black text-xl lg:text-2xl text-slate-900 dark:text-white tracking-tight">
                {subject.code}
              </span>
              {hasSubjectTarget && (
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  Target: {subjectMinimumAttendance}%
                </span>
              )}
            </div>
            <h3 className="text-sm lg:text-base font-semibold text-slate-700 dark:text-slate-200 line-clamp-1 mt-1">
              {subject.name}
            </h3>
          </div>
          {getStatusBadge()}
        </div>

        {/* Faculty info */}
        <div className="flex items-center space-x-2 text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>Faculty: {subject.faculty}</span>
        </div>

        {/* Dominant Attendance Percentage & Counts */}
        <div className="mt-5 flex items-baseline justify-between">
          <div>
            <span className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {currentPercentage.toFixed(2)}%
            </span>
          </div>
          <div className="text-sm lg:text-base font-bold text-slate-800 dark:text-slate-200">
            {subject.attended} / {subject.delivered}
          </div>
        </div>

        {/* Thicker Progress bar */}
        <div className="relative mt-4 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${Math.min(100, currentPercentage)}%` }}
          />
          {hasSubjectTarget && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-slate-900 dark:bg-white z-10 opacity-80"
              style={{ left: `${subjectMinimumAttendance}%` }}
              title={`Target ${subjectMinimumAttendance}%`}
            />
          )}
        </div>

        {/* Output Pill */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          {!hasSubjectTarget ? (
            <div className="text-xs lg:text-sm font-semibold text-slate-500 dark:text-slate-400 italic">
              No individual target configured
            </div>
          ) : status === 'danger' ? (
            <div className="text-xs lg:text-sm font-semibold">
              <span className="text-slate-500 dark:text-slate-400">Classes needed: </span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400">
                {classesNeededToRecover === Infinity ? 'Impossible' : `${classesNeededToRecover} consecutive`}
              </span>
            </div>
          ) : (
            <div className="text-xs lg:text-sm font-semibold">
              <span className="text-slate-500 dark:text-slate-400">Can miss: </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {classesCanMiss} {classesCanMiss === 1 ? 'class' : 'classes'}
              </span>
            </div>
          )}

          <div className="text-xs text-slate-400 font-semibold">
            {calc.totalScheduledFutureClasses > 0 ? `${calc.totalScheduledFutureClasses} upcoming` : ''}
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => onEditSubject(subject.code)}
          className="text-xs lg:text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center space-x-1.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit</span>
        </button>

        <button
          onClick={() => onSelectSubject(subject.code)}
          className="text-xs lg:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 transition-colors"
        >
          <span>View Details</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

