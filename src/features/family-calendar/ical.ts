import 'server-only';

import ical, {type CalendarResponse} from 'node-ical';
import {countEvents} from '@/features/family-calendar/parse-ics';

/**
 * Reading the raw iCal feed.
 *
 * This module is deliberately *not* on the render path. It is reached only by
 * the scheduled sync and by Settings when a URL is being verified, because
 * fetching and parsing the feed is expensive enough that no page render should
 * ever wait for it: the measured feed is 2 MB and 3,749 events, costing about
 * 650ms to fetch and 340ms to parse.
 *
 * There was a caching layer here — the framework data cache in front of a
 * process-local map. It has been removed rather than fixed. The data cache
 * silently refuses entries over 2 MB, which this feed had grown past, and the
 * process-local map starts empty on every serverless instance, so in
 * production neither layer ever held anything. The database is the cache now;
 * see `sync.ts`.
 *
 * Design rules that still hold:
 *  - The feed URL is server-only and never reaches the browser.
 *  - Nothing here is fatal to a page. Callers handle failure.
 */

export const FETCH_TIMEOUT_MS = 8_000;
/** Guards against a runaway feed exhausting memory. */
const MAX_FEED_BYTES = 5 * 1024 * 1024;

/** Many calendar providers hand out webcal:// links; they are https in practice. */
export const normaliseFeedUrl = (rawUrl: string): URL | null => {
  try {
    const url = new URL(rawUrl.trim());
    if (url.protocol === 'webcal:') url.protocol = 'https:';
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url;
  } catch {
    return null;
  }
};

/**
 * Fetch and parse a feed. Throws on anything that is not a usable calendar.
 *
 * No `next.revalidate`: the response is too large for the framework data cache
 * to accept, so asking for it only produced a warning in the server log and a
 * false sense that renders were protected.
 */
export const fetchFeed = async (url: URL): Promise<CalendarResponse> => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: 'follow',
    headers: {Accept: 'text/calendar, text/plain;q=0.9, */*;q=0.5'},
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

/** Used by Settings to verify a URL before saving it. */
export const testFamilyCalendar = async (
  icalUrl: string
): Promise<{ok: true; eventCount: number} | {ok: false; message: string}> => {
  const url = normaliseFeedUrl(icalUrl);
  if (!url) return {ok: false, message: 'Enter a valid http(s) or webcal address.'};

  try {
    return {ok: true, eventCount: countEvents(await fetchFeed(url))};
  } catch (error) {
    return {ok: false, message: error instanceof Error ? error.message : 'Unknown error'};
  }
};
