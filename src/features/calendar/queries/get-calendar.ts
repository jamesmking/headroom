import 'server-only';

import type {CalendarEvent} from '@/features/calendar/types';
import type {MeetingRecord} from '@/features/meetings/queries/get-meetings';
import {getFamilyCalendar, type FamilyCalendarStatus} from '@/features/family-calendar/ical';
import {getMeetingEventsForDates} from '@/features/meetings/queries/get-meetings';
import {getIcalUrl} from '@/features/settings/queries/get-settings';
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
 * The two sources are fetched concurrently and the family calendar can never
 * take the page down with it: `getFamilyCalendar` always resolves, and its
 * failure surfaces as a status the UI renders as an inline warning.
 */
export const getCalendarData = async (
  userId: string,
  dateKeys: DateKey[],
  timeZone: string
): Promise<CalendarData> => {
  const [meetings, family] = await Promise.all([
    getMeetingEventsForDates(userId, dateKeys),
    getIcalUrl(userId).then(icalUrl => getFamilyCalendar({icalUrl, dateKeys, timeZone})),
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
