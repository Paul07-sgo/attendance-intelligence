import type { Subject, SubjectCalculation, AggregateCalculation, AttendanceStatus } from '../types';

/**
 * Calculates current attendance percentage.
 * Returns 0 if delivered is 0 or negative.
 */
export function calculateAttendancePercentage(attended: number, delivered: number): number {
  if (delivered <= 0) return 0;
  const safeAttended = Math.max(0, Math.min(attended, delivered));
  return (safeAttended / delivered) * 100;
}

/**
 * Calculates the maximum integer number of future classes a student can miss
 * while keeping attendance >= target percentage.
 */
export function calculateClassesCanMiss(
  attended: number,
  delivered: number,
  targetPercentage: number
): number {
  if (delivered <= 0) return 0;
  if (targetPercentage <= 0) return 999;
  if (targetPercentage >= 100) return 0;

  const R = targetPercentage / 100;
  const safeAttended = Math.max(0, Math.min(attended, delivered));

  // A / (T + m) >= R  =>  T + m <= A / R  =>  m <= (A / R) - T
  const maxMissFloat = safeAttended / R - delivered;

  if (maxMissFloat < 0) return 0;
  return Math.floor(maxMissFloat + 1e-9);
}

/**
 * Calculates the minimum integer number of future classes a student must attend sequentially
 * to reach or exceed the target percentage.
 * Returns Infinity if target is 100% and attended < delivered (impossible recovery).
 * Returns 0 if already at or above target.
 */
export function calculateClassesNeeded(
  attended: number,
  delivered: number,
  targetPercentage: number
): number {
  if (delivered <= 0) return 0;
  const safeAttended = Math.max(0, Math.min(attended, delivered));
  const currentPct = (safeAttended / delivered) * 100;

  if (currentPct >= targetPercentage - 1e-9) return 0;

  if (targetPercentage >= 100) {
    return safeAttended < delivered ? Infinity : 0;
  }

  const R = targetPercentage / 100;
  // (A + n) / (T + n) >= R  =>  A + n >= R*T + R*n  =>  n*(1 - R) >= R*T - A  =>  n >= (R*T - A) / (1 - R)
  const requiredFloat = (R * delivered - safeAttended) / (1 - R);

  if (requiredFloat <= 0) return 0;
  return Math.ceil(requiredFloat - 1e-9);
}

/**
 * Calculates attendance percentage if the student misses X upcoming classes.
 */
export function calculateWhatIfMiss(
  attended: number,
  delivered: number,
  missCount: number
): number {
  const safeMiss = Math.max(0, Math.floor(missCount));
  const safeAttended = Math.max(0, Math.min(attended, delivered));
  const newDelivered = delivered + safeMiss;
  return calculateAttendancePercentage(safeAttended, newDelivered);
}

/**
 * Calculates attendance percentage if the student attends X upcoming classes.
 */
export function calculateWhatIfAttend(
  attended: number,
  delivered: number,
  attendCount: number
): number {
  const safeAttend = Math.max(0, Math.floor(attendCount));
  const safeAttended = Math.max(0, Math.min(attended, delivered));
  const newAttended = safeAttended + safeAttend;
  const newDelivered = delivered + safeAttend;
  return calculateAttendancePercentage(newAttended, newDelivered);
}

/**
 * Calculates aggregate attendance percentage after missing X classes across pooled total.
 */
export function calculateAggregateWhatIfMiss(
  totalAttended: number,
  totalConducted: number,
  missCount: number
): number {
  const safeMiss = Math.max(0, Math.floor(missCount));
  const newConducted = totalConducted + safeMiss;
  return calculateAttendancePercentage(totalAttended, newConducted);
}

/**
 * Calculates aggregate attendance percentage after attending X additional classes across pooled total.
 */
export function calculateAggregateWhatIfAttend(
  totalAttended: number,
  totalConducted: number,
  attendCount: number
): number {
  const safeAttend = Math.max(0, Math.floor(attendCount));
  const newAttended = totalAttended + safeAttend;
  const newConducted = totalConducted + safeAttend;
  return calculateAttendancePercentage(newAttended, newConducted);
}

/**
 * Determines subject attendance status.
 * Returns 'no_target' if targetPercentage is null.
 */
export function getAttendanceStatus(
  currentPercentage: number,
  targetPercentage: number | null,
  classesCanMiss: number | null
): AttendanceStatus {
  if (targetPercentage === null || targetPercentage === undefined) {
    return 'no_target';
  }
  if (currentPercentage < targetPercentage - 1e-9) {
    return 'danger';
  }
  if (classesCanMiss !== null && classesCanMiss <= 1) {
    return 'warning';
  }
  return 'safe';
}

/**
 * Computes deterministic aggregate calculations across all included subjects.
 * Formula: sum(attended) / sum(conducted) * 100
 */
export function calculateAggregateStats(
  subjects: Subject[],
  overallTarget: number
): AggregateCalculation {
  const totalAttended = subjects.reduce(
    (acc, s) => acc + Math.max(0, Math.min(s.attended, s.delivered)),
    0
  );
  const totalConducted = subjects.reduce((acc, s) => acc + Math.max(0, s.delivered), 0);
  const currentPercentage = calculateAttendancePercentage(totalAttended, totalConducted);
  const bufferPercentage = currentPercentage - overallTarget;
  const safeMissBudget = calculateClassesCanMiss(totalAttended, totalConducted, overallTarget);
  const classesNeededToRecover = calculateClassesNeeded(totalAttended, totalConducted, overallTarget);
  const isAboveTarget = currentPercentage >= overallTarget - 1e-9;

  return {
    totalAttended,
    totalConducted,
    currentPercentage,
    overallTarget,
    bufferPercentage,
    safeMissBudget,
    classesNeededToRecover,
    isAboveTarget,
  };
}

/**
 * Computes subject stats.
 * Uses subjectMinimumAttendance if explicitly set (number), otherwise null (no individual target).
 */
export function calculateSubjectStats(
  subject: Subject,
  _globalTarget?: number,
  totalScheduledFutureClasses: number = 0
): SubjectCalculation {
  const subjectMinimumAttendance =
    subject.subjectMinimumAttendance !== undefined
      ? subject.subjectMinimumAttendance
      : subject.targetOverride !== undefined
      ? subject.targetOverride
      : null;

  const currentPercentage = calculateAttendancePercentage(subject.attended, subject.delivered);

  if (subjectMinimumAttendance === null || subjectMinimumAttendance === undefined) {
    return {
      subject,
      subjectMinimumAttendance: null,
      currentPercentage,
      status: 'no_target',
      classesCanMiss: null,
      classesNeededToRecover: null,
      totalScheduledFutureClasses,
    };
  }

  const classesCanMiss = calculateClassesCanMiss(
    subject.attended,
    subject.delivered,
    subjectMinimumAttendance
  );
  const classesNeededToRecover = calculateClassesNeeded(
    subject.attended,
    subject.delivered,
    subjectMinimumAttendance
  );
  const status = getAttendanceStatus(
    currentPercentage,
    subjectMinimumAttendance,
    classesCanMiss
  );

  return {
    subject,
    subjectMinimumAttendance,
    currentPercentage,
    status,
    classesCanMiss,
    classesNeededToRecover,
    totalScheduledFutureClasses,
  };
}

