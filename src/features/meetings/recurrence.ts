import {type DateKey, daysBetween, isWeekend} from '@/lib/dates';

export type Recurrence = 'NONE' | 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'FORTNIGHTLY';

export type RecurringMeeting = {
  /** The first (or only) date the meeting happens. */
  date: DateKey;
  recurrence: Recurrence;
  /** Inclusive final date, or null for no end. */
  recurrenceEndDate: DateKey | null;
  /** Individually cancelled occurrences. */
  skippedDates: DateKey[];
};

export const RECURRENCE_OPTIONS: {value: Recurrence; label: string}[] = [
  {value: 'NONE', label: 'Does not repeat'},
  {value: 'DAILY', label: 'Every day'},
  {value: 'WEEKDAYS', label: 'Every weekday (Mon–Fri)'},
  {value: 'WEEKLY', label: 'Every week'},
  {value: 'FORTNIGHTLY', label: 'Every two weeks'},
];

export const describeRecurrence = (recurrence: Recurrence): string =>
  RECURRENCE_OPTIONS.find(option => option.value === recurrence)?.label ?? 'Does not repeat';

/**
 * Whether a meeting occurs on a particular day.
 *
 * Recurrence is deliberately limited to the handful of patterns a working week
 * actually needs. Anything more expressive belongs in a real calendar, which
 * this application is explicitly not trying to be.
 */
export const occursOn = (meeting: RecurringMeeting, key: DateKey): boolean => {
  const offset = daysBetween(meeting.date, key);

  // Never before the first occurrence.
  if (offset < 0) return false;

  if (meeting.recurrence === 'NONE') return offset === 0;

  // Past the end of the series.
  if (meeting.recurrenceEndDate && daysBetween(meeting.recurrenceEndDate, key) > 0) return false;

  // This specific occurrence was cancelled.
  if (meeting.skippedDates.includes(key)) return false;

  switch (meeting.recurrence) {
    case 'DAILY':
      return true;
    case 'WEEKDAYS':
      return !isWeekend(key);
    case 'WEEKLY':
      return offset % 7 === 0;
    case 'FORTNIGHTLY':
      return offset % 14 === 0;
    default:
      return false;
  }
};

/** The dates within `keys` on which the meeting occurs. */
export const occurrencesWithin = (meeting: RecurringMeeting, keys: DateKey[]): DateKey[] =>
  keys.filter(key => occursOn(meeting, key));
