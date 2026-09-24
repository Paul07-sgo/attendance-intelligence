import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, MapPin, Calendar, X, Save } from 'lucide-react';
import type { TimetableEntry, DayOfWeek, ClassType, Subject } from '../types';

interface TimetableManagerProps {
  timetable: TimetableEntry[];
  subjects: Subject[];
  onSaveTimetableEntry: (entry: TimetableEntry) => void;
  onDeleteTimetableEntry: (entryId: string) => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TimetableManager: React.FC<TimetableManagerProps> = ({
  timetable,
  subjects,
  onSaveTimetableEntry,
  onDeleteTimetableEntry,
}) => {
  const [activeDay, setActiveDay] = useState<DayOfWeek>('Monday');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  // Form states
  const [day, setDay] = useState<DayOfWeek>('Monday');
  const [startTime, setStartTime] = useState<string>('09:20');
  const [endTime, setEndTime] = useState<string>('10:10');
  const [subjectCode, setSubjectCode] = useState<string>(subjects[0]?.code || 'CSE205');
  const [type, setType] = useState<ClassType>('Lecture');
  const [room, setRoom] = useState<string>('');
  const [group, setGroup] = useState<string>('');

  const openAddModal = (dayForNew?: DayOfWeek) => {
    setEditingEntry(null);
    setDay(dayForNew || activeDay);
    setStartTime('09:20');
    setEndTime('10:10');
    setSubjectCode(subjects[0]?.code || 'CSE205');
    setType('Lecture');
    setRoom('');
    setGroup('');
    setModalOpen(true);
  };

  const openEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setDay(entry.day);
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setSubjectCode(entry.subjectCode);
    setType(entry.type);
    setRoom(entry.room || '');
    setGroup(entry.group || '');
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: TimetableEntry = {
      id: editingEntry?.id || `tt-${day.toLowerCase().slice(0, 3)}-${Date.now()}`,
      day,
      startTime,
      endTime,
      subjectCode: subjectCode.trim().toUpperCase(),
      type,
      room: room.trim() || undefined,
      group: group.trim() || undefined,
    };
    onSaveTimetableEntry(entry);
    setModalOpen(false);
  };

  const currentDayClasses = timetable
    .filter((t) => t.day === activeDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-8">
      {/* Header & Day selector */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Academic Timetable Editor</span>
          </h2>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Section K3P25UG • Add, edit, or delete regular weekly class sessions
          </p>
        </div>

        <button
          onClick={() => openAddModal()}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs lg:text-sm font-bold shadow-sm transition-colors flex items-center space-x-2 self-start md:self-auto"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Add Timetable Class</span>
        </button>
      </div>

      {/* Day Tabs */}
      <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 scrollbar-none">
        {DAYS.map((d) => {
          const count = timetable.filter((t) => t.day === d).length;
          const isActive = activeDay === d;
          return (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`px-5 py-3 rounded-2xl text-xs lg:text-sm font-bold transition-all flex items-center space-x-2.5 whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{d}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Class Schedule Grid for Active Day */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:p-8">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm lg:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            {activeDay} Schedule ({currentDayClasses.length} sessions)
          </h3>
          <button
            onClick={() => openAddModal(activeDay)}
            className="text-xs lg:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add class to {activeDay}</span>
          </button>
        </div>

        {currentDayClasses.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <p className="text-base font-semibold">No classes scheduled on {activeDay}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {currentDayClasses.map((item) => {
              const subj = subjects.find((s) => s.code === item.subjectCode);
              return (
                <div
                  key={item.id}
                  className="p-5 lg:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-lg lg:text-xl text-slate-900 dark:text-white tracking-tight">
                        {item.subjectCode}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                          item.type === 'Practical'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            : item.type === 'Tutorial'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    {subj && (
                      <p className="text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                        {subj.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs lg:text-sm text-slate-600 dark:text-slate-300 font-semibold">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>
                        {item.startTime} - {item.endTime}
                      </span>
                    </div>
                    {item.room && (
                      <div className="flex items-center space-x-2 text-slate-400 font-normal">
                        <MapPin className="w-4 h-4" />
                        <span>Room: {item.room}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTimetableEntry(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Timetable Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-indigo-900 text-white dark:bg-slate-950 border-b border-indigo-800 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingEntry ? 'Edit Class Entry' : 'Add Timetable Class'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Day of Week
                </label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value as DayOfWeek)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Subject
                </label>
                <select
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.code}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Start Time (HH:mm)
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    End Time (HH:mm)
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Session Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ClassType)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                >
                  <option value="Lecture">Lecture</option>
                  <option value="Tutorial">Tutorial</option>
                  <option value="Practical">Practical</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
