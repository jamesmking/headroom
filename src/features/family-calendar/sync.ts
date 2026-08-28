import 'server-only';

import {fetchFeed, normaliseFeedUrl} from '@/features/family-calendar/ical';
import {toCalendarEvents} from '@/features/family-calendar/parse-ics';
import {addDays, fromDateKey, todayKey, type DateKey} from '@/lib/dates';
import {prisma} from '@/lib/prisma';

/**
 * Refreshing the family calendar into the database.
 *
 * The feed is fetched, parsed and expanded here, on a schedule, so that no
 * page render ever has to. What lands in `FamilyEvent` is already the shape
 * the timeline wants: one row per occurrence per day, recurrence already
 * unrolled.
 *
 * The window is generous because it is almost free. The feed holds 3,749
 * events, but they are nearly all history — a whole year forward expands to
 * about 150 rows, so covering two years costs a few hundred rows and lets the
 * date picker wander without finding a hole.
 */

/** How far back the expansion reaches. Enough to look over your shoulder. */
const WINDOW_BACK_DAYS = 180;
/** How far forward. Beyond this the calendar is empty rather than wrong. */
const WINDOW_FORWARD_DAYS = 540;

export type SyncOutcome =
  | {status: 'disabled'}
  | {status: 'ok'; eventCount: number}
  | {status: 'error'; message: string};

const dateKeysBetween = (from: DateKey, to: DateKey): DateKey[] => {
  const keys: DateKey[] = [];
  for (let key = from; key <= to; key = addDays(key, 1)) keys.push(key);
  return keys;
};

/**
 * Refresh one user's family calendar.
 *
 * Never throws: a feed that is slow, broken or offline leaves the previous
 * rows in place and records why, which is what lets the page keep showing the
 * last good copy and say that it is doing so.
 */
export const syncFamilyCalendar = async (userId: string): Promise<SyncOutcome> => {
  const settings = await prisma.userSettings.findUnique({
    where: {userId},
    select: {icalUrl: true, icalEnabled: true, timeZone: true},
  });

  const url = settings?.icalEnabled && settings.icalUrl ? normaliseFeedUrl(settings.icalUrl) : null;

  if (!url) {
    // No feed configured, or it has just been turned off. Leaving rows behind
    // would show a family calendar the settings say is not connected.
    await prisma.$transaction([
      prisma.familyEvent.deleteMany({where: {userId}}),
      prisma.familyCalendarSync.deleteMany({where: {userId}}),
    ]);
    return {status: 'disabled'};
  }

  const timeZone = settings?.timeZone ?? 'Europe/London';
  const today = todayKey(timeZone);
  const windowStart = addDays(today, -WINDOW_BACK_DAYS);
  const windowEnd = addDays(today, WINDOW_FORWARD_DAYS);

  try {
    const parsed = await fetchFeed(url);
    const events = toCalendarEvents(parsed, dateKeysBetween(windowStart, windowEnd), timeZone);

    // Replace wholesale rather than diff. The row count is in the hundreds, and
    // a feed is authoritative: an event deleted upstream must disappear here.
    await prisma.$transaction([
      prisma.familyEvent.deleteMany({where: {userId}}),
      prisma.familyEvent.createMany({
        data: events.map(event => ({
          userId,
          date: fromDateKey(event.date),
          title: event.title,
          startMinutes: event.startMinutes,
          endMinutes: event.endMinutes,
          allDay: event.allDay,
          notes: event.notes,
          recurring: event.recurring,
        })),
      }),
      prisma.familyCalendarSync.upsert({
        where: {userId},
        update: {
          fetchedAt: new Date(),
          status: 'ok',
          message: null,
          eventCount: events.length,
          windowStart: fromDateKey(windowStart),
          windowEnd: fromDateKey(windowEnd),
        },
        create: {
          userId,
          fetchedAt: new Date(),
          status: 'ok',
          message: null,
          eventCount: events.length,
          windowStart: fromDateKey(windowStart),
          windowEnd: fromDateKey(windowEnd),
        },
      }),
    ]);

    return {status: 'ok', eventCount: events.length};
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Record the failure without touching `fetchedAt`, which means "when this
    // data was last known good", or the rows, which are still the best copy
    // available. `updateMany` is a no-op when there has never been a success,
    // and the read path reports that as "not synced yet".
    await prisma.familyCalendarSync.updateMany({
      where: {userId},
      data: {status: 'error', message},
    });

    return {status: 'error', message};
  }
};

/** Every user with a feed configured. Used by the scheduled refresh. */
export const usersWithFamilyCalendar = async (): Promise<string[]> => {
  const rows = await prisma.userSettings.findMany({
    where: {icalEnabled: true, NOT: {icalUrl: null}},
    select: {userId: true},
  });
  return rows.map(row => row.userId);
};
