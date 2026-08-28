import 'server-only';

import type {CalendarEvent} from '@/features/calendar/types';
import {FAMILY_ROLE} from '@/features/family-calendar/family-role';
import {
  decideFamilyStatus,
  type FamilyCalendarStatus,
} from '@/features/family-calendar/sync-status';
import {fromDateKey, toDateKey, type DateKey} from '@/lib/dates';
import {env} from '@/lib/env';
import {prisma} from '@/lib/prisma';

/**
 * The family calendar as the pages see it: two indexed reads, no network and
 * no parsing.
 *
 * This is the whole point of `sync.ts`. Rendering a day used to cost a 2 MB
 * fetch and a 3,749-event parse — a measured ~1s — because the caches meant to
 * prevent that could not hold a feed that size. A day now costs the handful of
 * rows that fall on it.
 */

export type {FamilyCalendarStatus};

export type FamilyCalendarResult = {
  status: FamilyCalendarStatus;
  events: CalendarEvent[];
  /** Plain-language explanation shown to the user when something is wrong. */
  message: string | null;
  fetchedAt: Date | null;
};

export const getFamilyEvents = async ({
  userId,
  dateKeys,
}: {
  userId: string;
  dateKeys: DateKey[];
}): Promise<FamilyCalendarResult> => {
  if (dateKeys.length === 0) {
    return {status: 'disabled', events: [], message: null, fetchedAt: null};
  }

  const sync = await prisma.familyCalendarSync.findUnique({where: {userId}});

  if (!sync) {
    // `syncFamilyCalendar` deletes the record when the calendar is switched off
    // or removed, so normally this means no feed is connected. It also happens
    // on a deployment that has migrated but not yet run its first sync, and a
    // configured calendar quietly showing nothing would look like a bug rather
    // than a wait — so the two cases are told apart before answering.
    const settings = await prisma.userSettings.findUnique({
      where: {userId},
      select: {icalUrl: true, icalEnabled: true},
    });

    if (settings?.icalEnabled && settings.icalUrl) {
      return {
        status: 'unavailable',
        events: [],
        message: 'The family calendar has not been read yet. It refreshes on a schedule.',
        fetchedAt: null,
      };
    }

    return {status: 'disabled', events: [], message: null, fetchedAt: null};
  }

  const decision = decideFamilyStatus({
    sync: {
      fetchedAt: sync.fetchedAt,
      status: sync.status,
      message: sync.message,
      windowStart: toDateKey(sync.windowStart),
      windowEnd: toDateKey(sync.windowEnd),
    },
    requested: dateKeys,
    now: new Date(),
    maxAgeSeconds: env.familySyncMaxAgeSeconds,
  });

  if (!decision.serve) {
    return {
      status: decision.status,
      events: [],
      message: decision.message,
      fetchedAt: sync.fetchedAt,
    };
  }

  const rows = await prisma.familyEvent.findMany({
    where: {userId, date: {in: dateKeys.map(fromDateKey)}},
    orderBy: [{date: 'asc'}, {startMinutes: 'asc'}],
  });

  return {
    status: decision.status,
    message: decision.message,
    fetchedAt: sync.fetchedAt,
    events: rows.map((row, index) => ({
      id: `family:${index}:${toDateKey(row.date)}`,
      meetingId: null,
      source: 'family',
      title: row.title,
      date: toDateKey(row.date),
      startMinutes: row.startMinutes,
      endMinutes: row.endMinutes,
      allDay: row.allDay,
      notes: row.notes,
      role: FAMILY_ROLE,
      recurring: row.recurring,
      // Decided once, where the feed is read; see calendar/types.ts.
      claim: 'informational',
      readOnly: true,
    })),
  };
};
