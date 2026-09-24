import { describe, it, expect, beforeEach } from 'vitest';
import type { Subject, TimetableEntry, AcademicEvent, ClassOccurrence } from '../types';
import {
  generateOccurrenceId,
  reconcileOccurrences,
  getEffectiveSubjects,
} from '../utils/occurrenceEngine';
import {
  calculateSubjectStats,
  calculateAggregateStats,
  calculateClassesCanMiss,
  calculateClassesNeeded,
} from '../utils/attendanceEngine';
import {
  loadOccurrences,
  saveOccurrences,
} from '../utils/storage';


describe('Lecture Not Delivered & Occurrence Workflow Engine', () => {
  const sampleSubjects: Subject[] = [
    {
      id: 'subj-cse205',
      code: 'CSE205',
      name: 'Data Structures',
      faculty: 'Aryan Tyagi',
      attended: 29, // 29 * 2 = 58
      delivered: 32, // 32 * 2 = 64 (or 58/65 equivalent)
      subjectMinimumAttendance: 87,
    },
    {
      id: 'subj-cse202',
      code: 'CSE202',
      name: 'OOP',
      faculty: 'Aryan Tyagi',
      attended: 24,
      delivered: 28,
      subjectMinimumAttendance: null,
    },
  ];

  const sampleTimetable: TimetableEntry[] = [
    {
      id: 'tt-mon-1',
      day: 'Monday',
      startTime: '09:20',
      endTime: '10:10',
      subjectCode: 'CSE205',
      type: 'Lecture',
    },
    {
      id: 'tt-mon-2',
      day: 'Monday',
      startTime: '10:10',
      endTime: '11:00',
      subjectCode: 'CSE205',
      type: 'Lecture',
    },
  ];

  const sampleEvents: AcademicEvent[] = [];

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


  it('1. PRESENT: 58/65 -> 59/66 (attended +1, conducted +1)', () => {
    const occId = generateOccurrenceId('CSE205', '2026-09-28', '09:20');
    const occurrences: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE205',
        date: '2026-09-28',
        startTime: '09:20',
        endTime: '10:10',
        type: 'Lecture',
        status: 'PRESENT',
      },
    };

    const effective = getEffectiveSubjects(sampleSubjects, occurrences);
    const cse205 = effective.find((s) => s.code === 'CSE205')!;

    expect(cse205.attended).toBe(30); // 29 + 1
    expect(cse205.delivered).toBe(33); // 32 + 1
  });

  it('2. ABSENT: 58/65 -> 58/66 (attended +0, conducted +1)', () => {
    const occId = generateOccurrenceId('CSE205', '2026-09-28', '09:20');
    const occurrences: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE205',
        date: '2026-09-28',
        startTime: '09:20',
        endTime: '10:10',
        type: 'Lecture',
        status: 'ABSENT',
      },
    };

    const effective = getEffectiveSubjects(sampleSubjects, occurrences);
    const cse205 = effective.find((s) => s.code === 'CSE205')!;

    expect(cse205.attended).toBe(29); // 29 + 0
    expect(cse205.delivered).toBe(33); // 32 + 1
  });

  it('3. NOT_DELIVERED: 58/65 -> 58/65 (attended +0, conducted +0, exact match)', () => {
    const occId = generateOccurrenceId('CSE205', '2026-09-28', '09:20');
    const occurrences: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE205',
        date: '2026-09-28',
        startTime: '09:20',
        endTime: '10:10',
        type: 'Lecture',
        status: 'NOT_DELIVERED',
      },
    };

    const effective = getEffectiveSubjects(sampleSubjects, occurrences);
    const cse205 = effective.find((s) => s.code === 'CSE205')!;

    expect(cse205.attended).toBe(29); // baseline 29
    expect(cse205.delivered).toBe(32); // baseline 32
  });

  it('4. Duplicate occurrence cannot be counted twice', () => {
    const occId = generateOccurrenceId('CSE205', '2026-09-28', '09:20');

    // Setting same occurrence key twice with status PRESENT
    const occurrences: Record<string, ClassOccurrence> = {};
    occurrences[occId] = {
      id: occId,
      subjectCode: 'CSE205',
      date: '2026-09-28',
      startTime: '09:20',
      endTime: '10:10',
      type: 'Lecture',
      status: 'PRESENT',
    };
    // Duplicate assignment / overwrite
    occurrences[occId] = {
      id: occId,
      subjectCode: 'CSE205',
      date: '2026-09-28',
      startTime: '09:20',
      endTime: '10:10',
      type: 'Lecture',
      status: 'PRESENT',
    };

    const effective = getEffectiveSubjects(sampleSubjects, occurrences);
    const cse205 = effective.find((s) => s.code === 'CSE205')!;

    expect(cse205.attended).toBe(30); // counted exactly once
    expect(cse205.delivered).toBe(33); // counted exactly once
  });

  it('5. NOT_DELIVERED does not affect subject attendance percentage', () => {
    const occId = generateOccurrenceId('CSE205', '2026-09-28', '09:20');
    const occurrences: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE205',
        date: '2026-09-28',
        startTime: '09:20',
        endTime: '10:10',
        type: 'Lecture',
        status: 'NOT_DELIVERED',
      },
    };

    const baselineStats = calculateSubjectStats(sampleSubjects[0], 87);
    const effectiveSubjects = getEffectiveSubjects(sampleSubjects, occurrences);
    const effectiveStats = calculateSubjectStats(effectiveSubjects[0], 87);

    expect(effectiveStats.currentPercentage).toEqual(baselineStats.currentPercentage);
  });

  it('6. NOT_DELIVERED does not affect aggregate attendance', () => {
    const occId = generateOccurrenceId('CSE205', '2026-09-28', '09:20');
    const occurrences: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE205',
        date: '2026-09-28',
        startTime: '09:20',
        endTime: '10:10',
        type: 'Lecture',
        status: 'NOT_DELIVERED',
      },
    };

    const baselineAgg = calculateAggregateStats(sampleSubjects, 87);
    const effectiveSubjects = getEffectiveSubjects(sampleSubjects, occurrences);
    const effectiveAgg = calculateAggregateStats(effectiveSubjects, 87);

    expect(effectiveAgg.totalAttended).toBe(baselineAgg.totalAttended);
    expect(effectiveAgg.totalConducted).toBe(baselineAgg.totalConducted);
    expect(effectiveAgg.currentPercentage).toBe(baselineAgg.currentPercentage);
  });

  it('7. NOT_DELIVERED does not affect target/recovery calculations', () => {
    const occId = generateOccurrenceId('CSE205', '2026-09-28', '09:20');
    const occurrences: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE205',
        date: '2026-09-28',
        startTime: '09:20',
        endTime: '10:10',
        type: 'Lecture',
        status: 'NOT_DELIVERED',
      },
    };

    const baselineCanMiss = calculateClassesCanMiss(29, 32, 87);
    const baselineNeeded = calculateClassesNeeded(29, 32, 87);

    const effectiveSubjects = getEffectiveSubjects(sampleSubjects, occurrences);
    const cse205 = effectiveSubjects.find((s) => s.code === 'CSE205')!;

    const effectiveCanMiss = calculateClassesCanMiss(cse205.attended, cse205.delivered, 87);
    const effectiveNeeded = calculateClassesNeeded(cse205.attended, cse205.delivered, 87);

    expect(effectiveCanMiss).toBe(baselineCanMiss);
    expect(effectiveNeeded).toBe(baselineNeeded);
  });

  it('8. Refreshing the application preserves the resolved status in storage', () => {
    const occId = generateOccurrenceId('CSE205', '2026-09-28', '09:20');
    const initialOccurrences: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE205',
        date: '2026-09-28',
        startTime: '09:20',
        endTime: '10:10',
        type: 'Lecture',
        status: 'NOT_DELIVERED',
      },
    };

    saveOccurrences(initialOccurrences);

    // Simulate page reload by reading storage
    const loaded = loadOccurrences();
    expect(loaded[occId]).toBeDefined();
    expect(loaded[occId].status).toBe('NOT_DELIVERED');
  });

  it('9. Reopening the application does not show a resolved occurrence as pending again', () => {
    const occId = generateOccurrenceId('CSE205', '2026-09-28', '09:20'); // Monday 09:20 class
    const stored: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE205',
        date: '2026-09-28',
        startTime: '09:20',
        endTime: '10:10',
        type: 'Lecture',
        status: 'NOT_DELIVERED',
      },
    };

    // Reopen app on Monday 2026-09-28 at 12:00 (after class ended)
    const now = new Date('2026-09-28T12:00:00');
    const reconciled = reconcileOccurrences('2026-09-28', sampleTimetable, sampleEvents, stored, now);

    const occ = reconciled.find((o) => o.id === occId);
    expect(occ?.status).toBe('NOT_DELIVERED');
    expect(occ?.status).not.toBe('ATTENDANCE_PENDING');
  });

  it('10. A scheduled class does not automatically increase conducted attendance', () => {
    // 09:20 class has ended, but user has NOT resolved it yet (unresolved / pending / later)
    const occurrences: Record<string, ClassOccurrence> = {};

    const now = new Date('2026-09-28T12:00:00');
    const reconciled = reconcileOccurrences('2026-09-28', sampleTimetable, sampleEvents, occurrences, now);

    const pendingOcc = reconciled.find((o) => o.status === 'ATTENDANCE_PENDING');
    expect(pendingOcc).toBeDefined();

    // Effective subjects before outcome resolution
    const effective = getEffectiveSubjects(sampleSubjects, occurrences);
    const cse205 = effective.find((s) => s.code === 'CSE205')!;

    // Delivered (conducted) count should still equal baseline (32) and NOT auto-increment to 33!
    expect(cse205.delivered).toBe(32);
    expect(cse205.attended).toBe(29);
  });

  it('Reconciliation identifies UPCOMING and IN_PROGRESS classes based on real-time', () => {
    const occurrences: Record<string, ClassOccurrence> = {};
    const nowDuringClass = new Date('2026-09-28T09:30:00'); // Monday 09:30 (during 09:20-10:10 class)

    const reconciled = reconcileOccurrences('2026-09-28', sampleTimetable, sampleEvents, occurrences, nowDuringClass);

    const firstClass = reconciled.find((o) => o.startTime === '09:20');
    const secondClass = reconciled.find((o) => o.startTime === '10:10');

    expect(firstClass?.status).toBe('IN_PROGRESS');
    expect(secondClass?.status).toBe('UPCOMING');
  });
});
