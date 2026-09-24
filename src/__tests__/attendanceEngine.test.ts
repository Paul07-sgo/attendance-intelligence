import { describe, it, expect } from 'vitest';
import {
  calculateAttendancePercentage,
  calculateClassesCanMiss,
  calculateClassesNeeded,
  calculateWhatIfMiss,
  calculateWhatIfAttend,
  calculateAggregateStats,
  calculateAggregateWhatIfMiss,
  calculateAggregateWhatIfAttend,
  calculateSubjectStats,
  getAttendanceStatus,
} from '../utils/attendanceEngine';
import type { Subject } from '../types';

describe('Attendance Calculation Engine', () => {
  const sampleSubjects: Subject[] = [
    { id: '1', code: 'CSE202', name: 'OOP', faculty: 'A', attended: 24, delivered: 28, subjectMinimumAttendance: null },
    { id: '2', code: 'CSE205', name: 'DSA', faculty: 'A', attended: 29, delivered: 32, subjectMinimumAttendance: null },
    { id: '3', code: 'CSE276', name: 'AI', faculty: 'B', attended: 23, delivered: 24, subjectMinimumAttendance: null },
    { id: '4', code: 'CSE306', name: 'CN', faculty: 'C', attended: 24, delivered: 25, subjectMinimumAttendance: null },
    { id: '5', code: 'INT335', name: 'DT', faculty: 'D', attended: 9, delivered: 13, subjectMinimumAttendance: null },
    { id: '6', code: 'MTH401', name: 'DM', faculty: 'E', attended: 23, delivered: 27, subjectMinimumAttendance: null },
    { id: '7', code: 'PEL132', name: 'CS', faculty: 'F', attended: 24, delivered: 25, subjectMinimumAttendance: null },
  ];

  it('1. Current percentage calculation', () => {
    expect(calculateAttendancePercentage(29, 32)).toBeCloseTo(90.625, 4);
    expect(calculateAttendancePercentage(24, 28)).toBeCloseTo(85.714, 3);
    expect(calculateAttendancePercentage(9, 13)).toBeCloseTo(69.23, 2);
  });

  it('2. Classes can miss (target 87%)', () => {
    expect(calculateClassesCanMiss(29, 32, 87)).toBe(1);
    expect(calculateClassesCanMiss(23, 24, 87)).toBe(2);
    expect(calculateClassesCanMiss(24, 25, 87)).toBe(2);
  });

  it('3. Classes needed to reach target', () => {
    expect(calculateClassesNeeded(23, 27, 87)).toBe(4);
    expect(calculateClassesNeeded(9, 13, 87)).toBe(18);
    expect(calculateClassesNeeded(29, 32, 87)).toBe(0);
  });

  it('4. What-if absence', () => {
    expect(calculateWhatIfMiss(29, 32, 2)).toBeCloseTo(85.294, 3);
    expect(calculateWhatIfMiss(29, 32, 0)).toBeCloseTo(90.625, 3);
  });

  it('5. What-if attendance', () => {
    expect(calculateWhatIfAttend(9, 13, 5)).toBeCloseTo(77.778, 3);
  });

  it('6. CURRENT AGGREGATE (156 / 174 = 89.66%)', () => {
    const agg = calculateAggregateStats(sampleSubjects, 87);
    expect(agg.totalAttended).toBe(156);
    expect(agg.totalConducted).toBe(174);
    expect(agg.currentPercentage).toBeCloseTo(89.655172, 4);
    expect(agg.currentPercentage.toFixed(2)).toBe('89.66');
    expect(agg.safeMissBudget).toBe(5);
  });

  it('7. AGGREGATE MISS SCENARIOS', () => {
    const totalAttended = 156;
    const totalConducted = 174;

    // Miss 1: 156/175 = 89.14%
    const miss1 = calculateAggregateWhatIfMiss(totalAttended, totalConducted, 1);
    expect(miss1.toFixed(2)).toBe('89.14');

    // Miss 3: 156/177 = 88.14%
    const miss3 = calculateAggregateWhatIfMiss(totalAttended, totalConducted, 3);
    expect(miss3.toFixed(2)).toBe('88.14');

    // Miss 5: 156/179 = 87.15%
    const miss5 = calculateAggregateWhatIfMiss(totalAttended, totalConducted, 5);
    expect(miss5.toFixed(2)).toBe('87.15');

    // Miss 6: 156/180 = 86.67%
    const miss6 = calculateAggregateWhatIfMiss(totalAttended, totalConducted, 6);
    expect(miss6.toFixed(2)).toBe('86.67');
  });

  it('8. AGGREGATE ATTEND SCENARIOS', () => {
    const totalAttended = 156;
    const totalConducted = 174;

    // Attend 1: 157/175 = 89.71%
    const attend1 = calculateAggregateWhatIfAttend(totalAttended, totalConducted, 1);
    expect(attend1.toFixed(2)).toBe('89.71');

    // Attend 3: 159/177 = 89.83%
    const attend3 = calculateAggregateWhatIfAttend(totalAttended, totalConducted, 3);
    expect(attend3.toFixed(2)).toBe('89.83');
  });

  it('9. SUBJECT MISS AND ATTEND SCENARIOS (CSE202: 24/28)', () => {
    // CSE202 Miss 1: 24/29 = 82.76%
    const miss1 = calculateWhatIfMiss(24, 28, 1);
    expect(miss1.toFixed(2)).toBe('82.76');

    // CSE202 Attend 3: 27/31 = 87.10%
    const attend3 = calculateWhatIfAttend(24, 28, 3);
    expect(attend3.toFixed(2)).toBe('87.10');
  });

  it('10. TARGET SEPARATION', () => {
    const subjectWithCustomTarget: Subject = {
      id: 'sub-test',
      code: 'CSE205',
      name: 'DSA',
      faculty: 'A',
      attended: 29,
      delivered: 32,
      subjectMinimumAttendance: 75,
    };

    const calcBefore = calculateSubjectStats(subjectWithCustomTarget, 87);
    expect(calcBefore.subjectMinimumAttendance).toBe(75);

    // Changing overallTarget from 87 to 90
    const calcAfter = calculateSubjectStats(subjectWithCustomTarget, 90);
    expect(calcAfter.subjectMinimumAttendance).toBe(75);

    // Subject with subjectMinimumAttendance: null
    const subjectWithNullTarget: Subject = {
      id: 'sub-null',
      code: 'CSE202',
      name: 'OOP',
      faculty: 'A',
      attended: 24,
      delivered: 28,
      subjectMinimumAttendance: null,
    };

    const calcNullBefore = calculateSubjectStats(subjectWithNullTarget, 87);
    expect(calcNullBefore.subjectMinimumAttendance).toBeNull();
    expect(calcNullBefore.status).toBe('no_target');

    const calcNullAfter = calculateSubjectStats(subjectWithNullTarget, 90);
    expect(calcNullAfter.subjectMinimumAttendance).toBeNull();
    expect(calcNullAfter.status).toBe('no_target');
  });

  it('11. MANDATORY AGGREGATE FORMULA VERIFICATION (sum vs average)', () => {
    // sum(attended) / sum(conducted) = 156 / 174 = 89.65517...%
    const agg = calculateAggregateStats(sampleSubjects, 87);
    expect(agg.currentPercentage).toBeCloseTo(89.65517, 4);

    // Average of subject percentages is DIFFERENT:
    // (85.714 + 90.625 + 95.833 + 96.000 + 69.231 + 85.185 + 96.000) / 7 = 88.3698%
    const pcts = sampleSubjects.map((s) => (s.attended / s.delivered) * 100);
    const avgPct = pcts.reduce((a, b) => a + b, 0) / pcts.length;
    expect(avgPct).toBeCloseTo(88.3698, 2);

    // Ensure our engine uses sum(attended)/sum(conducted) and NOT average!
    expect(agg.currentPercentage).not.toBeCloseTo(avgPct, 1);
  });

  it('Status determination', () => {
    expect(getAttendanceStatus(85, 87, 0)).toBe('danger');
    expect(getAttendanceStatus(88, 87, 1)).toBe('warning');
    expect(getAttendanceStatus(92, 87, 3)).toBe('safe');
    expect(getAttendanceStatus(92, null, null)).toBe('no_target');
  });
});

