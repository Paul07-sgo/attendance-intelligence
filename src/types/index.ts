export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type ClassType = 'Lecture' | 'Tutorial' | 'Practical';

export interface Subject {
  id: string;
  code: string;
  name: string;
  faculty: string;
  attended: number;
  delivered: number;
  subjectMinimumAttendance?: number | null; // null if no individual subject target
  targetOverride?: number | null; // optional alias for backwards compatibility
}

export interface TimetableEntry {
  id: string;
  day: DayOfWeek;
  startTime: string; // HH:mm format, e.g., "09:20"
  endTime: string;   // HH:mm format, e.g., "10:10"
  subjectCode: string;
  type: ClassType;
  room?: string;
  group?: string;
}

export type AcademicEventType = 'exam' | 'break' | 'vacation' | 'holiday';

export interface AcademicEvent {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  type: AcademicEventType;
  noRegularClasses: boolean;
  description?: string;
}

export type AttendanceStatus = 'safe' | 'warning' | 'danger' | 'no_target';

export interface SubjectCalculation {
  subject: Subject;
  subjectMinimumAttendance: number | null;
  currentPercentage: number;
  status: AttendanceStatus;
  classesCanMiss: number | null;
  classesNeededToRecover: number | null;
  totalScheduledFutureClasses: number;
}

export interface AggregateCalculation {
  totalAttended: number;
  totalConducted: number;
  currentPercentage: number;
  overallTarget: number;
  bufferPercentage: number;
  safeMissBudget: number;
  classesNeededToRecover: number;
  isAboveTarget: boolean;
}

export interface SkipDaySubjectImpact {
  subjectCode: string;
  subjectName: string;
  scheduledClassesCount: number;
  currentAttended: number;
  currentDelivered: number;
  currentPercentage: number;
  afterSkipAttended: number;
  afterSkipDelivered: number;
  afterSkipPercentage: number;
  subjectMinimumAttendance: number | null;
  currentStatus: AttendanceStatus;
  afterSkipStatus: AttendanceStatus;
}

export interface SkipDayEvaluation {
  date: string;
  dayOfWeek: DayOfWeek;
  isBlackoutDate: boolean;
  blackoutReason?: string;
  totalClassesOnDay: number;
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

export interface AppSettings {
  defaultTarget: number; // e.g. 87
  baselineDate: string;  // e.g. '2026-09-24'
  termEndDate: string;   // e.g. '2026-12-11'
  theme: 'light' | 'dark';
}

export type OccurrenceStatus =
  | 'UPCOMING'
  | 'IN_PROGRESS'
  | 'ATTENDANCE_PENDING'
  | 'PRESENT'
  | 'ABSENT'
  | 'NOT_DELIVERED';

export type ResolvedOutcome = 'PRESENT' | 'ABSENT' | 'NOT_DELIVERED';

export interface ClassOccurrence {
  id: string; // e.g. "CSE205-2026-09-24-10:10"
  subjectCode: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: ClassType;
  room?: string;
  group?: string;
  status: OccurrenceStatus;
  resolvedAt?: string;
}


