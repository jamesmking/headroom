import 'server-only';

import type {CalendarEvent} from '@/features/calendar/types';
import type {MeetingRecord} from '@/features/meetings/queries/get-meetings';
import {getFamilyEvents} from '@/features/family-calendar/queries/get-family-events';
import type {FamilyCalendarStatus} from '@/features/family-calendar/sync-status';
import {getMeetingEventsForDates} from '@/features/meetings/queries/get-meetings';
import type {DateKey} from '@/lib/dates';

export type CalendarData = {
  /** Work meetings and family events combined, sorted chronologically. */
  events: CalendarEvent[];
  /**
   * The editable records behind those events, so opening the editor needs no
   * second round trip. Family events have none and are absent here.
   */
  meetings: MeetingRecord[];
  family: {
    status: FamilyCalendarStatus;
    message: string | null;
    fetchedAt: Date | null;
    eventCount: number;
  };
};

/**
 * Everything on the calendar for a set of days.
 *
 * Both sources are now database reads, issued concurrently. The family
 * calendar used to be fetched and parsed from its provider here, which put
 * about a second of network and CPU on every cold render; it is refreshed on a
 * schedule instead. See `features/family-calendar/sync.ts`.
 *
 * The family calendar still cannot take the page down with it: its status is
 * reported rather than thrown, and the UI renders it as an inline warning.
 */
export const getCalendarData = async (
  userId: string,
  dateKeys: DateKey[]
): Promise<CalendarData> => {
  const [meetings, family] = await Promise.all([
    getMeetingEventsForDates(userId, dateKeys),
    getFamilyEvents({userId, dateKeys}),
  ]);

  const events = [...meetings.events, ...family.events].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      Number(b.allDay) - Number(a.allDay) ||
      a.startMinutes - b.startMinutes ||
      a.endMinutes - b.endMinutes
  );

  return {
    events,
    meetings: meetings.meetings,
    family: {
      status: family.status,
      message: family.message,
      fetchedAt: family.fetchedAt,
      eventCount: family.events.length,
    },
  };
};

/** Group events by their date key, for week views. */
export const groupEventsByDate = (
  events: CalendarEvent[],
  dateKeys: DateKey[]
): Map<DateKey, CalendarEvent[]> => {
  const grouped = new Map<DateKey, CalendarEvent[]>(dateKeys.map(key => [key, []]));
  for (const event of events) {
    grouped.get(event.date)?.push(event);
  }
  return grouped;
};
