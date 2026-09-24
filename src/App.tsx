import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import type { NavTab } from './components/Header';
import { TargetSelector } from './components/TargetSelector';
import { DashboardSummary } from './components/DashboardSummary';
import { SubjectCard } from './components/SubjectCard';
import { WhatIfCalculator } from './components/WhatIfCalculator';
import { SkipDayCalculator } from './components/SkipDayCalculator';
import { SubjectDetailModal } from './components/SubjectDetailModal';
import { SubjectManagerModal } from './components/SubjectManagerModal';
import { TimetableManager } from './components/TimetableManager';
import { AcademicCalendarView } from './components/AcademicCalendarView';
import { SettingsView } from './components/SettingsView';
import { CommandPalette } from './components/CommandPalette';
import { AttendanceConfirmationModal } from './components/AttendanceConfirmationModal';

import type {
  Subject,
  TimetableEntry,
  AcademicEvent,
  AppSettings,
  SubjectCalculation,
  ClassOccurrence,
  ResolvedOutcome,
} from './types';
import { calculateSubjectStats } from './utils/attendanceEngine';
import { countFutureClassesForSubject, formatISODate } from './utils/calendarEngine';
import { reconcileOccurrences, getEffectiveSubjects } from './utils/occurrenceEngine';
import {
  loadSubjects,
  saveSubjects,
  loadTimetable,
  saveTimetable,
  loadAcademicEvents,
  saveAcademicEvents,
  loadSettings,
  saveSettings,
  loadOccurrences,
  saveOccurrences,
  resetToInitialData,
  exportAllData,
} from './utils/storage';

import { Plus, Sparkles, Calendar } from 'lucide-react';

