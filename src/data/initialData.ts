import type { Subject, TimetableEntry, AcademicEvent, AppSettings } from '../types';

export const INITIAL_SETTINGS: AppSettings = {
  defaultTarget: 87,
  baselineDate: '2026-09-24',
  termEndDate: '2026-12-11',
  theme: 'light',
};

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj-cse202',
    code: 'CSE202',
    name: 'Object Oriented Programming',
    faculty: 'Aryan Tyagi',
    attended: 24,
    delivered: 28,
    subjectMinimumAttendance: null,
  },
  {
    id: 'subj-cse205',
    code: 'CSE205',
    name: 'Data Structures and Algorithms',
    faculty: 'Aryan Tyagi',
    attended: 29,
    delivered: 32,
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
  {
    id: 'subj-cse306',
    code: 'CSE306',
    name: 'Computer Networks',
    faculty: 'Sarabmeet Singh Masson',
    attended: 24,
    delivered: 25,
    subjectMinimumAttendance: null,
  },
  {
    id: 'subj-int335',
    code: 'INT335',
    name: 'Design Thinking',
    faculty: 'Komal Gupta',
    attended: 9,
    delivered: 13,
    subjectMinimumAttendance: null,
  },
  {
    id: 'subj-mth401',
    code: 'MTH401',
    name: 'Discrete Mathematics',
    faculty: 'Dr. Babli Yadav',
    attended: 23,
    delivered: 27,
    subjectMinimumAttendance: null,
  },
  {
    id: 'subj-pel132',
    code: 'PEL132',
    name: 'Communication Skills-II',
    faculty: 'Namrata Sethi',
    attended: 24,
    delivered: 25,
    subjectMinimumAttendance: null,
  },
];

