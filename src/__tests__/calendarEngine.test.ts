import { describe, it, expect } from 'vitest';
import {
  getDayOfWeek,
  isAcademicBlackoutDate,
  isTeachingDay,
  getClassesForDate,
  getUpcomingClassesForSubject,
  evaluateSkipDay,
} from '../utils/calendarEngine';
import { INITIAL_TIMETABLE, INITIAL_ACADEMIC_EVENTS, INITIAL_SUBJECTS } from '../data/initialData';

describe('Calendar and Timetable Engine', () => {
  it('Day of week calculation', () => {
    expect(getDayOfWeek('2026-09-24')).toBe('Thursday');
    expect(getDayOfWeek('2026-09-25')).toBe('Friday');
    expect(getDayOfWeek('2026-09-26')).toBe('Saturday');
    expect(getDayOfWeek('2026-09-27')).toBe('Sunday');
    expect(getDayOfWeek('2026-09-28')).toBe('Monday');
    expect(getDayOfWeek('2026-10-01')).toBe('Thursday');
  });

  it('Mid Term Test exclusion (Oct 01 - Oct 09, 2026)', () => {
    expect(isAcademicBlackoutDate('2026-10-01', INITIAL_ACADEMIC_EVENTS).isBlackout).toBe(true);
    expect(isAcademicBlackoutDate('2026-10-05', INITIAL_ACADEMIC_EVENTS).isBlackout).toBe(true);
    expect(isAcademicBlackoutDate('2026-10-09', INITIAL_ACADEMIC_EVENTS).isBlackout).toBe(true);
    expect(isAcademicBlackoutDate('2026-09-30', INITIAL_ACADEMIC_EVENTS).isBlackout).toBe(false);
    expect(isAcademicBlackoutDate('2026-10-10', INITIAL_ACADEMIC_EVENTS).isBlackout).toBe(false);

    // Classes for date during MTT must return empty array!
    expect(getClassesForDate('2026-10-01', INITIAL_TIMETABLE, INITIAL_ACADEMIC_EVENTS)).toEqual([]);
    expect(getClassesForDate('2026-10-05', INITIAL_TIMETABLE, INITIAL_ACADEMIC_EVENTS)).toEqual([]);
  });

  it('Term Break exclusion (Nov 07 - Nov 10, 2026)', () => {
    expect(isAcademicBlackoutDate('2026-11-07', INITIAL_ACADEMIC_EVENTS).isBlackout).toBe(true);
    expect(isAcademicBlackoutDate('2026-11-09', INITIAL_ACADEMIC_EVENTS).isBlackout).toBe(true);
    expect(isAcademicBlackoutDate('2026-11-10', INITIAL_ACADEMIC_EVENTS).isBlackout).toBe(true);
    expect(isAcademicBlackoutDate('2026-11-11', INITIAL_ACADEMIC_EVENTS).isBlackout).toBe(false);
  });

  it('End Term Examination exclusion (Dec 14 - Dec 30, 2026)', () => {
    expect(isAcademicBlackoutDate('2026-12-14', INITIAL_ACADEMIC_EVENTS).isBlackout).toBe(true);
    expect(isAcademicBlackoutDate('2026-12-25', INITIAL_ACADEMIC_EVENTS).isBlackout).toBe(true);
    expect(isAcademicBlackoutDate('2026-12-30', INITIAL_ACADEMIC_EVENTS).isBlackout).toBe(true);
  });

  it('Weekend handling', () => {
    // 2026-09-26 is Saturday
    expect(isTeachingDay('2026-09-26', INITIAL_ACADEMIC_EVENTS)).toBe(false);
    expect(getClassesForDate('2026-09-26', INITIAL_TIMETABLE, INITIAL_ACADEMIC_EVENTS)).toEqual([]);

    // 2026-09-27 is Sunday
    expect(isTeachingDay('2026-09-27', INITIAL_ACADEMIC_EVENTS)).toBe(false);
    expect(getClassesForDate('2026-09-27', INITIAL_TIMETABLE, INITIAL_ACADEMIC_EVENTS)).toEqual([]);
  });

  it('Timetable classes on a valid teaching day (Thursday, Sep 25, 2026 is Friday; Sep 24 is Thu)', () => {
    const classesThu = getClassesForDate('2026-09-24', INITIAL_TIMETABLE, INITIAL_ACADEMIC_EVENTS);
    expect(classesThu.length).toBe(8); // Thursday has 8 scheduled classes in timetable
    expect(classesThu[0].subjectCode).toBe('INT335');
    expect(classesThu[1].subjectCode).toBe('CSE205');
  });

  it('Upcoming classes count for subject excluding blackout dates', () => {
    // CSE205 has classes on Mon(2), Tue(2), Thu(2).
    // Let's count from Sep 24 to Oct 12:
    // Sep 24 (Thu): 2
    // Sep 25 (Fri): 0
    // Sep 26 (Sat), Sep 27 (Sun): 0
    // Sep 28 (Mon): 2
    // Sep 29 (Tue): 2
    // Sep 30 (Wed): 0
    // Oct 1 - Oct 9 (MTT): 0! (Excluded)
    // Oct 10 (Sat), Oct 11 (Sun): 0
    // Oct 12 (Mon): 2
    const upcoming = getUpcomingClassesForSubject(
      'CSE205',
      '2026-09-24',
      '2026-10-12',
      INITIAL_TIMETABLE,
      INITIAL_ACADEMIC_EVENTS
    );
    expect(upcoming.length).toBe(8); // 2 + 2 + 2 + 2 = 8
  });

  it('Can I Skip This Day evaluation on Thursday Sep 24, 2026', () => {
    const subjectsWithTarget = INITIAL_SUBJECTS.map((s) => ({
      ...s,
      subjectMinimumAttendance: 87,
    }));

    const evalResult = evaluateSkipDay(
      '2026-09-24',
      subjectsWithTarget,
      INITIAL_TIMETABLE,
      INITIAL_ACADEMIC_EVENTS,
      87
    );

    expect(evalResult.date).toBe('2026-09-24');
    expect(evalResult.dayOfWeek).toBe('Thursday');
    expect(evalResult.isBlackoutDate).toBe(false);
    expect(evalResult.totalClassesOnDay).toBe(8);

    // Aggregate impact check
    expect(evalResult.currentAggregatePercentage).toBeCloseTo(89.655, 3);
    expect(evalResult.afterSkipAggregatePercentage).toBeCloseTo(85.714, 3); // 156 / (174 + 8) = 156 / 182 = 85.714%

    // CSE205 has 2 classes on Thursday.
    // Attended: 29, Delivered: 32 (90.625%)
    // After skip: 29 / 34 = 85.294% => Danger (< 87%)
    const cse205Impact = evalResult.affectedSubjects.find((s) => s.subjectCode === 'CSE205');
    expect(cse205Impact).toBeDefined();
    expect(cse205Impact?.scheduledClassesCount).toBe(2);
    expect(cse205Impact?.afterSkipDelivered).toBe(34);
    expect(cse205Impact?.afterSkipPercentage).toBeCloseTo(85.294, 3);
    expect(cse205Impact?.afterSkipStatus).toBe('danger');
  });

  it('Can I Skip This Day evaluation on blackout date (Oct 02, 2026)', () => {
    const evalResult = evaluateSkipDay(
      '2026-10-02',
      INITIAL_SUBJECTS,
      INITIAL_TIMETABLE,
      INITIAL_ACADEMIC_EVENTS,
      87
    );

    expect(evalResult.isBlackoutDate).toBe(true);
    expect(evalResult.totalClassesOnDay).toBe(0);
    expect(evalResult.blackoutReason).toContain('Mid Term Test');
  });
});
