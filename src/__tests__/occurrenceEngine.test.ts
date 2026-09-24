import { describe, it, expect, beforeEach } from 'vitest';
import type { Subject, TimetableEntry, AcademicEvent, ClassOccurrence, AppSettings } from '../types';
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
      attended: 29,
      delivered: 32,
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
    {
      id: 'subj-cse276',
      code: 'CSE276',
      name: 'Artificial Intelligence Foundations',
      faculty: 'Dr. Jimmy Singla',
      attended: 23,
      delivered: 24,
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
    {
      id: 'tt-thu-1',
      day: 'Thursday',
      startTime: '11:50',
      endTime: '12:40',
      subjectCode: 'CSE276',
      type: 'Practical',
    },
    {
      id: 'tt-fri-1',
      day: 'Friday',
      startTime: '11:50',
      endTime: '12:40',
      subjectCode: 'CSE276',
      type: 'Lecture',
    },
  ];

  const sampleEvents: AcademicEvent[] = [];

  const defaultSettings: AppSettings = {
    defaultTarget: 87,
    baselineDate: '2026-09-24',
    baselineCutoffTime: '23:59',
    termEndDate: '2026-12-11',
    theme: 'light',
  };

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

  it('1. PRESENT: 29/32 -> 30/33 (attended +1, conducted +1)', () => {
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

    const effective = getEffectiveSubjects(sampleSubjects, occurrences, defaultSettings);
    const cse205 = effective.find((s) => s.code === 'CSE205')!;

    expect(cse205.attended).toBe(30); // 29 + 1
    expect(cse205.delivered).toBe(33); // 32 + 1
  });

  it('2. ABSENT: 29/32 -> 29/33 (attended +0, conducted +1)', () => {
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

    const effective = getEffectiveSubjects(sampleSubjects, occurrences, defaultSettings);
    const cse205 = effective.find((s) => s.code === 'CSE205')!;

    expect(cse205.attended).toBe(29); // 29 + 0
    expect(cse205.delivered).toBe(33); // 32 + 1
  });

  it('3. NOT_DELIVERED: 29/32 -> 29/32 (attended +0, conducted +0, exact match)', () => {
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

    const effective = getEffectiveSubjects(sampleSubjects, occurrences, defaultSettings);
    const cse205 = effective.find((s) => s.code === 'CSE205')!;

    expect(cse205.attended).toBe(29); // baseline 29
    expect(cse205.delivered).toBe(32); // baseline 32
  });

  it('4. Duplicate occurrence cannot be counted twice', () => {
    const occId = generateOccurrenceId('CSE205', '2026-09-28', '09:20');

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
    occurrences[occId] = {
      id: occId,
      subjectCode: 'CSE205',
      date: '2026-09-28',
      startTime: '09:20',
      endTime: '10:10',
      type: 'Lecture',
      status: 'PRESENT',
    };

    const effective = getEffectiveSubjects(sampleSubjects, occurrences, defaultSettings);
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
    const effectiveSubjects = getEffectiveSubjects(sampleSubjects, occurrences, defaultSettings);
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
    const effectiveSubjects = getEffectiveSubjects(sampleSubjects, occurrences, defaultSettings);
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

    const effectiveSubjects = getEffectiveSubjects(sampleSubjects, occurrences, defaultSettings);
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

    const loaded = loadOccurrences(defaultSettings);
    expect(loaded[occId]).toBeDefined();
    expect(loaded[occId].status).toBe('NOT_DELIVERED');
  });

  it('9. Reopening the application does not show a resolved occurrence as pending again', () => {
    const occId = generateOccurrenceId('CSE205', '2026-09-28', '09:20');
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

    const now = new Date('2026-09-28T12:00:00');
    const reconciled = reconcileOccurrences(defaultSettings, sampleTimetable, sampleEvents, stored, now);

    const occ = reconciled.find((o) => o.id === occId);
    expect(occ?.status).toBe('NOT_DELIVERED');
    expect(occ?.status).not.toBe('ATTENDANCE_PENDING');
  });

  it('10. A scheduled class does not automatically increase conducted attendance', () => {
    const occurrences: Record<string, ClassOccurrence> = {};

    const now = new Date('2026-09-28T12:00:00');
    const reconciled = reconcileOccurrences(defaultSettings, sampleTimetable, sampleEvents, occurrences, now);

    const pendingOcc = reconciled.find((o) => o.status === 'ATTENDANCE_PENDING');
    expect(pendingOcc).toBeDefined();

    const effective = getEffectiveSubjects(sampleSubjects, occurrences, defaultSettings);
    const cse205 = effective.find((s) => s.code === 'CSE205')!;

    expect(cse205.delivered).toBe(32);
    expect(cse205.attended).toBe(29);
  });
});

