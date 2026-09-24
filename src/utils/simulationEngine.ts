import type {
  Subject,
  TimetableEntry,
  AcademicEvent,
  AttendanceStatus,
  SkipDaySubjectImpact,
} from '../types';
import {
  calculateAttendancePercentage,
  calculateClassesCanMiss,
  getAttendanceStatus,
} from './attendanceEngine';
import {
  getDayOfWeek,
  isAcademicBlackoutDate,
  getClassesForDate,
  getUpcomingClassesForSubject,
} from './calendarEngine';

export interface MultiClassSkipEvaluation {
  date: string;
  dayOfWeek: string;
  isBlackoutDate: boolean;
  blackoutReason?: string;
  classesOnDay: TimetableEntry[];
  skippedClassIds: string[];
  affectedSubjects: SkipDaySubjectImpact[];
  currentAggregatePercentage: number;
  afterSkipAggregatePercentage: number;
  overallTarget: number;
  aggregateBuffer: number;
  summary: {
    safeCount: number;
    warningCount: number;
    dangerCount: number;
    noTargetCount: number;
  };
}

export interface AttendanceRunway {
  maxClassesCanMiss: number;
  runwayDays: number;
  runwayWeeks: number;
  runwayEndDate: string | null;
  status: AttendanceStatus;
}

export interface TrajectoryDataPoint {
  step: number; // 0 = current, 1 = +1 miss, etc.
  label: string;
  attended: number;
  delivered: number;
  percentage: number;
  status: AttendanceStatus;
}

/**
 * Evaluates exact impact of skipping a selected subset of scheduled classes on a specific date.
 */
export function evaluateMultiClassSkip(
  dateStr: string,
  skippedClassIds: string[],
  subjects: Subject[],
  timetable: TimetableEntry[],
  events: AcademicEvent[],
  globalTarget: number
): MultiClassSkipEvaluation {
  const dayOfWeek = getDayOfWeek(dateStr);
  const { isBlackout, event } = isAcademicBlackoutDate(dateStr, events);
  const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

  let blackoutReason: string | undefined;
  if (isWeekend) {
    blackoutReason = `Weekend (${dayOfWeek})`;
  } else if (isBlackout && event) {
    blackoutReason = `${event.name} (${event.startDate} to ${event.endDate})`;
  }

  const classesOnDay = getClassesForDate(dateStr, timetable, events);

  // Filter only selected skipped classes
  const activeSkippedClasses = classesOnDay.filter((c) => skippedClassIds.includes(c.id));

  // Count skipped classes per subject code
  const skippedCountsBySubject: Record<string, number> = {};
  for (const c of activeSkippedClasses) {
    skippedCountsBySubject[c.subjectCode] = (skippedCountsBySubject[c.subjectCode] || 0) + 1;
  }

  // Count total scheduled classes per subject code on that day
  const totalCountsBySubject: Record<string, number> = {};
  for (const c of classesOnDay) {
    totalCountsBySubject[c.subjectCode] = (totalCountsBySubject[c.subjectCode] || 0) + 1;
  }

  const affectedSubjects: SkipDaySubjectImpact[] = [];
  let safeCount = 0;
  let warningCount = 0;
  let dangerCount = 0;
  let noTargetCount = 0;

  for (const subj of subjects) {
    const totalScheduledOnDay = totalCountsBySubject[subj.code] || 0;
    const skippedCountOnDay = skippedCountsBySubject[subj.code] || 0;
    const target = subj.subjectMinimumAttendance ?? subj.targetOverride ?? null;

    const curPct = calculateAttendancePercentage(subj.attended, subj.delivered);
    const curCanMiss = target !== null ? calculateClassesCanMiss(subj.attended, subj.delivered, target) : null;
    const curStatus = getAttendanceStatus(curPct, target, curCanMiss);

    const afterSkipAttended = subj.attended; // missed skipped classes
    const afterSkipDelivered = subj.delivered + skippedCountOnDay;
    const afterSkipPct = calculateAttendancePercentage(afterSkipAttended, afterSkipDelivered);
    const afterSkipCanMiss = target !== null ? calculateClassesCanMiss(afterSkipAttended, afterSkipDelivered, target) : null;
    const afterSkipStatus = getAttendanceStatus(afterSkipPct, target, afterSkipCanMiss);

    if (afterSkipStatus === 'safe') safeCount++;
    else if (afterSkipStatus === 'warning') warningCount++;
    else if (afterSkipStatus === 'danger') dangerCount++;
    else noTargetCount++;

    affectedSubjects.push({
      subjectCode: subj.code,
      subjectName: subj.name,
      scheduledClassesCount: totalScheduledOnDay,
      currentAttended: subj.attended,
      currentDelivered: subj.delivered,
      currentPercentage: curPct,
      afterSkipAttended,
      afterSkipDelivered,
      afterSkipPercentage: afterSkipPct,
      subjectMinimumAttendance: target,
      currentStatus: curStatus,
      afterSkipStatus,
    });
  }

  const totalAttended = subjects.reduce((sum, s) => sum + Math.max(0, Math.min(s.attended, s.delivered)), 0);
  const totalConducted = subjects.reduce((sum, s) => sum + Math.max(0, s.delivered), 0);
  const currentAggregatePercentage = calculateAttendancePercentage(totalAttended, totalConducted);
  const afterSkipAggregatePercentage = calculateAttendancePercentage(totalAttended, totalConducted + activeSkippedClasses.length);
  const aggregateBuffer = afterSkipAggregatePercentage - globalTarget;

  return {
    date: dateStr,
    dayOfWeek,
    isBlackoutDate: isWeekend || isBlackout,
    blackoutReason,
    classesOnDay,
    skippedClassIds,
    affectedSubjects,
    currentAggregatePercentage,
    afterSkipAggregatePercentage,
    overallTarget: globalTarget,
    aggregateBuffer,
    summary: {
      safeCount,
      warningCount,
      dangerCount,
      noTargetCount,
    },
  };
}

