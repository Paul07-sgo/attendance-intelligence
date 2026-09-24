import { describe, it, expect } from 'vitest';
import {
  evaluateMultiClassSkip,
  calculateAttendanceRunway,
  generateAttendanceTrajectory,
} from '../utils/simulationEngine';
import { INITIAL_SUBJECTS, INITIAL_TIMETABLE, INITIAL_ACADEMIC_EVENTS } from '../data/initialData';

describe('Simulation Engine', () => {
  it('Multi-class partial skip on Thursday Sep 24, 2026', () => {
    const subjectsWithTarget = INITIAL_SUBJECTS.map((s) => ({
      ...s,
      subjectMinimumAttendance: 87,
    }));

    // Thursday has 8 classes total. Let's select only the 2 CSE205 classes: tt-thu-2 and tt-thu-3
    const evalResult = evaluateMultiClassSkip(
      '2026-09-24',
      ['tt-thu-2', 'tt-thu-3'],
      subjectsWithTarget,
      INITIAL_TIMETABLE,
      INITIAL_ACADEMIC_EVENTS,
      87
    );

    expect(evalResult.date).toBe('2026-09-24');
    expect(evalResult.dayOfWeek).toBe('Thursday');
    expect(evalResult.isBlackoutDate).toBe(false);
    expect(evalResult.classesOnDay.length).toBe(8);
    expect(evalResult.skippedClassIds.length).toBe(2);

    // CSE205 should show 2 skipped classes (delivered becomes 32 + 2 = 34 => 85.294%)
    const cse205Impact = evalResult.affectedSubjects.find((s) => s.subjectCode === 'CSE205');
    expect(cse205Impact).toBeDefined();
    expect(cse205Impact?.afterSkipDelivered).toBe(34);
    expect(cse205Impact?.afterSkipPercentage).toBeCloseTo(85.294, 3);
    expect(cse205Impact?.afterSkipStatus).toBe('danger');

    // MTH401 was NOT selected to be skipped, so its delivered remains 27
    const mth401Impact = evalResult.affectedSubjects.find((s) => s.subjectCode === 'MTH401');
    expect(mth401Impact?.afterSkipDelivered).toBe(27);
  });

  it('Attendance runway calculation for CSE205 (29/32, target 87%)', () => {
    const cse205 = INITIAL_SUBJECTS.find((s) => s.code === 'CSE205')!;
    const runway = calculateAttendanceRunway(
      cse205,
      87,
      '2026-09-24',
      '2026-12-11',
      INITIAL_TIMETABLE,
      INITIAL_ACADEMIC_EVENTS
    );

    expect(runway.maxClassesCanMiss).toBe(1);
    expect(runway.runwayDays).toBe(1);
    expect(runway.runwayEndDate).toBe('2026-09-24');
    expect(runway.status).toBe('warning');
  });

  it('Trajectory data generator', () => {
    const cse205 = INITIAL_SUBJECTS.find((s) => s.code === 'CSE205')!;
    const points = generateAttendanceTrajectory(cse205, 87, 5);

    expect(points.length).toBe(6);
    expect(points[0].label).toBe('Current');
    expect(points[0].percentage).toBeCloseTo(90.625, 3);
    expect(points[1].label).toBe('+1 miss');
    expect(points[1].percentage).toBeCloseTo(87.879, 3);
    expect(points[2].label).toBe('+2 misses');
    expect(points[2].percentage).toBeCloseTo(85.294, 3);
    expect(points[2].status).toBe('danger');
  });
});
