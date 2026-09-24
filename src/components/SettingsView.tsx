import React, { useRef, useState } from 'react';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { AppSettings } from '../types';
import { exportAllData, importAllData } from '../utils/storage';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetData: () => void;
  onDataImported: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetData,
  onDataImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleExport = () => {
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
      showToast('Data exported successfully as JSON file!');
    } catch (e) {
      showToast('Failed to export data.', 'error');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importAllData(content);
        if (success) {
          showToast('Data imported successfully!');
          onDataImported();
        } else {
          showToast('Invalid backup JSON file format.', 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    onResetData();
    setShowResetConfirm(false);
    showToast('Reset to original baseline initial dataset successfully!');
  };

  return (
    <div className="grid grid-cols-12 gap-6 lg:gap-8 w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`col-span-12 p-4 rounded-2xl border flex items-center space-x-2 text-xs font-bold shadow-lg transition-all ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950 border-rose-300 text-rose-800 dark:text-rose-200'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Settings Header (Spans 12 cols) */}
      <div className="col-span-12 bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shrink-0">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            System Settings & Data Management
          </h2>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Configure global default targets, export/import backups, or reset system state
          </p>
        </div>
      </div>

      {/* Target & Baseline Settings (Spans 6 cols on desktop) */}
      <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:p-8 space-y-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm lg:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
            Default Attendance Target & Baseline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Configure global default target percentage for aggregate attendance calculations.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div>
              <label className="text-xs lg:text-sm font-extrabold text-slate-900 dark:text-white block">
                Overall Target Percentage (%)
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Applies to total attended / total conducted across all subjects
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <input
                type="number"
                min={50}
                max={100}
                step={0.5}
                value={settings.defaultTarget}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    defaultTarget: parseFloat(e.target.value) || 87,
                  })
                }
                className="w-24 px-3.5 py-2 font-black text-lg text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-xs"
              />
              <span className="text-sm font-bold text-slate-400">%</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs lg:text-sm">
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white block">Initial Snapshot Baseline Date</span>
              <span className="text-slate-500 dark:text-slate-400 text-xs">Fixed baseline date for baseline dataset</span>
            </div>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60">
              {settings.baselineDate}
            </span>
          </div>
        </div>
      </div>

      {/* Data Backup, Export & Import (Spans 6 cols on desktop) */}
      <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:p-8 space-y-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm lg:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
            Data Backup & Portability
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Export a full JSON state snapshot or restore from a previously created backup file.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-extrabold text-sm">
                <Download className="w-4.5 h-4.5 text-indigo-500" />
                <span>Export JSON Backup</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Save a local JSON backup of all subjects, timetable entries, and system settings.
              </p>
            </div>
            <button
              onClick={handleExport}
              className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Import */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-extrabold text-sm">
                <Upload className="w-4.5 h-4.5 text-emerald-500" />
                <span>Import JSON Backup</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Restore subjects, attendance history, and timetable from an exported JSON file.
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload JSON File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Section (Spans 12 cols) */}
      <div className="col-span-12 bg-rose-50/60 dark:bg-rose-950/20 rounded-3xl border border-rose-200/80 dark:border-rose-900/40 p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-rose-900 dark:text-rose-200 flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-rose-600" />
            <span>Reset System State</span>
          </h3>
          <p className="text-xs lg:text-sm text-rose-700 dark:text-rose-300 mt-1 font-medium">
            Wipes custom edits and restores the original 7 subjects baseline (Sep 24, 2026), timetable, and 87% default target.
          </p>
        </div>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs lg:text-sm font-bold shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          Reset All Data
        </button>
      </div>

      {/* Reset Confirmation Overlay */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-sm shadow-2xl">
            <RotateCcw className="w-10 h-10 text-rose-500 mx-auto" />
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
              Confirm Factory Reset?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to reset all data to initial defaults? All custom edits will be lost.
            </p>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
