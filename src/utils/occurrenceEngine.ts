import type {
  Subject,
  TimetableEntry,
  AcademicEvent,
  ClassOccurrence,
  OccurrenceStatus,
  AppSettings,
  BaselineSnapshot,
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
 * Normalizes baseline cutoff date and time into a BaselineSnapshot object.
 */
export function getBaselineSnapshot(
  cutoffInput?: BaselineSnapshot | AppSettings | string | null
): BaselineSnapshot {
  if (!cutoffInput) {
    return { date: '2026-09-24', time: '23:59', timezone: 'local' };
  }

  if (typeof cutoffInput === 'string') {
    if (cutoffInput.includes('T') || cutoffInput.includes(' ')) {
      const parts = cutoffInput.replace('T', ' ').split(' ');
      return { date: parts[0], time: parts[1].substring(0, 5), timezone: 'local' };
    }
    return { date: cutoffInput, time: '23:59', timezone: 'local' };
  }

  if ('baselineSnapshot' in cutoffInput && cutoffInput.baselineSnapshot) {
    return {
      date: cutoffInput.baselineSnapshot.date,
      time: cutoffInput.baselineSnapshot.time || '23:59',
      timezone: cutoffInput.baselineSnapshot.timezone || 'local',
    };
  }

  if ('baselineDate' in cutoffInput && cutoffInput.baselineDate) {
    return {
      date: cutoffInput.baselineDate,
      time: cutoffInput.baselineCutoffTime || '23:59',
      timezone: 'local',
    };
  }

  if ('date' in cutoffInput && cutoffInput.date) {
    return {
      date: (cutoffInput as BaselineSnapshot).date,
      time: (cutoffInput as BaselineSnapshot).time || '23:59',
      timezone: (cutoffInput as BaselineSnapshot).timezone || 'local',
    };
  }

  return { date: '2026-09-24', time: '23:59', timezone: 'local' };
}

/**
 * Checks whether an occurrence (date & startTime) is strictly AFTER the baseline cutoff.
 * Historical occurrences (<= baseline cutoff) are represented by the baseline snapshot and MUST NOT be processed as future events.
 */
export function isOccurrenceAfterBaselineCutoff(
  occDate: string,
  occStartTime: string,
  cutoffInput?: BaselineSnapshot | AppSettings | string | null
): boolean {
  const snapshot = getBaselineSnapshot(cutoffInput);

  if (occDate > snapshot.date) {
    return true;
  }
  if (occDate < snapshot.date) {
    return false;
  }
  const snapshotTime = snapshot.time || '23:59';
  return occStartTime > snapshotTime;
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
 * Reconciles scheduled timetable occurrences from baseline cutoff up to current date/time.
 * Only processes occurrences strictly AFTER the baseline cutoff.
 */
export function reconcileOccurrences(
  cutoffInput: BaselineSnapshot | AppSettings | string,
  timetable: TimetableEntry[],
  events: AcademicEvent[],
  storedOccurrences: Record<string, ClassOccurrence>,
  now: Date = new Date()
): ClassOccurrence[] {
  const snapshot = getBaselineSnapshot(cutoffInput);
  const occurrences: ClassOccurrence[] = [];
  const todayStr = formatISODate(now);

  let cur = parseISODate(snapshot.date);
  const end = parseISODate(todayStr);

  while (cur <= end) {
    const curDateStr = formatISODate(cur);

    if (isTeachingDay(curDateStr, events)) {
      const dayClasses = getClassesForDate(curDateStr, timetable, events);

      for (const entry of dayClasses) {
        // Core Rule: Ignore occurrences before or at baseline cutoff
        if (!isOccurrenceAfterBaselineCutoff(curDateStr, entry.startTime, snapshot)) {
          continue;
        }

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
 * - Only occurrences strictly AFTER baseline cutoff modify attendance!
 * - Historical baseline occurrences contribute +0 attended, +0 conducted.
 * - PRESENT: conducted +1, attended +1
 * - ABSENT: conducted +1, attended +0
 * - NOT_DELIVERED: conducted +0, attended +0
 * - UPCOMING / IN_PROGRESS / ATTENDANCE_PENDING: conducted +0, attended +0
 */
export function getEffectiveSubjects(
  subjects: Subject[],
  occurrences: Record<string, ClassOccurrence>,
  cutoffInput?: BaselineSnapshot | AppSettings | string | null
): Subject[] {
  const snapshot = cutoffInput ? getBaselineSnapshot(cutoffInput) : null;

  return subjects.map((subj) => {
    let addAttended = 0;
    let addConducted = 0;

    Object.values(occurrences).forEach((occ) => {
      if (occ.subjectCode === subj.code) {
        // Ignore baseline-overlapping occurrences
        if (snapshot && !isOccurrenceAfterBaselineCutoff(occ.date, occ.startTime, snapshot)) {
          return;
        }

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
