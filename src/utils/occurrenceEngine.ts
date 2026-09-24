import type {
  Subject,
  TimetableEntry,
  AcademicEvent,
  ClassOccurrence,
  OccurrenceStatus,
} from '../types';
import { formatISODate, parseISODate, isTeachingDay, getClassesForDate } from './calendarEngine';

/**
 * Generates unique occurrence ID for a scheduled class occurrence.
 * Format: subjectCode-date-startTime (e.g. "CSE205-2026-09-24-10:10")
 */
export function generateOccurrenceId(
  subjectCode: string,
  dateStr: string,
  startTime: string
): string {
  return `${subjectCode}-${dateStr}-${startTime}`;
}

/**
 * Calculates current status of an occurrence based on time comparison or existing resolved state.
 */
export function getOccurrenceStatus(
  dateStr: string,
  startTime: string,
  endTime: string,
  resolvedStatus?: OccurrenceStatus,
  now: Date = new Date()
): OccurrenceStatus {
  if (
    resolvedStatus === 'PRESENT' ||
    resolvedStatus === 'ABSENT' ||
    resolvedStatus === 'NOT_DELIVERED'
  ) {
    return resolvedStatus;
  }

  const todayStr = formatISODate(now);
  const curHours = String(now.getHours()).padStart(2, '0');
  const curMinutes = String(now.getMinutes()).padStart(2, '0');
  const nowHHmm = `${curHours}:${curMinutes}`;

  if (dateStr < todayStr) {
    return 'ATTENDANCE_PENDING';
  }

  if (dateStr === todayStr) {
    if (nowHHmm >= endTime) {
      return 'ATTENDANCE_PENDING';
    }
    if (nowHHmm >= startTime && nowHHmm < endTime) {
      return 'IN_PROGRESS';
    }
  }

  return 'UPCOMING';
}

/**
 * Reconciles scheduled timetable occurrences from baselineDate up to current date/time.
 * Identifies occurrences that have ended and do not yet have a resolved outcome.
 */
export function reconcileOccurrences(
  baselineDate: string,
  timetable: TimetableEntry[],
  events: AcademicEvent[],
  storedOccurrences: Record<string, ClassOccurrence>,
  now: Date = new Date()
): ClassOccurrence[] {
  const occurrences: ClassOccurrence[] = [];
  const todayStr = formatISODate(now);

  let cur = parseISODate(baselineDate);
  const end = parseISODate(todayStr);

  while (cur <= end) {
    const curDateStr = formatISODate(cur);

    if (isTeachingDay(curDateStr, events)) {
      const dayClasses = getClassesForDate(curDateStr, timetable, events);

      for (const entry of dayClasses) {
        const id = generateOccurrenceId(entry.subjectCode, curDateStr, entry.startTime);
        const stored = storedOccurrences[id];

        const resolvedStatus =
          stored?.status === 'PRESENT' ||
          stored?.status === 'ABSENT' ||
          stored?.status === 'NOT_DELIVERED'
            ? stored.status
            : undefined;

        const status = getOccurrenceStatus(
          curDateStr,
          entry.startTime,
          entry.endTime,
          resolvedStatus,
          now
        );

        occurrences.push({
          id,
          subjectCode: entry.subjectCode,
          date: curDateStr,
          startTime: entry.startTime,
          endTime: entry.endTime,
          type: entry.type,
          room: entry.room,
          group: entry.group,
          status,
          resolvedAt: stored?.resolvedAt,
        });
      }
    }

    cur.setDate(cur.getDate() + 1);
  }

  return occurrences;
}

/**
 * Applies resolved class occurrence outcomes on top of baseline subject data.
 *
 * Rules:
 * - PRESENT: conducted +1, attended +1
 * - ABSENT: conducted +1, attended +0
 * - NOT_DELIVERED: conducted +0, attended +0 (numbers remain unchanged)
 * - UPCOMING / IN_PROGRESS / ATTENDANCE_PENDING: conducted +0, attended +0
 */
export function getEffectiveSubjects(
  subjects: Subject[],
  occurrences: Record<string, ClassOccurrence>
): Subject[] {
  return subjects.map((subj) => {
    let addAttended = 0;
    let addConducted = 0;

    Object.values(occurrences).forEach((occ) => {
      if (occ.subjectCode === subj.code) {
        if (occ.status === 'PRESENT') {
          addAttended += 1;
          addConducted += 1;
        } else if (occ.status === 'ABSENT') {
          addConducted += 1;
        }
        // NOT_DELIVERED: addAttended += 0, addConducted += 0
      }
    });

    return {
      ...subj,
      attended: subj.attended + addAttended,
      delivered: subj.delivered + addConducted,
    };
  });
}