export function App() {
  // State
  const [subjects, setSubjects] = useState<Subject[]>(() => loadSubjects());
  const [timetable, setTimetable] = useState<TimetableEntry[]>(() => loadTimetable());
  const [events, setEvents] = useState<AcademicEvent[]>(() => loadAcademicEvents());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [occurrences, setOccurrences] = useState<Record<string, ClassOccurrence>>(() => loadOccurrences());

  // Real-time dynamic clock
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  // Session-dismissed pending occurrence IDs (when clicking "Later")
  const [dismissedPendingIds, setDismissedPendingIds] = useState<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Modals state
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string | null>(null);
  const [editingSubjectCode, setEditingSubjectCode] = useState<string | null>(null);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Interval timer for real-world dynamic time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Sync settings to localStorage and HTML root element
  useEffect(() => {
    saveSettings(settings);
    localStorage.setItem('attendance-theme', settings.theme);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [settings]);

  // Sync subjects to localStorage
  useEffect(() => {
    saveSubjects(subjects);
  }, [subjects]);

  // Sync timetable to localStorage
  useEffect(() => {
    saveTimetable(timetable);
  }, [timetable]);

  // Sync events to localStorage
  useEffect(() => {
    saveAcademicEvents(events);
  }, [events]);

  // Sync occurrences to localStorage
  useEffect(() => {
    saveOccurrences(occurrences);
  }, [occurrences]);

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const handleGlobalTargetChange = (newTarget: number) => {
    setSettings((prev) => ({ ...prev, defaultTarget: newTarget }));
  };

  // Reconcile class occurrences up to current date/time
  const allOccurrences = useMemo(() => {
    return reconcileOccurrences(
      settings.baselineDate,
      timetable,
      events,
      occurrences,
      currentTime
    );
  }, [settings.baselineDate, timetable, events, occurrences, currentTime]);

  // Compute effective subjects by applying resolved outcomes onto baseline
  const effectiveSubjects = useMemo(() => {
    return getEffectiveSubjects(subjects, occurrences);
  }, [subjects, occurrences]);

  // Compute stats for all effective subjects
  const subjectStats: SubjectCalculation[] = useMemo(() => {
    return effectiveSubjects.map((subj) => {
      const futureClasses = countFutureClassesForSubject(
        subj.code,
        settings.baselineDate,
        settings.termEndDate,
        timetable,
        events
      );
      return calculateSubjectStats(subj, settings.defaultTarget, futureClasses);
    });
  }, [effectiveSubjects, settings.defaultTarget, settings.baselineDate, settings.termEndDate, timetable, events]);

  // Find all pending attendance occurrences
  const pendingOccurrences = useMemo(() => {
    return allOccurrences.filter((occ) => occ.status === 'ATTENDANCE_PENDING');
  }, [allOccurrences]);

  // Find active pending occurrence that hasn't been dismissed with "Later" in this session
  const activePendingOccurrence = useMemo(() => {
    return pendingOccurrences.find((occ) => !dismissedPendingIds.has(occ.id)) || null;
  }, [pendingOccurrences, dismissedPendingIds]);

  // Handlers for occurrence confirmation
  const handleResolveOccurrence = (occurrenceId: string, outcome: ResolvedOutcome) => {
    setOccurrences((prev) => ({
      ...prev,
      [occurrenceId]: {
        ...(allOccurrences.find((o) => o.id === occurrenceId) || {
          id: occurrenceId,
          subjectCode: occurrenceId.split('-')[0],
          date: formatISODate(currentTime),
          startTime: '00:00',
          endTime: '00:00',
          type: 'Lecture',
          status: outcome,
        }),
        status: outcome,
        resolvedAt: new Date().toISOString(),
      },
    }));

    setDismissedPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(occurrenceId);
      return next;
    });
  };

  const handleLaterOccurrence = (occurrenceId: string) => {
    setDismissedPendingIds((prev) => {
      const next = new Set(prev);
      next.add(occurrenceId);
      return next;
    });
  };

  const handleOpenPendingConfirmation = () => {
    setDismissedPendingIds(new Set());
  };

  // Selected subject calculation for detail modal
  const selectedCalc = useMemo(() => {
    if (!selectedSubjectCode) return null;
    return subjectStats.find((s) => s.subject.code === selectedSubjectCode) || null;
  }, [selectedSubjectCode, subjectStats]);

  // Handlers for subject CRUD
  const handleSaveSubject = (updated: Subject) => {
    setSubjects((prev) => {
      const idx = prev.findIndex((s) => s.id === updated.id || s.code === updated.code);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
  };

  // Handlers for Timetable CRUD
  const handleSaveTimetableEntry = (entry: TimetableEntry) => {
    setTimetable((prev) => {
      const idx = prev.findIndex((t) => t.id === entry.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = entry;
        return next;
      }
      return [...prev, entry];
    });
  };

  const handleDeleteTimetableEntry = (entryId: string) => {
    setTimetable((prev) => prev.filter((t) => t.id !== entryId));
  };

  // Reset handler
  const handleReset = () => {
    resetToInitialData();
    setSubjects(loadSubjects());
    setTimetable(loadTimetable());
    setEvents(loadAcademicEvents());
    setSettings(loadSettings());
    setOccurrences(loadOccurrences());
    setDismissedPendingIds(new Set());
  };

  // Refresh handler after JSON import
  const handleDataImported = () => {
    setSubjects(loadSubjects());
    setTimetable(loadTimetable());
    setEvents(loadAcademicEvents());
    setSettings(loadSettings());
    setOccurrences(loadOccurrences());
    setDismissedPendingIds(new Set());
  };

  // Export JSON backup handler
  const handleExportData = () => {
    try {
      const jsonString = exportAllData();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_intelligence_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const currentDateStr = formatISODate(currentTime);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* App Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={settings.theme}
        toggleTheme={toggleTheme}
        globalTarget={settings.defaultTarget}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-none px-[clamp(24px,2.5vw,48px)] py-8 space-y-8">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Global Target Selector */}
            <TargetSelector
              target={settings.defaultTarget}
              setTarget={handleGlobalTargetChange}
            />

            {/* Dashboard Summary Hero & Intelligence Cards */}
            <DashboardSummary
              stats={subjectStats}
              overallTarget={settings.defaultTarget}
              baselineDate={settings.baselineDate}
              timetable={timetable}
              events={events}
              onOpenSkipSimulator={() => setActiveTab('skip-day')}
              currentDateStr={currentDateStr}
              pendingOccurrencesCount={pendingOccurrences.length}
              onOpenPendingConfirmation={handleOpenPendingConfirmation}
            />

            {/* Quick Shortcuts */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto py-2">
              <div className="text-xs lg:text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Quick Shortcuts
              </div>
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => setActiveTab('skip-day')}
                  className="px-4 py-2.5 rounded-2xl text-xs lg:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors flex items-center space-x-2 whitespace-nowrap"
                >
                  <Sparkles className="w-4.5 h-4.5 text-amber-200" />
                  <span>"Can I Skip?" Simulator</span>
                </button>
                <button
                  onClick={() => setIsAddSubjectOpen(true)}
                  className="px-4 py-2.5 rounded-2xl text-xs lg:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors flex items-center space-x-2 whitespace-nowrap"
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span>Add Subject</span>
                </button>
                <button
                  onClick={() => setActiveTab('timetable')}
                  className="px-4 py-2.5 rounded-2xl text-xs lg:text-sm font-bold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-sm transition-colors flex items-center space-x-2 whitespace-nowrap"
                >
                  <Calendar className="w-4.5 h-4.5" />
                  <span>View Timetable</span>
                </button>
              </div>
            </div>

            {/* Subjects Grid Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Subject Attendance Summary ({subjectStats.length})
                </h2>
                <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Subject attendance records & optional subject-specific minimum targets
                </p>
              </div>

              <button
                onClick={() => setIsAddSubjectOpen(true)}
                className="text-xs lg:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subject</span>
              </button>
            </div>

            {/* Subject Cards Grid - 12-column desktop grid with 4+3 layout for 7 subjects */}
            <div className="grid grid-cols-12 gap-6 lg:gap-8">
              {subjectStats.map((calc, idx) => (
                <SubjectCard
                  key={calc.subject.id}
                  calc={calc}
                  onSelectSubject={(code) => setSelectedSubjectCode(code)}
                  onEditSubject={(code) => setEditingSubjectCode(code)}
                  className={
                    subjectStats.length === 7
                      ? idx < 4
                        ? 'col-span-12 md:col-span-6 xl:col-span-3'
                        : 'col-span-12 md:col-span-6 xl:col-span-4'
                      : 'col-span-12 md:col-span-6 lg:col-span-4'
                  }
                />
              ))}
            </div>

            {/* Interactive ⚡ Attendance Simulator on Dashboard */}
            <WhatIfCalculator stats={subjectStats} overallTarget={settings.defaultTarget} />
          </div>
        )}

        {/* SUBJECTS TAB */}
        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white">
                  Enrolled Subjects ({subjectStats.length})
                </h2>
                <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Manage course codes, faculty, attended/delivered classes, or individual subject minimum targets
                </p>
              </div>
              <button
                onClick={() => setIsAddSubjectOpen(true)}
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs lg:text-sm shadow-sm flex items-center space-x-2"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Add New Subject</span>
              </button>
            </div>

            <div className="grid grid-cols-12 gap-6 lg:gap-8">
              {subjectStats.map((calc, idx) => (
                <SubjectCard
                  key={calc.subject.id}
                  calc={calc}
                  onSelectSubject={(code) => setSelectedSubjectCode(code)}
                  onEditSubject={(code) => setEditingSubjectCode(code)}
                  className={
                    subjectStats.length === 7
                      ? idx < 4
                        ? 'col-span-12 md:col-span-6 xl:col-span-3'
                        : 'col-span-12 md:col-span-6 xl:col-span-4'
                      : 'col-span-12 md:col-span-6 lg:col-span-4'
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* SKIP DAY TAB */}
        {activeTab === 'skip-day' && (
          <SkipDayCalculator
            subjects={effectiveSubjects}
            timetable={timetable}
            events={events}
            globalTarget={settings.defaultTarget}
            baselineDate={settings.baselineDate}
          />
        )}

        {/* TIMETABLE TAB */}
        {activeTab === 'timetable' && (
          <TimetableManager
            timetable={timetable}
            subjects={effectiveSubjects}
            onSaveTimetableEntry={handleSaveTimetableEntry}
            onDeleteTimetableEntry={handleDeleteTimetableEntry}
          />
        )}

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <AcademicCalendarView
            events={events}
            baselineDate={settings.baselineDate}
            termEndDate={settings.termEndDate}
          />
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onResetData={handleReset}
            onDataImported={handleDataImported}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 py-6 bg-white dark:bg-slate-900 transition-colors">
        <div className="w-full max-w-none px-[clamp(24px,2.5vw,48px)] flex flex-col sm:flex-row items-center justify-between text-xs lg:text-sm text-slate-500 dark:text-slate-400 gap-2 font-medium">
          <div>
            <strong className="text-slate-900 dark:text-white font-extrabold">Attendance Intelligence</strong> • Production Personal College OS
          </div>
          <div>
            Baseline: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">Sep 24, 2026</span> • Section K3P25UG
          </div>
        </div>
      </footer>

      {/* Confirmation Modal Popup for Pending Class Occurrences */}
      {activePendingOccurrence && (
        <AttendanceConfirmationModal
          occurrence={activePendingOccurrence}
          subject={subjects.find((s) => s.code === activePendingOccurrence.subjectCode)}
          onResolve={handleResolveOccurrence}
          onLater={handleLaterOccurrence}
        />
      )}

      {/* Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        setActiveTab={setActiveTab}
        subjectStats={subjectStats}
        onSelectSubject={(code) => setSelectedSubjectCode(code)}
        onSetGlobalTarget={handleGlobalTargetChange}
        toggleTheme={toggleTheme}
        theme={settings.theme}
        onExportData={handleExportData}
        onResetData={handleReset}
      />

      {selectedCalc && (
        <SubjectDetailModal
          calc={selectedCalc}
          timetable={timetable}
          events={events}
          baselineDate={settings.baselineDate}
          termEndDate={settings.termEndDate}
          onClose={() => setSelectedSubjectCode(null)}
          onEdit={() => {
            const code = selectedCalc.subject.code;
            setSelectedSubjectCode(null);
            setEditingSubjectCode(code);
          }}
        />
      )}

      {(editingSubjectCode || isAddSubjectOpen) && (
        <SubjectManagerModal
          subjects={subjects}
          editingSubjectCode={editingSubjectCode}
          onSaveSubject={handleSaveSubject}
          onDeleteSubject={handleDeleteSubject}
          onClose={() => {
            setEditingSubjectCode(null);
            setIsAddSubjectOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default App;

