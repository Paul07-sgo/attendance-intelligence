import type { Subject, TimetableEntry, AcademicEvent, AppSettings, ClassOccurrence } from '../types';
import {
  INITIAL_SUBJECTS,
  INITIAL_TIMETABLE,
  INITIAL_ACADEMIC_EVENTS,
  INITIAL_SETTINGS,
} from '../data/initialData';
import { isOccurrenceAfterBaselineCutoff } from './occurrenceEngine';

const KEYS = {
  SUBJECTS: 'attendance_system_subjects_v1',
  TIMETABLE: 'attendance_system_timetable_v1',
  EVENTS: 'attendance_system_events_v1',
  SETTINGS: 'attendance_system_settings_v1',
  OCCURRENCES: 'attendance_system_occurrences_v1',
};

export function loadSubjects(): Subject[] {
  try {
    const raw = localStorage.getItem(KEYS.SUBJECTS);
    if (!raw) return INITIAL_SUBJECTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (e) {
    console.error('Failed to load subjects from localStorage', e);
  }
  return INITIAL_SUBJECTS;
}

export function saveSubjects(subjects: Subject[]): void {
  try {
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
  } catch (e) {
    console.error('Failed to save subjects to localStorage', e);
  }
}

export function loadTimetable(): TimetableEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.TIMETABLE);
    if (!raw) return INITIAL_TIMETABLE;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error('Failed to load timetable from localStorage', e);
  }
  return INITIAL_TIMETABLE;
}

export function saveTimetable(timetable: TimetableEntry[]): void {
  try {
    localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(timetable));
  } catch (e) {
    console.error('Failed to save timetable to localStorage', e);
  }
}

export function loadAcademicEvents(): AcademicEvent[] {
  try {
    const raw = localStorage.getItem(KEYS.EVENTS);
    if (!raw) return INITIAL_ACADEMIC_EVENTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error('Failed to load academic events from localStorage', e);
  }
  return INITIAL_ACADEMIC_EVENTS;
}

export function saveAcademicEvents(events: AcademicEvent[]): void {
  try {
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save academic events to localStorage', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) return INITIAL_SETTINGS;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return { ...INITIAL_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
  }
  return INITIAL_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function loadOccurrences(settings?: AppSettings): Record<string, ClassOccurrence> {
  try {
    const raw = localStorage.getItem(KEYS.OCCURRENCES);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const cutoff = settings || loadSettings();
      const cleaned: Record<string, ClassOccurrence> = {};
      let hasBaselineOverlap = false;

      for (const [id, occ] of Object.entries(parsed as Record<string, ClassOccurrence>)) {
        if (occ && occ.date && occ.startTime) {
          if (isOccurrenceAfterBaselineCutoff(occ.date, occ.startTime, cutoff)) {
            cleaned[id] = occ;
          } else {
            hasBaselineOverlap = true;
          }
        }
      }

      if (hasBaselineOverlap) {
        saveOccurrences(cleaned);
      }

      return cleaned;
    }
  } catch (e) {
    console.error('Failed to load occurrences from localStorage', e);
  }
  return {};
}

export function saveOccurrences(occurrences: Record<string, ClassOccurrence>): void {
  try {
    localStorage.setItem(KEYS.OCCURRENCES, JSON.stringify(occurrences));
  } catch (e) {
    console.error('Failed to save occurrences to localStorage', e);
  }
}

export interface ExportDataPayload {
  version: string;
  exportDate: string;
  subjects: Subject[];
  timetable: TimetableEntry[];
  academicEvents: AcademicEvent[];
  settings: AppSettings;
  occurrences?: Record<string, ClassOccurrence>;
}

export function exportAllData(): string {
  const payload: ExportDataPayload = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    subjects: loadSubjects(),
    timetable: loadTimetable(),
    academicEvents: loadAcademicEvents(),
    settings: loadSettings(),
    occurrences: loadOccurrences(),
  };
  return JSON.stringify(payload, null, 2);
}

export function importAllData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as Partial<ExportDataPayload>;
    if (!data.subjects || !Array.isArray(data.subjects)) return false;
    if (!data.timetable || !Array.isArray(data.timetable)) return false;

    saveSubjects(data.subjects);
    saveTimetable(data.timetable);
    if (data.academicEvents && Array.isArray(data.academicEvents)) {
      saveAcademicEvents(data.academicEvents);
    }
    if (data.settings && typeof data.settings === 'object') {
      saveSettings({ ...INITIAL_SETTINGS, ...data.settings });
    }
    if (data.occurrences && typeof data.occurrences === 'object') {
      saveOccurrences(data.occurrences);
    }
    return true;
  } catch (e) {
    console.error('Failed to import data', e);
    return false;
  }
}

export function resetToInitialData(): void {
  saveSubjects(INITIAL_SUBJECTS);
  saveTimetable(INITIAL_TIMETABLE);
  saveAcademicEvents(INITIAL_ACADEMIC_EVENTS);
  saveSettings(INITIAL_SETTINGS);
  saveOccurrences({});
}

