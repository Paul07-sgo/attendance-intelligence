import React, { useEffect, useRef } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { ClassOccurrence, Subject, ResolvedOutcome } from '../types';

interface AttendanceConfirmationModalProps {
  occurrence: ClassOccurrence;
  subject?: Subject;
  onResolve: (occurrenceId: string, outcome: ResolvedOutcome) => void;
  onLater: (occurrenceId: string) => void;
}

export const AttendanceConfirmationModal: React.FC<AttendanceConfirmationModalProps> = ({
  occurrence,
  subject,
  onResolve,
  onLater,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus the primary button when modal opens for keyboard navigation
    yesButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onLater(occurrence.id);
      } else if (e.key === '1') {
        onResolve(occurrence.id, 'PRESENT');
      } else if (e.key === '2') {
        onResolve(occurrence.id, 'ABSENT');
      } else if (e.key === '3') {
        onResolve(occurrence.id, 'NOT_DELIVERED');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [occurrence.id, onLater, onResolve]);

  const subjectTitle = subject ? `${subject.code} · ${subject.name}` : occurrence.subjectCode;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-xs transition-opacity motion-reduce:transition-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-confirmation-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none"
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
              Attendance Confirmation
            </span>
            <span className="text-xs text-slate-400 font-medium flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{occurrence.date}</span>
            </span>
          </div>

          <h3
            id="attendance-confirmation-title"
            className="text-xl font-extrabold text-slate-900 dark:text-white mt-2.5 tracking-tight"
          >
            {subjectTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
            Class ended · {occurrence.startTime}–{occurrence.endTime}
            {occurrence.room ? ` · ${occurrence.room}` : ''}
          </p>
        </div>

        {/* Question */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Did you attend?
          </p>
        </div>

        {/* 3 Outcome Buttons */}
        <div className="space-y-2.5">
          <button
            ref={yesButtonRef}
            onClick={() => onResolve(occurrence.id, 'PRESENT')}
            className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4.5 h-4.5" />
            <span>Yes, I attended</span>
          </button>

          <button
            onClick={() => onResolve(occurrence.id, 'ABSENT')}
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-sm shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <XCircle className="w-4.5 h-4.5 text-rose-500" />
            <span>No, I was absent</span>
          </button>

          <button
            onClick={() => onResolve(occurrence.id, 'NOT_DELIVERED')}
            className="w-full py-3 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-bold text-sm shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <AlertCircle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
            <span>Lecture not delivered</span>
          </button>
        </div>

        {/* Later Action */}
        <div className="pt-2 text-center">
          <button
            onClick={() => onLater(occurrence.id)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-1 px-3 focus:outline-none focus:underline cursor-pointer"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};
