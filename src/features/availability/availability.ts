import type {CalendarEvent, WorkingHours} from '@/features/calendar/types';

export type Interval = {
  startMinutes: number;
  endMinutes: number;
};

export type FreePeriod = Interval & {
  durationMinutes: number;
  /**
   * Optional events sitting inside this gap.
   *
   * The time is still reported as free — that is the point of marking a
   * meeting optional — but the thing competing for it is shown rather than
   * hidden, so "am I free at 11:15?" can be answered honestly.
   */
  optionalEvents: CalendarEvent[];
};

/** One event's position inside an overlapping group. */
export type PlacedEvent = {
  event: CalendarEvent;
  /** 0-based column, so overlapping events can be drawn side by side. */
  column: number;
};

/**
 * An ordered timeline entry.
 *
 * A `cluster` is two or more events whose times overlap. They are deliberately
 * not flattened into separate rows: two meetings at 10:00 and 10:30 rendered
 * one after another read as back-to-back, which is the opposite of the truth.
 */
export type TimelineEntry =
  | {kind: 'event'; startMinutes: number; endMinutes: number; event: CalendarEvent}
  | {
      kind: 'cluster';
      startMinutes: number;
      endMinutes: number;
      events: PlacedEvent[];
      /** How many columns the group needs. */
      columns: number;
      /** True when two or more *committed* events genuinely collide. */
      clash: boolean;
    }
  | {
      kind: 'free';
      startMinutes: number;
      endMinutes: number;
      durationMinutes: number;
      optionalEvents: CalendarEvent[];
    };

export type DaySummary = {
  timeline: TimelineEntry[];
  freePeriods: FreePeriod[];
  /** Free minutes inside working hours, counting only committed time as busy. */
  totalFreeMinutes: number;
  /** Minutes inside working hours taken by committed events. */
  totalBusyMinutes: number;
  /** Free minutes that have an optional event competing for them. */
  totalOptionalMinutes: number;
  /** How many genuine clashes the day contains. */
  clashCount: number;
  workingHours: WorkingHours;
};

/** An event that actually blocks the time it occupies. */
export const isCommitted = (event: CalendarEvent): boolean => !event.optional;

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
 * Whether any two of these events overlap in time.
 *
 * A single sweep with a running maximum end, because a group can chain: A and
 * B overlap, B and C overlap, but A and C never meet.
 */
export const hasOverlap = (events: Interval[]): boolean => {
  const sorted = [...events].sort((a, b) => a.startMinutes - b.startMinutes);
  let furthestEnd = -Infinity;
  for (const event of sorted) {
    if (event.startMinutes < furthestEnd) return true;
    furthestEnd = Math.max(furthestEnd, event.endMinutes);
  }
  return false;
};

/**
 * Split events into groups that occupy a contiguous run of time.
 *
 * Each group is everything that has to be drawn together: a group of one is an
 * ordinary meeting, a group of more is an overlap.
 */
