import React, { useState } from 'react';
import { X, Save, Trash2, AlertCircle } from 'lucide-react';
import type { Subject } from '../types';

interface SubjectManagerModalProps {
  subjects: Subject[];
  editingSubjectCode?: string | null;
  onSaveSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
  onClose: () => void;
}

export const SubjectManagerModal: React.FC<SubjectManagerModalProps> = ({
  subjects,
  editingSubjectCode,
  onSaveSubject,
  onDeleteSubject,
  onClose,
}) => {
  const existingSubject = subjects.find((s) => s.code === editingSubjectCode);

  const [code, setCode] = useState(existingSubject?.code || '');
  const [name, setName] = useState(existingSubject?.name || '');
  const [faculty, setFaculty] = useState(existingSubject?.faculty || '');
  const [attended, setAttended] = useState<number>(existingSubject?.attended ?? 0);
  const [delivered, setDelivered] = useState<number>(existingSubject?.delivered ?? 0);
  const initialTarget = existingSubject?.subjectMinimumAttendance ?? existingSubject?.targetOverride ?? null;
  const [useCustomTarget, setUseCustomTarget] = useState<boolean>(initialTarget !== null);
  const [targetOverride, setTargetOverride] = useState<number>(initialTarget ?? 75);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validations
    if (!code.trim()) {
      setErrorMsg('Course code is required.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Subject name is required.');
      return;
    }
    if (attended < 0 || delivered < 0) {
      setErrorMsg('Attended and Delivered classes cannot be negative.');
      return;
    }
    if (attended > delivered) {
      setErrorMsg('Classes attended cannot exceed total classes delivered!');
      return;
    }

    const updatedSubject: Subject = {
      id: existingSubject?.id || `subj-${code.toLowerCase()}-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      faculty: faculty.trim() || 'N/A',
      attended,
      delivered,
      subjectMinimumAttendance: useCustomTarget ? targetOverride : null,
    };

    onSaveSubject(updatedSubject);
    onClose();
  };

  const handleDelete = () => {
    if (existingSubject) {
      onDeleteSubject(existingSubject.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-900 text-white dark:bg-slate-950 border-b border-indigo-800 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center space-x-2">
            {existingSubject ? (
              <span>Edit Subject — {existingSubject.code}</span>
            ) : (
              <span>Add New Subject</span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Course Code *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CSE205"
                className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Faculty Name
              </label>
              <input
                type="text"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                placeholder="e.g. Aryan Tyagi"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Data Structures and Algorithms"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Classes Attended *
              </label>
              <input
                type="number"
                min={0}
                value={attended}
                onChange={(e) => setAttended(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Total Classes Delivered *
              </label>
              <input
                type="number"
                min={0}
                value={delivered}
                onChange={(e) => setDelivered(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Subject Specific Target */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Subject Minimum Attendance Target
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setUseCustomTarget(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    !useCustomTarget
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  None
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomTarget(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    useCustomTarget
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Custom Target
                </button>
              </div>
            </div>

            {useCustomTarget ? (
              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="number"
                  min={50}
                  max={100}
                  step={0.5}
                  value={targetOverride}
                  onChange={(e) => setTargetOverride(parseFloat(e.target.value) || 75)}
                  className="w-24 px-3 py-1.5 font-bold text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-indigo-600 dark:text-indigo-400"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Target for this subject only. Independent of global target.
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1">
                No individual subject target configured for this subject.
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {existingSubject ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors flex items-center space-x-1"
              >
                <Save className="w-4 h-4" />
                <span>Save Subject</span>
              </button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-10">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 text-center space-y-3 max-w-xs shadow-xl">
              <Trash2 className="w-8 h-8 text-rose-500 mx-auto" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Delete Subject?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete <strong>{code}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-center space-x-2 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