export const INITIAL_TIMETABLE: TimetableEntry[] = [
  // Monday
  { id: 'tt-mon-1', day: 'Monday', startTime: '09:20', endTime: '10:10', subjectCode: 'CSE205', type: 'Lecture' },
  { id: 'tt-mon-2', day: 'Monday', startTime: '10:10', endTime: '11:00', subjectCode: 'CSE205', type: 'Lecture' },
  { id: 'tt-mon-3', day: 'Monday', startTime: '11:00', endTime: '11:50', subjectCode: 'MTH401', type: 'Lecture' },
  { id: 'tt-mon-4', day: 'Monday', startTime: '11:50', endTime: '12:40', subjectCode: 'CSE202', type: 'Practical' },
  { id: 'tt-mon-5', day: 'Monday', startTime: '12:40', endTime: '13:30', subjectCode: 'CSE202', type: 'Practical' },
  { id: 'tt-mon-6', day: 'Monday', startTime: '13:30', endTime: '14:20', subjectCode: 'PEL132', type: 'Practical' },
  { id: 'tt-mon-7', day: 'Monday', startTime: '15:10', endTime: '16:00', subjectCode: 'INT335', type: 'Lecture' },

  // Tuesday
  { id: 'tt-tue-1', day: 'Tuesday', startTime: '09:20', endTime: '10:10', subjectCode: 'MTH401', type: 'Tutorial' },
  { id: 'tt-tue-2', day: 'Tuesday', startTime: '10:10', endTime: '11:00', subjectCode: 'CSE205', type: 'Practical' },
  { id: 'tt-tue-3', day: 'Tuesday', startTime: '11:00', endTime: '11:50', subjectCode: 'CSE205', type: 'Practical' },
  { id: 'tt-tue-4', day: 'Tuesday', startTime: '11:50', endTime: '12:40', subjectCode: 'CSE306', type: 'Lecture' },
  { id: 'tt-tue-5', day: 'Tuesday', startTime: '12:40', endTime: '13:30', subjectCode: 'CSE202', type: 'Lecture' },
  { id: 'tt-tue-6', day: 'Tuesday', startTime: '13:30', endTime: '14:20', subjectCode: 'CSE202', type: 'Lecture' },

  // Wednesday
  { id: 'tt-wed-1', day: 'Wednesday', startTime: '11:00', endTime: '11:50', subjectCode: 'MTH401', type: 'Lecture' },
  { id: 'tt-wed-2', day: 'Wednesday', startTime: '12:40', endTime: '13:30', subjectCode: 'CSE276', type: 'Lecture' },
  { id: 'tt-wed-3', day: 'Wednesday', startTime: '13:30', endTime: '14:20', subjectCode: 'CSE276', type: 'Lecture' },
  { id: 'tt-wed-4', day: 'Wednesday', startTime: '14:20', endTime: '15:10', subjectCode: 'PEL132', type: 'Practical' },
  { id: 'tt-wed-5', day: 'Wednesday', startTime: '15:10', endTime: '16:00', subjectCode: 'PEL132', type: 'Practical' },

  // Thursday
  { id: 'tt-thu-1', day: 'Thursday', startTime: '09:20', endTime: '10:10', subjectCode: 'INT335', type: 'Lecture' },
  { id: 'tt-thu-2', day: 'Thursday', startTime: '10:10', endTime: '11:00', subjectCode: 'CSE205', type: 'Lecture' },
  { id: 'tt-thu-3', day: 'Thursday', startTime: '11:00', endTime: '11:50', subjectCode: 'CSE205', type: 'Lecture' },
  { id: 'tt-thu-4', day: 'Thursday', startTime: '11:50', endTime: '12:40', subjectCode: 'CSE276', type: 'Practical' },
  { id: 'tt-thu-5', day: 'Thursday', startTime: '12:40', endTime: '13:30', subjectCode: 'CSE276', type: 'Practical' },
  { id: 'tt-thu-6', day: 'Thursday', startTime: '14:20', endTime: '15:10', subjectCode: 'CSE306', type: 'Practical' },
  { id: 'tt-thu-7', day: 'Thursday', startTime: '15:10', endTime: '16:00', subjectCode: 'CSE306', type: 'Practical' },
  { id: 'tt-thu-8', day: 'Thursday', startTime: '16:00', endTime: '16:50', subjectCode: 'PEL132', type: 'Lecture' },

  // Friday
  { id: 'tt-fri-1', day: 'Friday', startTime: '11:00', endTime: '11:50', subjectCode: 'MTH401', type: 'Lecture' },
  { id: 'tt-fri-2', day: 'Friday', startTime: '12:40', endTime: '13:30', subjectCode: 'CSE202', type: 'Lecture' },
  { id: 'tt-fri-3', day: 'Friday', startTime: '13:30', endTime: '14:20', subjectCode: 'CSE202', type: 'Lecture' },
  { id: 'tt-fri-4', day: 'Friday', startTime: '14:20', endTime: '15:10', subjectCode: 'CSE306', type: 'Lecture' },
];

export const INITIAL_ACADEMIC_EVENTS: AcademicEvent[] = [
  {
    id: 'evt-mtt',
    name: 'Mid Term Test (MTT)',
    startDate: '2026-10-01',
    endDate: '2026-10-09',
    type: 'exam',
    noRegularClasses: true,
    description: 'No regular classes during Mid Term Examination period.',
  },
  {
    id: 'evt-term-break',
    name: 'Term Break',
    startDate: '2026-11-07',
    endDate: '2026-11-10',
    type: 'break',
    noRegularClasses: true,
    description: 'Autumn Term Mid-semester break.',
  },
  {
    id: 'evt-end-term',
    name: 'End Term Examination',
    startDate: '2026-12-14',
    endDate: '2026-12-30',
    type: 'exam',
    noRegularClasses: true,
    description: 'End Term Examination period.',
  },
  {
    id: 'evt-winter-vac',
    name: 'Winter Vacation',
    startDate: '2026-12-31',
    endDate: '2027-01-10',
    type: 'vacation',
    noRegularClasses: true,
    description: 'Winter Vacation before Spring Term.',
  },
];