describe('Baseline Cutoff & Historical Occurrence Data Integrity Tests', () => {
  const sampleSubjects: Subject[] = [
    {
      id: 'subj-cse276',
      code: 'CSE276',
      name: 'Artificial Intelligence Foundations',
      faculty: 'Dr. Jimmy Singla',
      attended: 23,
      delivered: 24,
      subjectMinimumAttendance: null,
    },
  ];

  const sampleTimetable: TimetableEntry[] = [
    {
      id: 'tt-thu-1',
      day: 'Thursday',
      startTime: '11:50',
      endTime: '12:40',
      subjectCode: 'CSE276',
      type: 'Practical',
    },
    {
      id: 'tt-fri-1',
      day: 'Friday',
      startTime: '11:50',
      endTime: '12:40',
      subjectCode: 'CSE276',
      type: 'Lecture',
    },
  ];

  const sampleEvents: AcademicEvent[] = [];

  const defaultSettings: AppSettings = {
    defaultTarget: 87,
    baselineDate: '2026-09-24', // Thursday Sep 24, 2026
    baselineCutoffTime: '23:59',
    termEndDate: '2026-12-11',
    theme: 'light',
  };

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

  it('TEST 1: Baseline 23/24 + Historical ABSENT occurrence before baseline cutoff -> Remains 23/24 (NOT 23/25)', () => {
    const occId = generateOccurrenceId('CSE276', '2026-09-24', '11:50'); // Sep 24 is baseline date
    const occurrences: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE276',
        date: '2026-09-24',
        startTime: '11:50',
        endTime: '12:40',
        type: 'Practical',
        status: 'ABSENT',
      },
    };

    const effective = getEffectiveSubjects(sampleSubjects, occurrences, defaultSettings);
    const cse276 = effective.find((s) => s.code === 'CSE276')!;

    expect(cse276.attended).toBe(23);
    expect(cse276.delivered).toBe(24);
  });

  it('TEST 2: Baseline 23/24 + Future ABSENT occurrence after baseline cutoff -> 23/25', () => {
    const occId = generateOccurrenceId('CSE276', '2026-09-25', '11:50'); // Sep 25 is after baseline date
    const occurrences: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE276',
        date: '2026-09-25',
        startTime: '11:50',
        endTime: '12:40',
        type: 'Lecture',
        status: 'ABSENT',
      },
    };

    const effective = getEffectiveSubjects(sampleSubjects, occurrences, defaultSettings);
    const cse276 = effective.find((s) => s.code === 'CSE276')!;

    expect(cse276.attended).toBe(23);
    expect(cse276.delivered).toBe(25);
  });

  it('TEST 3: Baseline 23/24 + Future PRESENT occurrence after baseline cutoff -> 24/25', () => {
    const occId = generateOccurrenceId('CSE276', '2026-09-25', '11:50');
    const occurrences: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE276',
        date: '2026-09-25',
        startTime: '11:50',
        endTime: '12:40',
        type: 'Lecture',
        status: 'PRESENT',
      },
    };

    const effective = getEffectiveSubjects(sampleSubjects, occurrences, defaultSettings);
    const cse276 = effective.find((s) => s.code === 'CSE276')!;

    expect(cse276.attended).toBe(24);
    expect(cse276.delivered).toBe(25);
  });

  it('TEST 4: Baseline 23/24 + Future NOT_DELIVERED occurrence after baseline cutoff -> 23/24', () => {
    const occId = generateOccurrenceId('CSE276', '2026-09-25', '11:50');
    const occurrences: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE276',
        date: '2026-09-25',
        startTime: '11:50',
        endTime: '12:40',
        type: 'Lecture',
        status: 'NOT_DELIVERED',
      },
    };

    const effective = getEffectiveSubjects(sampleSubjects, occurrences, defaultSettings);
    const cse276 = effective.find((s) => s.code === 'CSE276')!;

    expect(cse276.attended).toBe(23);
    expect(cse276.delivered).toBe(24);
  });

  it('TEST 5: Historical occurrence already included in baseline generates no attendance popup (not ATTENDANCE_PENDING)', () => {
    const now = new Date('2026-09-24T23:38:00'); // Thursday night
    const occurrences: Record<string, ClassOccurrence> = {};

    const reconciled = reconcileOccurrences(defaultSettings, sampleTimetable, sampleEvents, occurrences, now);
    const pending = reconciled.filter((o) => o.status === 'ATTENDANCE_PENDING');

    expect(pending).toHaveLength(0);
  });

  it('TEST 6: Historical occurrence already represented by baseline cannot be counted again even if timetable contains that class', () => {
    const now = new Date('2026-09-24T23:38:00');
    const occurrences: Record<string, ClassOccurrence> = {};

    const reconciled = reconcileOccurrences(defaultSettings, sampleTimetable, sampleEvents, occurrences, now);
    const effective = getEffectiveSubjects(sampleSubjects, occurrences, defaultSettings);
    const cse276 = effective.find((s) => s.code === 'CSE276')!;

    expect(reconciled).toHaveLength(0);
    expect(cse276.attended).toBe(23);
    expect(cse276.delivered).toBe(24);
  });

  it('TEST 7: Valid future PRESENT occurrence survives refresh', () => {
    const occId = generateOccurrenceId('CSE276', '2026-09-25', '11:50');
    const futureOccurrences: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE276',
        date: '2026-09-25',
        startTime: '11:50',
        endTime: '12:40',
        type: 'Lecture',
        status: 'PRESENT',
      },
    };

    saveOccurrences(futureOccurrences);
    const loaded = loadOccurrences(defaultSettings);

    expect(loaded[occId]).toBeDefined();
    expect(loaded[occId].status).toBe('PRESENT');

    const effective = getEffectiveSubjects(sampleSubjects, loaded, defaultSettings);
    const cse276 = effective.find((s) => s.code === 'CSE276')!;
    expect(cse276.attended).toBe(24);
    expect(cse276.delivered).toBe(25);
  });

  it('TEST 8: Valid future ABSENT occurrence survives refresh', () => {
    const occId = generateOccurrenceId('CSE276', '2026-09-25', '11:50');
    const futureOccurrences: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE276',
        date: '2026-09-25',
        startTime: '11:50',
        endTime: '12:40',
        type: 'Lecture',
        status: 'ABSENT',
      },
    };

    saveOccurrences(futureOccurrences);
    const loaded = loadOccurrences(defaultSettings);

    expect(loaded[occId]).toBeDefined();
    expect(loaded[occId].status).toBe('ABSENT');

    const effective = getEffectiveSubjects(sampleSubjects, loaded, defaultSettings);
    const cse276 = effective.find((s) => s.code === 'CSE276')!;
    expect(cse276.attended).toBe(23);
    expect(cse276.delivered).toBe(25);
  });

  it('TEST 9: Valid future NOT_DELIVERED occurrence survives refresh', () => {
    const occId = generateOccurrenceId('CSE276', '2026-09-25', '11:50');
    const futureOccurrences: Record<string, ClassOccurrence> = {
      [occId]: {
        id: occId,
        subjectCode: 'CSE276',
        date: '2026-09-25',
        startTime: '11:50',
        endTime: '12:40',
        type: 'Lecture',
        status: 'NOT_DELIVERED',
      },
    };

    saveOccurrences(futureOccurrences);
    const loaded = loadOccurrences(defaultSettings);

    expect(loaded[occId]).toBeDefined();
    expect(loaded[occId].status).toBe('NOT_DELIVERED');

    const effective = getEffectiveSubjects(sampleSubjects, loaded, defaultSettings);
    const cse276 = effective.find((s) => s.code === 'CSE276')!;
    expect(cse276.attended).toBe(23);
    expect(cse276.delivered).toBe(24);
  });

  it('TEST 10: The same future occurrence cannot be counted twice', () => {
    const occId = generateOccurrenceId('CSE276', '2026-09-25', '11:50');
    const occurrences: Record<string, ClassOccurrence> = {};

    occurrences[occId] = {
      id: occId,
      subjectCode: 'CSE276',
      date: '2026-09-25',
      startTime: '11:50',
      endTime: '12:40',
      type: 'Lecture',
      status: 'PRESENT',
    };
    occurrences[occId] = {
      id: occId,
      subjectCode: 'CSE276',
      date: '2026-09-25',
      startTime: '11:50',
      endTime: '12:40',
      type: 'Lecture',
      status: 'PRESENT',
    };

    const effective = getEffectiveSubjects(sampleSubjects, occurrences, defaultSettings);
    const cse276 = effective.find((s) => s.code === 'CSE276')!;

    expect(cse276.attended).toBe(24); // 23 + 1
    expect(cse276.delivered).toBe(25); // 24 + 1
  });

  it('TEST 11: Changing current date does not cause historical baseline classes to suddenly become pending', () => {
    // Current date advanced to Monday Sep 28
    const futureNow = new Date('2026-09-28T18:00:00');
    const occurrences: Record<string, ClassOccurrence> = {};

    const reconciled = reconcileOccurrences(defaultSettings, sampleTimetable, sampleEvents, occurrences, futureNow);

    // Only Friday Sep 25 class should enter occurrence lifecycle; Thursday Sep 24 is historical baseline!
    const thuOcc = reconciled.find((o) => o.date === '2026-09-24');
    expect(thuOcc).toBeUndefined();

    const friOcc = reconciled.find((o) => o.date === '2026-09-25');
    expect(friOcc).toBeDefined();
    expect(friOcc?.status).toBe('ATTENDANCE_PENDING');
  });

  it('TEST 12: Reopening the application does not create duplicate historical occurrences', () => {
    // Simulate initial store containing an erroneous historical occurrence from previous version
    const historicalOccId = generateOccurrenceId('CSE276', '2026-09-24', '11:50');
    const stored: Record<string, ClassOccurrence> = {
      [historicalOccId]: {
        id: historicalOccId,
        subjectCode: 'CSE276',
        date: '2026-09-24',
        startTime: '11:50',
        endTime: '12:40',
        type: 'Practical',
        status: 'ABSENT',
      },
    };

    saveOccurrences(stored);
    const cleaned = loadOccurrences(defaultSettings);

    // Storage migration cleans up historical baseline overlap
    expect(cleaned[historicalOccId]).toBeUndefined();

    const now = new Date('2026-09-24T23:38:00');
    const reconciled = reconcileOccurrences(defaultSettings, sampleTimetable, sampleEvents, cleaned, now);

    expect(reconciled).toHaveLength(0);

    const effective = getEffectiveSubjects(sampleSubjects, cleaned, defaultSettings);
    const cse276 = effective.find((s) => s.code === 'CSE276')!;

    expect(cse276.attended).toBe(23);
    expect(cse276.delivered).toBe(24);
  });
});
