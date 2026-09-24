import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Calendar,
  CalendarCheck2,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Download,
  RotateCcw,
  Target,
  ArrowRight,
  X,
} from 'lucide-react';
import type { NavTab } from './Header';
import type { SubjectCalculation } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: NavTab) => void;
  subjectStats: SubjectCalculation[];
  onSelectSubject: (code: string) => void;
  onSetGlobalTarget: (target: number) => void;
  toggleTheme: () => void;
  theme: 'light' | 'dark';
  onExportData: () => void;
  onResetData: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  subjectStats,
  onSelectSubject,
  onSetGlobalTarget,
  toggleTheme,
  theme,
  onExportData,
  onResetData,
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener for Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredSubjects = subjectStats.filter(
    (s) =>
      s.subject.code.toLowerCase().includes(query.toLowerCase()) ||
      s.subject.name.toLowerCase().includes(query.toLowerCase()) ||
      s.subject.faculty.toLowerCase().includes(query.toLowerCase())
  );

  const navigationActions = [
    { label: 'Go to Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, tab: 'dashboard' as NavTab },
    { label: 'Go to Can I Skip Day? Simulator', icon: <Sparkles className="w-4 h-4 text-amber-500" />, tab: 'skip-day' as NavTab },
    { label: 'Go to Enrolled Subjects', icon: <BookOpen className="w-4 h-4" />, tab: 'subjects' as NavTab },
    { label: 'Go to Timetable Editor', icon: <Calendar className="w-4 h-4" />, tab: 'timetable' as NavTab },
    { label: 'Go to Academic Term Calendar', icon: <CalendarCheck2 className="w-4 h-4" />, tab: 'calendar' as NavTab },
    { label: 'Go to Settings', icon: <SettingsIcon className="w-4 h-4" />, tab: 'settings' as NavTab },
  ].filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  const presets = [75, 80, 85, 87, 90, 95];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, subject code, or keyword... (Esc to exit)"
            className="w-full bg-transparent text-sm lg:text-base font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Enrolled Subjects Search */}
          {filteredSubjects.length > 0 && (
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 px-2">
                Enrolled Subjects
              </div>
              <div className="space-y-1">
                {filteredSubjects.map((calc) => (
                  <button
                    key={calc.subject.id}
                    onClick={() => {
                      onSelectSubject(calc.subject.code);
                      onClose();
                    }}
                    className="w-full p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/70 flex items-center justify-between text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                        {calc.subject.code.slice(0, 3)}
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                          {calc.subject.code} — {calc.subject.name}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Faculty: {calc.subject.faculty}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        {calc.currentPercentage.toFixed(2)}%
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Navigation Shortcuts */}
          {navigationActions.length > 0 && (
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 px-2">
                Navigation Shortcuts
              </div>
              <div className="space-y-1">
                {navigationActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      setActiveTab(action.tab);
                      onClose();
                    }}
                    className="w-full p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/70 flex items-center space-x-3 text-left transition-colors"
                  >
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {action.icon}
                    </div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Quick Target Preset Action */}
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 px-2">
              Quick Target Presets
            </div>
            <div className="flex flex-wrap gap-2 px-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    onSetGlobalTarget(p);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-all flex items-center space-x-1 text-slate-700 dark:text-slate-300"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Set Target to {p}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: System Actions */}
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 px-2">
              System Actions
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-2">
              <button
                onClick={() => {
                  toggleTheme();
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center space-x-2 text-slate-700 dark:text-slate-300"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                <span>Toggle Theme</span>
              </button>

              <button
                onClick={() => {
                  onExportData();
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center space-x-2 text-slate-700 dark:text-slate-300"
              >
                <Download className="w-4 h-4 text-indigo-500" />
                <span>Export Backup</span>
              </button>

              <button
                onClick={() => {
                  onResetData();
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-xs font-bold flex items-center space-x-2 text-rose-600"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Baseline</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 px-5">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border rounded text-[10px] font-mono font-bold">Ctrl + K</kbd> anytime to open</span>
          <span>Section K3P25UG</span>
        </div>
      </div>
    </div>
  );
};
