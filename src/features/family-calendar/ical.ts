import 'server-only';

import ical, {type CalendarResponse} from 'node-ical';
import type {CalendarEvent} from '@/features/calendar/types';
import {countEvents, toCalendarEvents} from '@/features/family-calendar/parse-ics';
import type {DateKey} from '@/lib/dates';
import {env} from '@/lib/env';

/**
 * Read-only family calendar, fetched from an iCal/ICS feed.
 *
 * Design rules for this module:
 *  - The feed URL is server-only and never reaches the browser.
 *  - Results are cached, so leaving the Today screen open does not hammer the
 *    provider.
 *  - Nothing here throws. A feed that is slow, broken or offline degrades to a
 *    warning on the page; the rest of the application always renders.
 */

export type FamilyCalendarStatus = 'disabled' | 'ok' | 'stale' | 'unavailable';

export type FamilyCalendarResult = {
  status: FamilyCalendarStatus;
  events: CalendarEvent[];
  /** Plain-language explanation shown to the user when something is wrong. */
  message: string | null;
  fetchedAt: Date | null;
};

const FETCH_TIMEOUT_MS = 8_000;
/** Guards against a runaway feed exhausting memory. */
const MAX_FEED_BYTES = 5 * 1024 * 1024;

type CacheEntry = {
  parsed: CalendarResponse;
  fetchedAt: number;
};

/**
 * Process-local cache, keyed by feed URL. Each instance keeps its own copy,
 * which is fine: the data is per-user, read-only and cheap to re-fetch.
 */
const cache = new Map<string, CacheEntry>();

/** Many calendar providers hand out webcal:// links; they are https in practice. */
const normaliseFeedUrl = (rawUrl: string): URL | null => {
  try {
    const url = new URL(rawUrl.trim());
    if (url.protocol === 'webcal:') url.protocol = 'https:';
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url;
  } catch {
    return null;
  }
};

const fetchFeed = async (url: URL): Promise<CalendarResponse> => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: 'follow',
    headers: {Accept: 'text/calendar, text/plain;q=0.9, */*;q=0.5'},
    // The module-level cache is the caching layer; skip Next's data cache so
    // the TTL is controlled in one place.
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Calendar feed responded with ${response.status}`);
  }

  const body = await response.text();
  if (body.length > MAX_FEED_BYTES) {
    throw new Error('Calendar feed is too large to process');
  }
  if (!body.includes('BEGIN:VCALENDAR')) {
    throw new Error('That URL did not return an iCal feed');
  }

  return ical.sync.parseICS(body);
};

/**
 * Fetch and expand the family calendar for a set of days.
 * Always resolves; failures are reported through `status` and `message`.
 */
export const getFamilyCalendar = async ({
  icalUrl,
  dateKeys,
  timeZone,
}: {
  icalUrl: string | null;
  dateKeys: DateKey[];
  timeZone: string;
}): Promise<FamilyCalendarResult> => {
  if (!icalUrl) {
    return {status: 'disabled', events: [], message: null, fetchedAt: null};
  }

  const url = normaliseFeedUrl(icalUrl);
  if (!url) {
    return {
      status: 'unavailable',
      events: [],
      message: 'The family calendar URL is not a valid http(s) or webcal address.',
      fetchedAt: null,
    };
  }

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  const ttlMs = env.familyIcalCacheSeconds * 1000;
  const isFresh = cached && Date.now() - cached.fetchedAt < ttlMs;

  if (cached && isFresh) {
    return {
      status: 'ok',
      events: toCalendarEvents(cached.parsed, dateKeys, timeZone),
      message: null,
      fetchedAt: new Date(cached.fetchedAt),
    };
  }

  try {
    const parsed = await fetchFeed(url);
    const entry: CacheEntry = {parsed, fetchedAt: Date.now()};
    cache.set(cacheKey, entry);

    return {
      status: 'ok',
      events: toCalendarEvents(parsed, dateKeys, timeZone),
      message: null,
      fetchedAt: new Date(entry.fetchedAt),
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';

    // Serve the last good copy rather than dropping the family calendar.
    if (cached) {
      return {
        status: 'stale',
        events: toCalendarEvents(cached.parsed, dateKeys, timeZone),
        message: `Showing the last copy of the family calendar — it could not be refreshed (${detail}).`,
        fetchedAt: new Date(cached.fetchedAt),
      };
    }

    return {
      status: 'unavailable',
      events: [],
      message: `The family calendar is unavailable (${detail}).`,
      fetchedAt: null,
    };
  }
};

/** Used by Settings to verify a URL before saving it. */
export const testFamilyCalendar = async (
  icalUrl: string
): Promise<{ok: true; eventCount: number} | {ok: false; message: string}> => {
  const url = normaliseFeedUrl(icalUrl);
  if (!url) return {ok: false, message: 'Enter a valid http(s) or webcal address.'};

  try {
    const parsed = await fetchFeed(url);
    const eventCount = countEvents(parsed);
    // Warm the cache so the next page render is instant.
    cache.set(url.toString(), {parsed, fetchedAt: Date.now()});
    return {ok: true, eventCount};
  } catch (error) {
    return {ok: false, message: error instanceof Error ? error.message : 'Unknown error'};
  }
};

/** Drop the cached copy, e.g. when the URL changes. */
export const clearFamilyCalendarCache = (icalUrl?: string | null): void => {
  if (!icalUrl) {
    cache.clear();
    return;
  }
  const url = normaliseFeedUrl(icalUrl);
  if (url) cache.delete(url.toString());
};
