import type {CalendarEvent, WorkingHours} from '@/features/calendar/types';

export type Interval = {
  startMinutes: number;
  endMinutes: number;
};

export type FreePeriod = Interval & {
  durationMinutes: number;
};

/** An ordered timeline entry: either something booked, or a gap between things. */
export type TimelineEntry =
  | {kind: 'event'; startMinutes: number; endMinutes: number; event: CalendarEvent}
  | {kind: 'free'; startMinutes: number; endMinutes: number; durationMinutes: number};

export type DaySummary = {
  timeline: TimelineEntry[];
  freePeriods: FreePeriod[];
  /** Free minutes remaining inside working hours, across the whole day. */
  totalFreeMinutes: number;
  /** Minutes inside working hours that are booked. */
  totalBusyMinutes: number;
  workingHours: WorkingHours;
};

/**
 * Collapse overlapping and touching intervals into a minimal covering set.
 * Two back-to-back meetings (10:00–10:30, 10:30–11:00) merge into one busy
 * block rather than producing a zero-length gap between them.
 */
export const mergeIntervals = (intervals: Interval[]): Interval[] => {
  const valid = intervals
    .filter(interval => interval.endMinutes > interval.startMinutes)
    .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

  const merged: Interval[] = [];
  for (const interval of valid) {
    const last = merged[merged.length - 1];
    if (last && interval.startMinutes <= last.endMinutes) {
      last.endMinutes = Math.max(last.endMinutes, interval.endMinutes);
    } else {
      merged.push({...interval});
    }
  }
  return merged;
};

/** Clip an interval to the working day, returning null when it falls outside. */
const clampToWorkingHours = (interval: Interval, hours: WorkingHours): Interval | null => {
  const start = Math.max(interval.startMinutes, hours.startMinutes);
  const end = Math.min(interval.endMinutes, hours.endMinutes);
  return end > start ? {startMinutes: start, endMinutes: end} : null;
};

/**
 * The gaps between busy intervals, restricted to working hours.
 *
 * Time outside the configured working day is never reported as available, so
 * an empty evening does not read as "free for 6h 30m".
 */
export const calculateFreePeriods = (
  busy: Interval[],
  hours: WorkingHours,
  {minimumMinutes = 1}: {minimumMinutes?: number} = {}
): FreePeriod[] => {
  if (hours.endMinutes <= hours.startMinutes) return [];

  const blocks = mergeIntervals(
    busy
      .map(interval => clampToWorkingHours(interval, hours))
      .filter((i): i is Interval => i !== null)
  );

  const free: FreePeriod[] = [];
  let cursor = hours.startMinutes;

  for (const block of blocks) {
    if (block.startMinutes > cursor) {
      free.push({
        startMinutes: cursor,
        endMinutes: block.startMinutes,
        durationMinutes: block.startMinutes - cursor,
      });
    }
    cursor = Math.max(cursor, block.endMinutes);
  }

  if (cursor < hours.endMinutes) {
    free.push({
      startMinutes: cursor,
      endMinutes: hours.endMinutes,
      durationMinutes: hours.endMinutes - cursor,
    });
  }

  return free.filter(period => period.durationMinutes >= minimumMinutes);
};

/**
 * Build the ordered day view: every timed event, with free periods woven in
 * between them. All-day events are excluded — they occupy no specific slot and
 * are surfaced separately in the UI.
 */
export const buildDaySummary = (
  events: CalendarEvent[],
  hours: WorkingHours,
  {minimumFreeMinutes = 15}: {minimumFreeMinutes?: number} = {}
): DaySummary => {
  const timed = events
    .filter(event => !event.allDay)
    .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

  const freePeriods = calculateFreePeriods(timed, hours, {minimumMinutes: minimumFreeMinutes});

  const entries: TimelineEntry[] = [
    ...timed.map((event): TimelineEntry => ({
      kind: 'event',
      startMinutes: event.startMinutes,
      endMinutes: event.endMinutes,
      event,
    })),
    ...freePeriods.map((period): TimelineEntry => ({
      kind: 'free',
      startMinutes: period.startMinutes,
      endMinutes: period.endMinutes,
      durationMinutes: period.durationMinutes,
    })),
  ].sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
    // A gap that begins where an event begins is a rounding artefact; show the
    // event first so the day always reads as "meeting, then gap".
    if (a.kind !== b.kind) return a.kind === 'event' ? -1 : 1;
    return a.endMinutes - b.endMinutes;
  });

  const totalFreeMinutes = freePeriods.reduce((sum, period) => sum + period.durationMinutes, 0);
  const workingMinutes = Math.max(0, hours.endMinutes - hours.startMinutes);
  const busyInsideHours = mergeIntervals(
    timed.map(event => clampToWorkingHours(event, hours)).filter((i): i is Interval => i !== null)
  ).reduce((sum, block) => sum + (block.endMinutes - block.startMinutes), 0);

  return {
    timeline: entries,
    freePeriods,
    totalFreeMinutes,
    totalBusyMinutes: Math.min(busyInsideHours, workingMinutes),
    workingHours: hours,
  };
};

export type NextUp = {
  /** The next event that has not yet started. */
  next: CalendarEvent | null;
  /** Minutes until `next` begins. Null when there is nothing left today. */
  minutesUntilNext: number | null;
  /** The event currently in progress, if any. */
  current: CalendarEvent | null;
  /** Minutes until the current event ends. */
  minutesUntilCurrentEnds: number | null;
  /**
   * Uninterrupted free minutes available right now: the time from now until
   * the next event starts (or the end of the working day), clamped to working
   * hours. Null when outside working hours or currently in a meeting.
   */
  freeRightNowMinutes: number | null;
};

/**
 * Work out what is happening now and what happens next.
 * `currentMinutes` is wall-clock minutes since midnight in the user's timezone.
 */
export const findNextUp = (
  events: CalendarEvent[],
  currentMinutes: number,
  hours: WorkingHours
): NextUp => {
  const timed = events
    .filter(event => !event.allDay)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const current = timed.find(
    event => event.startMinutes <= currentMinutes && event.endMinutes > currentMinutes
  );
  const next = timed.find(event => event.startMinutes > currentMinutes);

  const insideWorkingHours =
    currentMinutes >= hours.startMinutes && currentMinutes < hours.endMinutes;

  let freeRightNowMinutes: number | null = null;
  if (!current && insideWorkingHours) {
    const boundary = next ? Math.min(next.startMinutes, hours.endMinutes) : hours.endMinutes;
    freeRightNowMinutes = Math.max(0, boundary - currentMinutes);
  }

  return {
    next: next ?? null,
    minutesUntilNext: next ? next.startMinutes - currentMinutes : null,
    current: current ?? null,
    minutesUntilCurrentEnds: current ? current.endMinutes - currentMinutes : null,
    freeRightNowMinutes,
  };
};