export const groupOverlapping = (events: CalendarEvent[]): CalendarEvent[][] => {
  const sorted = [...events].sort(
    (a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes
  );

  const groups: CalendarEvent[][] = [];
  let current: CalendarEvent[] = [];
  let furthestEnd = -Infinity;

  for (const event of sorted) {
    // Touching is not overlapping: 10:00–10:30 then 10:30–11:00 are separate.
    if (current.length > 0 && event.startMinutes >= furthestEnd) {
      groups.push(current);
      current = [];
    }
    current.push(event);
    furthestEnd = Math.max(furthestEnd, event.endMinutes);
  }

  if (current.length > 0) groups.push(current);
  return groups;
};

/**
 * Assign each event in a group to a column, so none are drawn on top of one
 * another: the first column whose previous event has already finished.
 *
 * Required events win ties on start time, so where a meeting and an optional
 * one begin together the one that takes precedence sits leftmost.
 */
export const placeInColumns = (
  events: CalendarEvent[]
): {events: PlacedEvent[]; columns: number} => {
  const sorted = [...events].sort(
    (a, b) =>
      a.startMinutes - b.startMinutes ||
      Number(a.optional) - Number(b.optional) ||
      b.endMinutes - a.endMinutes
  );

  const columnEnds: number[] = [];
  const placed: PlacedEvent[] = [];

  for (const event of sorted) {
    let column = columnEnds.findIndex(end => end <= event.startMinutes);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(event.endMinutes);
    } else {
      columnEnds[column] = event.endMinutes;
    }
    placed.push({event, column});
  }

  return {events: placed, columns: columnEnds.length};
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
): Omit<FreePeriod, 'optionalEvents'>[] => {
  if (hours.endMinutes <= hours.startMinutes) return [];

  const blocks = mergeIntervals(
    busy
      .map(interval => clampToWorkingHours(interval, hours))
      .filter((i): i is Interval => i !== null)
  );

  const free: Omit<FreePeriod, 'optionalEvents'>[] = [];
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

const overlaps = (a: Interval, b: Interval): boolean =>
  a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;

/**
 * Build the ordered day view.
 *
 * Two rules do most of the work here:
 *
 *  1. Availability is calculated from *committed* events only. An optional
 *     meeting is one you would join if you were free, so counting it as busy
 *     would report the opposite of the truth. It is never hidden — it is drawn
 *     inside the free time it competes for.
 *  2. Overlapping events are grouped rather than listed. Rendering 10:00–11:00
 *     and 10:30–11:30 as consecutive rows reads as back-to-back meetings, when
 *     in fact they collide.
 *
 * All-day events are excluded — they occupy no specific slot and are surfaced
 * separately in the UI.
 */
export const buildDaySummary = (
  events: CalendarEvent[],
  hours: WorkingHours,
  {minimumFreeMinutes = 15}: {minimumFreeMinutes?: number} = {}
): DaySummary => {
  const timed = events
    .filter(event => !event.allDay)
    .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

  const committed = timed.filter(isCommitted);

  const bareFree = calculateFreePeriods(committed, hours, {minimumMinutes: minimumFreeMinutes});
  const freePeriods: FreePeriod[] = bareFree.map(period => ({...period, optionalEvents: []}));

  const entries: TimelineEntry[] = [];

  for (const group of groupOverlapping(timed)) {
    // A group with nothing committed in it does not occupy the day; it belongs
    // inside whichever free stretch it is competing for.
    const host = group.every(event => event.optional)
      ? freePeriods.find(period =>
          overlaps(period, {
            startMinutes: group[0].startMinutes,
            endMinutes: Math.max(...group.map(event => event.endMinutes)),
          })
        )
      : undefined;

    if (host) {
      host.optionalEvents.push(...group);
      continue;
    }

    if (group.length === 1) {
      entries.push({
        kind: 'event',
        startMinutes: group[0].startMinutes,
        endMinutes: group[0].endMinutes,
        event: group[0],
      });
      continue;
    }

    const {events: placed, columns} = placeInColumns(group);
    entries.push({
      kind: 'cluster',
      startMinutes: group[0].startMinutes,
      endMinutes: Math.max(...group.map(event => event.endMinutes)),
      events: placed,
      columns,
      // Only a collision between things you are actually expected at counts.
      clash: hasOverlap(group.filter(isCommitted)),
    });
  }

  for (const period of freePeriods) {
    entries.push({
      kind: 'free',
      startMinutes: period.startMinutes,
      endMinutes: period.endMinutes,
      durationMinutes: period.durationMinutes,
      optionalEvents: period.optionalEvents,
    });
  }

  entries.sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
    // A gap that begins where an event begins is a rounding artefact; show the
    // event first so the day always reads as "meeting, then gap".
    if (a.kind === 'free' && b.kind !== 'free') return 1;
    if (b.kind === 'free' && a.kind !== 'free') return -1;
    return a.endMinutes - b.endMinutes;
  });

  const totalFreeMinutes = freePeriods.reduce((sum, period) => sum + period.durationMinutes, 0);
  const workingMinutes = Math.max(0, hours.endMinutes - hours.startMinutes);

  const busyInsideHours = mergeIntervals(
    committed
      .map(event => clampToWorkingHours(event, hours))
      .filter((i): i is Interval => i !== null)
  ).reduce((sum, block) => sum + (block.endMinutes - block.startMinutes), 0);

  // Optional time only counts where it lands on time reported as free — an
  // optional meeting hidden behind a real one costs you nothing.
  const optionalInsideFree = mergeIntervals(
    freePeriods.flatMap(period =>
      period.optionalEvents
        .map(event => clampToWorkingHours(event, period))
        .filter((i): i is Interval => i !== null)
    )
  ).reduce((sum, block) => sum + (block.endMinutes - block.startMinutes), 0);

  return {
    timeline: entries,
    freePeriods,
    totalFreeMinutes,
    totalBusyMinutes: Math.min(busyInsideHours, workingMinutes),
    totalOptionalMinutes: optionalInsideFree,
    clashCount: entries.filter(entry => entry.kind === 'cluster' && entry.clash).length,
    workingHours: hours,
  };
};

export type NextUp = {
  /** The next committed event that has not yet started. */
  next: CalendarEvent | null;
  minutesUntilNext: number | null;
  /** The next optional event, when it begins before `next` does. */
  nextOptional: CalendarEvent | null;
  minutesUntilNextOptional: number | null;
  /** The committed event currently in progress, if any. */
  current: CalendarEvent | null;
  minutesUntilCurrentEnds: number | null;
  /** Other committed events also running right now — a live clash. */
  alsoNow: CalendarEvent[];
  /** An optional event on now while nothing committed is. */
  currentOptional: CalendarEvent | null;
  /**
   * Uninterrupted free minutes available right now: the time from now until
   * the next committed event starts (or the end of the working day), clamped
   * to working hours. Null when outside working hours or in a meeting.
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

  const running = (event: CalendarEvent) =>
    event.startMinutes <= currentMinutes && event.endMinutes > currentMinutes;

  const committed = timed.filter(isCommitted);
  const optional = timed.filter(event => event.optional);

  const runningCommitted = committed.filter(running);
  const current = runningCommitted[0] ?? null;
  const next = committed.find(event => event.startMinutes > currentMinutes) ?? null;
  const nextCommittedStart = next?.startMinutes ?? Infinity;

  const nextOptional =
    optional.find(
      event => event.startMinutes > currentMinutes && event.startMinutes < nextCommittedStart
    ) ?? null;

  const insideWorkingHours =
    currentMinutes >= hours.startMinutes && currentMinutes < hours.endMinutes;

  let freeRightNowMinutes: number | null = null;
  if (!current && insideWorkingHours) {
    const boundary = next ? Math.min(next.startMinutes, hours.endMinutes) : hours.endMinutes;
    freeRightNowMinutes = Math.max(0, boundary - currentMinutes);
  }

  return {
    next,
    minutesUntilNext: next ? next.startMinutes - currentMinutes : null,
    nextOptional,
    minutesUntilNextOptional: nextOptional ? nextOptional.startMinutes - currentMinutes : null,
    current,
    minutesUntilCurrentEnds: current ? current.endMinutes - currentMinutes : null,
    alsoNow: runningCommitted.slice(1),
    currentOptional: current ? null : (optional.find(running) ?? null),
    freeRightNowMinutes,
  };
};
