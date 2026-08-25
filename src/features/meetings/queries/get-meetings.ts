import 'server-only';

import type {CalendarEvent} from '@/features/calendar/types';
import {occursOn} from '@/features/meetings/recurrence';
import {type DateKey, fromDateKey, toDateKey} from '@/lib/dates';
import {prisma} from '@/lib/prisma';

type MeetingRow = {
  id: string;
  title: string;
  date: Date;
  startMinutes: number;
  endMinutes: number;
  notes: string | null;
  roleId: string;
  optional: boolean;
  recurrence: MeetingRecord['recurrence'];
  recurrenceEndDate: Date | null;
};

const toRecord = (meeting: MeetingRow): MeetingRecord => ({
  id: meeting.id,
  title: meeting.title,
  date: toDateKey(meeting.date),
  startMinutes: meeting.startMinutes,
  endMinutes: meeting.endMinutes,
  notes: meeting.notes,
  roleId: meeting.roleId,
  optional: meeting.optional,
  recurrence: meeting.recurrence,
  recurrenceEndDate: meeting.recurrenceEndDate ? toDateKey(meeting.recurrenceEndDate) : null,
});

/**
 * Load every meeting that could occur within a date range, expand recurring
 * ones into concrete per-day events, and hand back the underlying records too.
 *
 * The records come free: the rows are already in memory, and the editor needs
 * them the moment anything on screen is clicked. Fetching them separately
 * afterwards — which is what this used to do — cost a second round trip per
 * page for data already loaded.
 *
 * The database filter is deliberately loose — it narrows the candidate set,
 * and `occursOn` decides the exact days. Trying to express recurrence rules in
 * SQL would buy nothing at this scale.
 */
export const getMeetingEventsForDates = async (
  userId: string,
  dateKeys: DateKey[]
): Promise<{events: CalendarEvent[]; meetings: MeetingRecord[]}> => {
  if (dateKeys.length === 0) return {events: [], meetings: []};

  const sorted = [...dateKeys].sort();
  const rangeStart = sorted[0];
  const rangeEnd = sorted[sorted.length - 1];

  const meetings = await prisma.meeting.findMany({
    where: {
      userId,
      // Nothing can occur before its first date.
      date: {lte: fromDateKey(rangeEnd)},
      OR: [
        // One-off meetings must fall inside the range.
        {recurrence: 'NONE', date: {gte: fromDateKey(rangeStart)}},
        // Recurring meetings must not have already ended.
        {
          recurrence: {not: 'NONE'},
          OR: [{recurrenceEndDate: null}, {recurrenceEndDate: {gte: fromDateKey(rangeStart)}}],
        },
      ],
    },
    include: {role: {select: {id: true, name: true, shortName: true, colour: true}}},
    orderBy: [{startMinutes: 'asc'}, {endMinutes: 'asc'}],
  });

  const events: CalendarEvent[] = [];
  const records: MeetingRecord[] = [];

  for (const meeting of meetings) {
    const pattern = {
      date: toDateKey(meeting.date),
      recurrence: meeting.recurrence,
      recurrenceEndDate: meeting.recurrenceEndDate ? toDateKey(meeting.recurrenceEndDate) : null,
      skippedDates: meeting.skippedDates.map(toDateKey),
    };

    let occurs = false;

    for (const key of dateKeys) {
      if (!occursOn(pattern, key)) continue;
      occurs = true;

      events.push({
        id: `${meeting.id}:${key}`,
        meetingId: meeting.id,
        source: 'meeting',
        title: meeting.title,
        date: key,
        startMinutes: meeting.startMinutes,
        endMinutes: meeting.endMinutes,
        allDay: false,
        notes: meeting.notes,
        role: meeting.role,
        recurring: meeting.recurrence !== 'NONE',
        optional: meeting.optional,
        readOnly: false,
      });
    }

    // Only meetings that actually surface are worth sending to the browser.
    if (occurs) records.push(toRecord(meeting));
  }

  events.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes
  );

  return {events, meetings: records};
};

export type MeetingRecord = {
  id: string;
  title: string;
  date: DateKey;
  startMinutes: number;
  endMinutes: number;
  notes: string | null;
  roleId: string;
  optional: boolean;
  recurrence: 'NONE' | 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'FORTNIGHTLY';
  recurrenceEndDate: DateKey | null;
};

/** A single meeting for editing. Returns null when it is not the user's. */
export const getMeeting = async (
  userId: string,
  meetingId: string
): Promise<MeetingRecord | null> => {
  const meeting = await prisma.meeting.findFirst({where: {id: meetingId, userId}});
  return meeting ? toRecord(meeting) : null;
};