/**
 * Calculates how long (in upcoming teaching classes/days/weeks) a student can maintain safe attendance before buffer runs out.
 */
export function calculateAttendanceRunway(
  subject: Subject,
  target: number | null,
  startDateStr: string,
  endDateStr: string,
  timetable: TimetableEntry[],
  events: AcademicEvent[]
): AttendanceRunway {
  const effectiveTarget = subject.subjectMinimumAttendance ?? subject.targetOverride ?? target;
  if (effectiveTarget === null) {
    return {
      maxClassesCanMiss: 0,
      runwayDays: 0,
      runwayWeeks: 0,
      runwayEndDate: null,
      status: 'no_target',
    };
  }

  const maxClassesCanMiss = calculateClassesCanMiss(subject.attended, subject.delivered, effectiveTarget);
  const curPct = calculateAttendancePercentage(subject.attended, subject.delivered);
  const status = getAttendanceStatus(curPct, effectiveTarget, maxClassesCanMiss);

  if (maxClassesCanMiss <= 0) {
    return {
      maxClassesCanMiss: 0,
      runwayDays: 0,
      runwayWeeks: 0,
      runwayEndDate: null,
      status,
    };
  }

  const upcoming = getUpcomingClassesForSubject(
    subject.code,
    startDateStr,
    endDateStr,
    timetable,
    events
  );

  if (upcoming.length === 0) {
    return {
      maxClassesCanMiss,
      runwayDays: 0,
      runwayWeeks: 0,
      runwayEndDate: null,
      status,
    };
  }

  const maxIndex = Math.min(maxClassesCanMiss - 1, upcoming.length - 1);
  const runwayOccurrence = upcoming[maxIndex];

  const runwayDays = maxIndex + 1;
  const runwayWeeks = Math.round((runwayDays / Math.max(1, upcoming.length)) * 14 * 10) / 10;

  return {
    maxClassesCanMiss,
    runwayDays,
    runwayWeeks,
    runwayEndDate: runwayOccurrence?.date || null,
    status,
  };
}

/**
 * Generates trajectory step data points for interactive charts/tables.
 */
export function generateAttendanceTrajectory(
  subject: Subject,
  target: number | null,
  maxSteps: number = 10
): TrajectoryDataPoint[] {
  const effectiveTarget = subject.subjectMinimumAttendance ?? subject.targetOverride ?? target;
  const points: TrajectoryDataPoint[] = [];

  for (let i = 0; i <= maxSteps; i++) {
    const miss = i;
    const delivered = subject.delivered + miss;
    const percentage = calculateAttendancePercentage(subject.attended, delivered);
    const canMiss = effectiveTarget !== null ? calculateClassesCanMiss(subject.attended, delivered, effectiveTarget) : null;
    const status = getAttendanceStatus(percentage, effectiveTarget, canMiss);

    points.push({
      step: miss,
      label: miss === 0 ? 'Current' : `+${miss} miss${miss > 1 ? 'es' : ''}`,
      attended: subject.attended,
      delivered,
      percentage,
      status,
    });
  }

  return points;
}
