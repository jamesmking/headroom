import ical, {type CalendarResponse, type VEvent} from 'node-ical';
import type {CalendarEvent} from '@/features/calendar/types';
import {
  type DateKey,
  addDays,
  dateKeyInZone,
  fromDateKey,
  localDateKey,
  minutesInZone,
} from '@/lib/dates';
import {MINUTES_IN_DAY} from '@/lib/time';

/**
 * Pure ICS -> CalendarEvent conversion.
 *
 * Kept free of fetching, caching and `server-only` so the mapping rules — all
 * day expansion, timezone conversion, midnight truncation — can be tested
 * directly against fixture calendars.
 */

const isVEvent = (value: unknown): value is VEvent =>
  typeof value === 'object' && value !== null && (value as {type?: string}).type === 'VEVENT';

/** ICS summaries can arrive as an object carrying parameters. */
const readSummary = (summary: unknown): string => {
  if (typeof summary === 'string') return summary.trim() || 'Busy';
  if (summary && typeof summary === 'object' && 'val' in summary) {
    const value = (summary as {val?: unknown}).val;
    if (typeof value === 'string') return value.trim() || 'Busy';
  }
  return 'Busy';
};

const readNotes = (event: VEvent): string | null => {
  const description = typeof event.description === 'string' ? event.description.trim() : '';
  const location = typeof event.location === 'string' ? event.location.trim() : '';
  const parts = [location && `Location: ${location}`, description].filter(Boolean);
  return parts.length > 0 ? parts.join('\n\n') : null;
};

/**
 * Turn parsed ICS data into per-day calendar events.
 *
 * All-day events are expanded across each day they cover. Timed events are
 * converted from absolute instants into the user's local wall-clock minutes so
 * they sit on the same scale as manually entered meetings.
 */
const toCalendarEvents = (
  parsed: CalendarResponse,
  dateKeys: DateKey[],
  timeZone: string
): CalendarEvent[] => {
  if (dateKeys.length === 0) return [];

  const wanted = new Set(dateKeys);
  const sorted = [...dateKeys].sort();
  const from = fromDateKey(sorted[0]);
  // Expand one day past the end so events crossing midnight are still found.
  const to = fromDateKey(addDays(sorted[sorted.length - 1], 1));

  const events: CalendarEvent[] = [];
  let index = 0;

  for (const component of Object.values(parsed)) {
    if (!isVEvent(component)) continue;

    let instances;
    try {
      instances = ical.expandRecurringEvent(component, {
        from,
        to,
        includeOverrides: true,
        excludeExdates: true,
      });
    } catch {
      // One malformed event must not lose the whole calendar.
      continue;
    }

    for (const instance of instances) {
      const title = readSummary(instance.summary);
      const notes = readNotes(instance.event);

      if (instance.isFullDay) {
        // DTEND on an all-day event is exclusive, so step up to but not
        // including the end date. All-day values carry no timezone, so they are
        // read back from local parts rather than converted.
        let key = localDateKey(instance.start);
        const endKey = localDateKey(instance.end);
        let guard = 0;

        while (key < endKey || guard === 0) {
          if (wanted.has(key)) {
            events.push({
              id: `family:${index++}:${key}`,
              meetingId: null,
              source: 'family',
              title,
              date: key,
              startMinutes: 0,
              endMinutes: MINUTES_IN_DAY,
              allDay: true,
              notes,
              role: null,
              recurring: instance.isRecurring,
              readOnly: true,
            });
          }
          key = addDays(key, 1);
          guard += 1;
          if (guard > 366) break;
        }
        continue;
      }

      const key = dateKeyInZone(instance.start, timeZone);
      if (!wanted.has(key)) continue;

      const startMinutes = minutesInZone(instance.start, timeZone);
      const endsSameDay = dateKeyInZone(instance.end, timeZone) === key;
      // An event running past midnight is truncated at the end of the day; the
      // day planner only ever shows one day at a time.
      const endMinutes = endsSameDay ? minutesInZone(instance.end, timeZone) : MINUTES_IN_DAY;

      events.push({
        id: `family:${index++}:${key}`,
        meetingId: null,
        source: 'family',
        title,
        date: key,
        startMinutes,
        endMinutes: Math.max(endMinutes, startMinutes + 5),
        allDay: false,
        notes,
        role: null,
        recurring: instance.isRecurring,
        readOnly: true,
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date) || a.startMinutes - b.startMinutes);
};

/** Parse raw ICS text into per-day events. Throws only on unparseable input. */
export const parseIcsToEvents = (
  icsText: string,
  dateKeys: DateKey[],
  timeZone: string
): CalendarEvent[] => toCalendarEvents(ical.sync.parseICS(icsText), dateKeys, timeZone);

export const countEvents = (parsed: CalendarResponse): number =>
  Object.values(parsed).filter(isVEvent).length;

export {isVEvent, toCalendarEvents};
