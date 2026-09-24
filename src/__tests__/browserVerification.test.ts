import { describe, it, expect, beforeEach } from 'vitest';
import type { Subject, TimetableEntry, AcademicEvent, ClassOccurrence, AppSettings } from '../types';
import {
  generateOccurrenceId,
  reconcileOccurrences,
  getEffectiveSubjects,
} from '../utils/occurrenceEngine';
import { calculateAggregateStats } from '../utils/attendanceEngine';
import { loadOccurrences, saveOccurrences } from '../utils/storage';
import { INITIAL_SUBJECTS, INITIAL_TIMETABLE, INITIAL_ACADEMIC_EVENTS, INITIAL_SETTINGS } from '../data/initialData';

describe('Manual Verification Suite - Baseline Cutoff Requirements', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const k in store) delete store[k];
    globalThis.localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k in store) delete store[k];
      },
      length: 0,
      key: (i: number) => Object.keys(store)[i] || null,
    } as Storage;
  });

  it('1. CSE276 currently remains 23/24 and historical Sep 24 class does NOT appear as pending popup', () => {
    const nowSep24Night = new Date('2026-09-24T23:38:18+05:30');
    const storedOccurrences: Record<string, ClassOccurrence> = {};

    const reconciled = reconcileOccurrences(
      INITIAL_SETTINGS,
      INITIAL_TIMETABLE,
      INITIAL_ACADEMIC_EVENTS,
      storedOccurrences,
      nowSep24Night
    );

    const pendingOccurrences = reconciled.filter((o) => o.status === 'ATTENDANCE_PENDING');
    expect(pendingOccurrences).toHaveLength(0);

    const effective = getEffectiveSubjects(INITIAL_SUBJECTS, storedOccurrences, INITIAL_SETTINGS);
    const cse276 = effective.find((s) => s.code === 'CSE276')!;

    expect(cse276.attended).toBe(23);
    expect(cse276.delivered).toBe(24);
  });

  it('2. Genuinely future CSE276 occurrence after baseline cutoff (e.g. Sep 30 Wednesday 12:40 class) is detected correctly when class ends', () => {
    const nowSep30AfterClass = new Date('2026-09-30T15:00:00+05:30'); // Wednesday after 12:40-13:30 class
    const storedOccurrences: Record<string, ClassOccurrence> = {};

    const reconciled = reconcileOccurrences(
      INITIAL_SETTINGS,
      INITIAL_TIMETABLE,
      INITIAL_ACADEMIC_EVENTS,
      storedOccurrences,
      nowSep30AfterClass
    );

    const pendingCSE276 = reconciled.find((o) => o.subjectCode === 'CSE276' && o.status === 'ATTENDANCE_PENDING');
    expect(pendingCSE276).toBeDefined();
    expect(pendingCSE276?.date).toBe('2026-09-30');
  });

  it('3. Resolve future occurrence as PRESENT: 23/24 -> 24/25', () => {
    const futureOccId = generateOccurrenceId('CSE276', '2026-09-25', '11:50');
    const occurrences: Record<string, ClassOccurrence> = {
      [futureOccId]: {
        id: futureOccId,
        subjectCode: 'CSE276',
        date: '2026-09-25',
        startTime: '11:50',
        endTime: '12:40',
        type: 'Lecture',
        status: 'PRESENT',
        resolvedAt: new Date().toISOString(),
      },
    };

    const effective = getEffectiveSubjects(INITIAL_SUBJECTS, occurrences, INITIAL_SETTINGS);
    const cse276 = effective.find((s) => s.code === 'CSE276')!;

    expect(cse276.attended).toBe(24);
    expect(cse276.delivered).toBe(25);
    expect((cse276.attended / cse276.delivered) * 100).toBe(96.0);
  });

  it('4. Same occurrence cannot be counted twice after refresh/reload', () => {
    const futureOccId = generateOccurrenceId('CSE276', '2026-09-25', '11:50');
    const occurrences: Record<string, ClassOccurrence> = {
      [futureOccId]: {
        id: futureOccId,
        subjectCode: 'CSE276',
        date: '2026-09-25',
        startTime: '11:50',
        endTime: '12:40',
        type: 'Lecture',
        status: 'PRESENT',
        resolvedAt: new Date().toISOString(),
      },
    };

    saveOccurrences(occurrences);

    // Simulate page reload
    const reloadedOccurrences = loadOccurrences(INITIAL_SETTINGS);
    const effectiveReloaded = getEffectiveSubjects(INITIAL_SUBJECTS, reloadedOccurrences, INITIAL_SETTINGS);
    const cse276 = effectiveReloaded.find((s) => s.code === 'CSE276')!;

    expect(cse276.attended).toBe(24);
    expect(cse276.delivered).toBe(25);
  });

  it('5. Test NOT_DELIVERED on future occurrence: 23/24 -> 23/24', () => {
    const futureOccId = generateOccurrenceId('CSE276', '2026-09-25', '11:50');
    const occurrences: Record<string, ClassOccurrence> = {
      [futureOccId]: {
        id: futureOccId,
        subjectCode: 'CSE276',
        date: '2026-09-25',
        startTime: '11:50',
        endTime: '12:40',
        type: 'Lecture',
        status: 'NOT_DELIVERED',
        resolvedAt: new Date().toISOString(),
      },
    };

    const effective = getEffectiveSubjects(INITIAL_SUBJECTS, occurrences, INITIAL_SETTINGS);
    const cse276 = effective.find((s) => s.code === 'CSE276')!;

    expect(cse276.attended).toBe(23);
    expect(cse276.delivered).toBe(24);
  });

  it('6. Test ABSENT on future occurrence: 23/24 -> 23/25', () => {
    const futureOccId = generateOccurrenceId('CSE276', '2026-09-25', '11:50');
    const occurrences: Record<string, ClassOccurrence> = {
      [futureOccId]: {
        id: futureOccId,
        subjectCode: 'CSE276',
        date: '2026-09-25',
        startTime: '11:50',
        endTime: '12:40',
        type: 'Lecture',
        status: 'ABSENT',
        resolvedAt: new Date().toISOString(),
      },
    };

    const effective = getEffectiveSubjects(INITIAL_SUBJECTS, occurrences, INITIAL_SETTINGS);
    const cse276 = effective.find((s) => s.code === 'CSE276')!;

    expect(cse276.attended).toBe(23);
    expect(cse276.delivered).toBe(25);
  });

  it('7. Aggregate attendance updates correctly when future occurrences are resolved', () => {
    const baselineAgg = calculateAggregateStats(INITIAL_SUBJECTS, 87);
    expect(baselineAgg.totalAttended).toBe(156);
    expect(baselineAgg.totalConducted).toBe(174);
    expect(baselineAgg.currentPercentage.toFixed(2)).toBe('89.66');

    // Future PRESENT: 156+1 / 174+1 = 157 / 175 = 89.71%
    const futureOccId = generateOccurrenceId('CSE276', '2026-09-25', '11:50');
    const occurrences: Record<string, ClassOccurrence> = {
      [futureOccId]: {
        id: futureOccId,
        subjectCode: 'CSE276',
        date: '2026-09-25',
        startTime: '11:50',
        endTime: '12:40',
        type: 'Lecture',
        status: 'PRESENT',
      },
    };

    const effective = getEffectiveSubjects(INITIAL_SUBJECTS, occurrences, INITIAL_SETTINGS);
    const afterPresentAgg = calculateAggregateStats(effective, 87);

    expect(afterPresentAgg.totalAttended).toBe(157);
    expect(afterPresentAgg.totalConducted).toBe(175);
    expect(afterPresentAgg.currentPercentage.toFixed(2)).toBe('89.71');
  });

  it('8. Unrelated functionality check (Skip Day, What-If, Targets)', () => {
    const agg = calculateAggregateStats(INITIAL_SUBJECTS, 87);
    expect(agg.overallTarget).toBe(87);
    expect(agg.isAboveTarget).toBe(true);
  });
});
