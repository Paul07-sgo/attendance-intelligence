import type {
  DayOfWeek,
  TimetableEntry,
  AcademicEvent,
  Subject,
  SkipDayEvaluation,
  SkipDaySubjectImpact,
  AppSettings,
  BaselineSnapshot,
} from '../types';
import { calculateAttendancePercentage, getAttendanceStatus, calculateClassesCanMiss } from './attendanceEngine';
import { isOccurrenceAfterBaselineCutoff } from './occurrenceEngine';

export const DAY_NAMES: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Parses a YYYY-MM-DD string into a local Date object set to midnight.
 */
export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats a Date object into a YYYY-MM-DD string.
 */
export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns day of week name ('Monday' .. 'Sunday') for a given Date or YYYY-MM-DD string.
 */
export function getDayOfWeek(dateInput: Date | string): DayOfWeek {
  const d = typeof dateInput === 'string' ? parseISODate(dateInput) : dateInput;
  return DAY_NAMES[d.getDay()];
}

/**
 * Checks if a date falls inside any active blackout academic event (e.g. MTT, term break, exam).
 */
export function isAcademicBlackoutDate(
  dateStr: string,
  events: AcademicEvent[]
): { isBlackout: boolean; event?: AcademicEvent } {
  for (const evt of events) {
    if (!evt.noRegularClasses) continue;
    if (dateStr >= evt.startDate && dateStr <= evt.endDate) {
      return { isBlackout: true, event: evt };
    }
  }
  return { isBlackout: false };
}

/**
 * Checks whether a given date is a teaching day (not a weekend and not an academic blackout date).
 */
export function isTeachingDay(dateStr: string, events: AcademicEvent[]): boolean {
  const dayName = getDayOfWeek(dateStr);
  if (dayName === 'Saturday' || dayName === 'Sunday') {
    return false;
  }
  const { isBlackout } = isAcademicBlackoutDate(dateStr, events);
  return !isBlackout;
}

/**
 * Returns all timetable classes occurring on a specific date, accounting for academic breaks & weekends.
 */
export function getClassesForDate(
  dateStr: string,
  timetable: TimetableEntry[],
  events: AcademicEvent[]
): TimetableEntry[] {
  if (!isTeachingDay(dateStr, events)) {
    return [];
  }
  const dayName = getDayOfWeek(dateStr);
  return timetable
    .filter((entry) => entry.day === dayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export interface UpcomingClassOccurrence {
  date: string;
  dayOfWeek: DayOfWeek;
  entry: TimetableEntry;
}

/**
 * Returns all scheduled future classes for a subject between startDate (inclusive) and endDate (inclusive).
 * Explicitly respects academic blackout dates, weekends, and baseline cutoff.
 */
export function getUpcomingClassesForSubject(
  subjectCode: string,
  startDateStr: string,
  endDateStr: string,
  timetable: TimetableEntry[],
  events: AcademicEvent[],
  cutoffInput?: BaselineSnapshot | AppSettings | string | null
): UpcomingClassOccurrence[] {
  const occurrences: UpcomingClassOccurrence[] = [];
  let current = parseISODate(startDateStr);
  const end = parseISODate(endDateStr);

  while (current <= end) {
    const curStr = formatISODate(current);
    if (isTeachingDay(curStr, events)) {
      const dayName = getDayOfWeek(curStr);
      const dayClasses = timetable.filter(
        (t) => t.day === dayName && t.subjectCode === subjectCode
      );
      for (const entry of dayClasses) {
        if (cutoffInput && !isOccurrenceAfterBaselineCutoff(curStr, entry.startTime, cutoffInput)) {
          continue;
        }
        occurrences.push({
          date: curStr,
          dayOfWeek: dayName,
          entry,
        });
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return occurrences;
}

/**
 * Counts total scheduled future classes for a subject up to term end.
 */
export function countFutureClassesForSubject(
  subjectCode: string,
  startDateStr: string,
  endDateStr: string,
  timetable: TimetableEntry[],
  events: AcademicEvent[],
  cutoffInput?: BaselineSnapshot | AppSettings | string | null
): number {
  return getUpcomingClassesForSubject(subjectCode, startDateStr, endDateStr, timetable, events, cutoffInput).length;
}

/**
 * Evaluates the attendance impact of skipping all classes on a selected date.
 */
export function evaluateSkipDay(
  dateStr: string,
  subjects: Subject[],
  timetable: TimetableEntry[],
  events: AcademicEvent[],
  globalTarget: number
): SkipDayEvaluation {
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

  // Group classes by subject
  const subjectClassCounts: Record<string, number> = {};
  for (const c of classesOnDay) {
    subjectClassCounts[c.subjectCode] = (subjectClassCounts[c.subjectCode] || 0) + 1;
  }

  const affectedSubjects: SkipDaySubjectImpact[] = [];
  let safeCount = 0;
  let warningCount = 0;
  let dangerCount = 0;
  let noTargetCount = 0;

  const totalAttended = subjects.reduce((sum, s) => sum + Math.max(0, Math.min(s.attended, s.delivered)), 0);
  const totalConducted = subjects.reduce((sum, s) => sum + Math.max(0, s.delivered), 0);
  const currentAggregatePercentage = calculateAttendancePercentage(totalAttended, totalConducted);
  const afterSkipAggregatePercentage = calculateAttendancePercentage(totalAttended, totalConducted + classesOnDay.length);
  const aggregateBuffer = afterSkipAggregatePercentage - globalTarget;

  for (const subj of subjects) {
    const scheduledCount = subjectClassCounts[subj.code] || 0;
    const target = subj.subjectMinimumAttendance ?? subj.targetOverride ?? null;

    const curPct = calculateAttendancePercentage(subj.attended, subj.delivered);
    const curCanMiss = target !== null ? calculateClassesCanMiss(subj.attended, subj.delivered, target) : null;
    const curStatus = getAttendanceStatus(curPct, target, curCanMiss);

    const afterSkipAttended = subj.attended;
    const afterSkipDelivered = subj.delivered + scheduledCount;
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
      scheduledClassesCount: scheduledCount,
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

  return {
    date: dateStr,
    dayOfWeek,
    isBlackoutDate: isWeekend || isBlackout,
    blackoutReason,
    totalClassesOnDay: classesOnDay.length,
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
