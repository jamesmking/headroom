import type {DateKey} from '@/lib/dates';

/**
 * Deciding what to say about a synced family calendar.
 *
 * Pure, and separate from the query that reads the rows, so the decision table
 * can be tested without a database. The interesting cases are all about
 * honesty: a calendar that is out of date must not look current, and a date
 * nobody has synced must not look like a day with nothing on it.
 */

export type FamilyCalendarStatus = 'disabled' | 'ok' | 'stale' | 'unavailable';

/** The parts of the sync record the decision depends on. */
export type SyncSnapshot = {
  fetchedAt: Date;
  /** 'ok' when the last run succeeded, anything else when it did not. */
  status: string;
  message: string | null;
  windowStart: DateKey;
  windowEnd: DateKey;
};

export type StatusDecision =
  /** Serve the rows, with an optional caveat. */
  | {serve: true; status: 'ok' | 'stale'; message: string | null}
  /** Serve nothing, and say why. */
  | {serve: false; status: 'unavailable'; message: string};

/** "3 hours ago", "2 days ago" — deliberately coarse; precision is not the point. */
export const describeAge = (fetchedAt: Date, now: Date): string => {
  const hours = Math.floor((now.getTime() - fetchedAt.getTime()) / 3_600_000);
  if (hours < 1) return 'less than an hour ago';
  if (hours < 48) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${Math.floor(hours / 24)} days ago`;
};

export const decideFamilyStatus = ({
  sync,
  requested,
  now,
  maxAgeSeconds,
}: {
  sync: SyncSnapshot;
  /** The days being rendered. Order does not matter. */
  requested: DateKey[];
  now: Date;
  maxAgeSeconds: number;
}): StatusDecision => {
  const sorted = [...requested].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  // Nothing here has ever been expanded. An empty calendar would read as "no
  // events that day", which is a different and wrong claim.
  if (last < sync.windowStart || first > sync.windowEnd) {
    return {
      serve: false,
      status: 'unavailable',
      message: `The family calendar has only been read for ${sync.windowStart} to ${sync.windowEnd}.`,
    };
  }

  // A failed refresh still has its rows, which are the best copy available.
  if (sync.status !== 'ok') {
    return {
      serve: true,
      status: 'stale',
      message: `Showing the family calendar as of ${describeAge(sync.fetchedAt, now)} — it could not be refreshed (${sync.message ?? 'unknown error'}).`,
    };
  }

  // The last run succeeded, but too long ago: the schedule itself has stopped.
  if ((now.getTime() - sync.fetchedAt.getTime()) / 1000 > maxAgeSeconds) {
    return {
      serve: true,
      status: 'stale',
      message: `The family calendar was last refreshed ${describeAge(sync.fetchedAt, now)}.`,
    };
  }

  return {serve: true, status: 'ok', message: null};
};
