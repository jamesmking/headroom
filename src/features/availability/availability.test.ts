import type {CalendarEvent, WorkingHours} from '@/features/calendar/types';
import {
  buildDaySummary,
  calculateFreePeriods,
  findNextUp,
  groupOverlapping,
  hasOverlap,
  mergeIntervals,
  placeInColumns,
} from './availability';

const HOURS: WorkingHours = {startMinutes: 9 * 60, endMinutes: 17 * 60 + 30};

const event = (
  title: string,
  startMinutes: number,
  endMinutes: number,
  overrides: Partial<CalendarEvent> = {}
): CalendarEvent => ({
  id: title,
  meetingId: title,
  source: 'meeting',
  title,
  date: '2026-08-24',
  startMinutes,
  endMinutes,
  allDay: false,
  notes: null,
  role: {id: 'role-a', name: 'Team A', shortName: 'TA', colour: '#1f5f9e'},
  recurring: false,
  claim: 'required',
  readOnly: false,
  ...overrides,
});

/** A meeting you would join if you were free. */
const optionalEvent = (
  title: string,
  startMinutes: number,
  endMinutes: number,
  overrides: Partial<CalendarEvent> = {}
): CalendarEvent => event(title, startMinutes, endMinutes, {...overrides, claim: 'optional'});

/**
 * Something on the family calendar: not yours to attend, and read-only, so it
 * is built the way the iCal reader builds it rather than as a meeting.
 */
const familyEvent = (
  title: string,
  startMinutes: number,
  endMinutes: number,
  overrides: Partial<CalendarEvent> = {}
): CalendarEvent =>
  event(title, startMinutes, endMinutes, {
    source: 'family',
    meetingId: null,
    readOnly: true,
    ...overrides,
    claim: 'informational',
  });

/** Describes a timeline entry compactly, for readable assertions. */
const describeEntry = (entry: ReturnType<typeof buildDaySummary>['timeline'][number]): string => {
  if (entry.kind === 'event') return entry.event.title;
  if (entry.kind === 'free') {
    const optional = entry.optionalEvents.map(e => e.title).join('+');
    const info = entry.informationalEvents.map(e => e.title).join('+');
    const inside = [optional, info && `fyi ${info}`].filter(Boolean).join(', ');
    return `free ${entry.durationMinutes}${inside ? ` (${inside})` : ''}`;
  }
  return `cluster[${entry.events.map(p => `${p.event.title}@${p.column}`).join(', ')}]${
    entry.clash ? ' CLASH' : ''
  }`;
};

describe('mergeIntervals', () => {
  it('merges overlapping intervals', () => {
    expect(
      mergeIntervals([
        {startMinutes: 600, endMinutes: 660},
        {startMinutes: 630, endMinutes: 720},
      ])
    ).toEqual([{startMinutes: 600, endMinutes: 720}]);
  });

  it('merges back-to-back intervals so no zero-length gap appears', () => {
    expect(
      mergeIntervals([
        {startMinutes: 600, endMinutes: 630},
        {startMinutes: 630, endMinutes: 660},
      ])
    ).toEqual([{startMinutes: 600, endMinutes: 660}]);
  });

  it('discards zero-length and inverted intervals', () => {
    expect(
      mergeIntervals([
        {startMinutes: 600, endMinutes: 600},
        {startMinutes: 700, endMinutes: 650},
      ])
    ).toEqual([]);
  });

  it('keeps separate intervals apart', () => {
    const merged = mergeIntervals([
      {startMinutes: 540, endMinutes: 600},
      {startMinutes: 660, endMinutes: 720},
    ]);
    expect(merged).toHaveLength(2);
  });
});

describe('calculateFreePeriods', () => {
  it('returns the whole working day when nothing is booked', () => {
    expect(calculateFreePeriods([], HOURS)).toEqual([
      {startMinutes: 540, endMinutes: 1050, durationMinutes: 510},
    ]);
  });

  it('finds gaps between meetings', () => {
    const free = calculateFreePeriods(
      [
        {startMinutes: 600, endMinutes: 630},
        {startMinutes: 720, endMinutes: 780},
      ],
      HOURS
    );
    expect(free).toEqual([
      {startMinutes: 540, endMinutes: 600, durationMinutes: 60},
      {startMinutes: 630, endMinutes: 720, durationMinutes: 90},
      {startMinutes: 780, endMinutes: 1050, durationMinutes: 270},
    ]);
  });

  it('never reports time outside working hours as available', () => {
    const free = calculateFreePeriods([{startMinutes: 540, endMinutes: 1050}], HOURS);
    expect(free).toEqual([]);
  });

  it('clips meetings that start before or end after the working day', () => {
    const free = calculateFreePeriods([{startMinutes: 480, endMinutes: 600}], HOURS);
    expect(free).toEqual([{startMinutes: 600, endMinutes: 1050, durationMinutes: 450}]);
  });

  it('ignores meetings entirely outside working hours', () => {
    const free = calculateFreePeriods([{startMinutes: 1200, endMinutes: 1260}], HOURS);
    expect(free).toEqual([{startMinutes: 540, endMinutes: 1050, durationMinutes: 510}]);
  });

  it('drops gaps shorter than the configured minimum', () => {
    const free = calculateFreePeriods(
      [
        {startMinutes: 600, endMinutes: 630},
        {startMinutes: 640, endMinutes: 700},
      ],
      HOURS,
      {minimumMinutes: 15}
    );
    expect(free.map(period => period.durationMinutes)).toEqual([60, 350]);
  });

  it('returns nothing when working hours are inverted', () => {
    expect(calculateFreePeriods([], {startMinutes: 1050, endMinutes: 540})).toEqual([]);
  });
});

describe('buildDaySummary', () => {
  it('interleaves meetings and gaps in chronological order', () => {
    const summary = buildDaySummary(
      [event('Team B planning', 720, 780), event('Team A stand-up', 600, 630)],
      HOURS
    );
    expect(summary.timeline.map(describeEntry)).toEqual([
      'free 60',
      'Team A stand-up',
      'free 90',
      'Team B planning',
      'free 270',
    ]);
  });

  it('excludes all-day events from the timeline', () => {
    const summary = buildDaySummary(
      [familyEvent('School holiday', 0, 1440, {allDay: true})],
      HOURS
    );
    expect(summary.timeline.every(entry => entry.kind === 'free')).toBe(true);
    expect(summary.totalFreeMinutes).toBe(510);
  });

  it('counts busy time only inside working hours', () => {
    const summary = buildDaySummary([event('Early call', 480, 600)], HOURS);
    expect(summary.totalBusyMinutes).toBe(60);
    expect(summary.totalFreeMinutes).toBe(450);
  });

  it('does not double count overlapping meetings', () => {
    const summary = buildDaySummary([event('Team A', 600, 660), event('Team B', 630, 690)], HOURS);
    expect(summary.totalBusyMinutes).toBe(90);
  });
});

describe('findNextUp', () => {
  const events = [event('Stand-up', 600, 630), event('Planning', 720, 780)];

  it('reports the next meeting and how long until it starts', () => {
    const result = findNextUp(events, 555, HOURS);
    expect(result.next?.title).toBe('Stand-up');
    expect(result.minutesUntilNext).toBe(45);
    expect(result.current).toBeNull();
  });

  it('reports the meeting in progress', () => {
    const result = findNextUp(events, 610, HOURS);
    expect(result.current?.title).toBe('Stand-up');
    expect(result.minutesUntilCurrentEnds).toBe(20);
    expect(result.next?.title).toBe('Planning');
    expect(result.freeRightNowMinutes).toBeNull();
  });

  it('measures free time up to the next meeting', () => {
    const result = findNextUp(events, 660, HOURS);
    expect(result.freeRightNowMinutes).toBe(60);
  });

  it('measures free time to the end of the working day when nothing is left', () => {
    const result = findNextUp(events, 800, HOURS);
    expect(result.next).toBeNull();
    expect(result.freeRightNowMinutes).toBe(250);
  });

  it('reports no free time outside working hours', () => {
    expect(findNextUp(events, 1200, HOURS).freeRightNowMinutes).toBeNull();
    expect(findNextUp(events, 400, HOURS).freeRightNowMinutes).toBeNull();
  });
});

describe('hasOverlap', () => {
  it('is false for touching intervals', () => {
    expect(
      hasOverlap([
        {startMinutes: 600, endMinutes: 630},
        {startMinutes: 630, endMinutes: 660},
      ])
    ).toBe(false);
  });

  it('finds an overlap that only exists between non-adjacent members', () => {
    // A fully contains C, but B sits between them when sorted by start.
    expect(
      hasOverlap([
        {startMinutes: 600, endMinutes: 780},
        {startMinutes: 610, endMinutes: 620},
        {startMinutes: 700, endMinutes: 720},
      ])
    ).toBe(true);
  });
});

describe('groupOverlapping', () => {
  it('keeps touching meetings in separate groups', () => {
    const groups = groupOverlapping([event('A', 600, 630), event('B', 630, 660)]);
    expect(groups.map(group => group.map(e => e.title))).toEqual([['A'], ['B']]);
  });

  it('chains a run of overlaps into one group', () => {
    const groups = groupOverlapping([
      event('A', 600, 660),
      event('B', 630, 690),
      event('C', 680, 700),
      event('D', 800, 830),
    ]);
    expect(groups.map(group => group.map(e => e.title))).toEqual([['A', 'B', 'C'], ['D']]);
  });
});

describe('placeInColumns', () => {
  it('puts overlapping events in adjacent columns', () => {
    const {events, columns} = placeInColumns([event('A', 600, 660), event('B', 630, 690)]);
    expect(columns).toBe(2);
    expect(events.map(p => [p.event.title, p.column])).toEqual([
      ['A', 0],
      ['B', 1],
    ]);
  });

  it('reuses a column once its previous event has finished', () => {
    const {events, columns} = placeInColumns([
      event('A', 600, 660),
      event('B', 630, 690),
      event('C', 665, 700),
    ]);
    expect(columns).toBe(2);
    // C starts after A ends, so it goes back into the first column.
    expect(events.map(p => [p.event.title, p.column])).toEqual([
      ['A', 0],
      ['B', 1],
      ['C', 0],
    ]);
  });

  it('gives the leftmost column to the required meeting on a tie', () => {
    const {events} = placeInColumns([
      optionalEvent('Optional', 600, 660),
      event('Required', 600, 660),
    ]);
    expect(events.map(p => [p.event.title, p.column])).toEqual([
      ['Required', 0],
      ['Optional', 1],
    ]);
  });

  it('scales past two overlapping events', () => {
    const {columns} = placeInColumns([
      event('A', 600, 700),
      event('B', 610, 700),
      event('C', 620, 700),
      event('D', 630, 700),
    ]);
    expect(columns).toBe(4);
  });
});

describe('buildDaySummary with overlaps', () => {
  it('groups overlapping meetings instead of listing them one after another', () => {
    const summary = buildDaySummary([event('Team A', 600, 660), event('Team B', 630, 690)], HOURS);
    expect(summary.timeline.map(describeEntry)).toEqual([
      'free 60',
      'cluster[Team A@0, Team B@1] CLASH',
      'free 360',
    ]);
  });

  it('treats the merged span as busy exactly once', () => {
    // 10:00-11:00 plus 10:30-11:30 is busy 10:00-11:30 - 90 minutes, not 120.
    const summary = buildDaySummary([event('Team A', 600, 660), event('Team B', 630, 690)], HOURS);
    expect(summary.totalBusyMinutes).toBe(90);
    expect(summary.totalFreeMinutes).toBe(510 - 90);
  });

  it('does not call a required and an optional meeting a clash', () => {
    const summary = buildDaySummary(
      [event('Sprint planning', 600, 660), optionalEvent('Catch-up', 630, 660)],
      HOURS
    );
    const cluster = summary.timeline.find(entry => entry.kind === 'cluster');
    expect(cluster && cluster.kind === 'cluster' && cluster.clash).toBe(false);
    expect(summary.clashCount).toBe(0);
  });

  it('does not call two optional meetings a clash', () => {
    const summary = buildDaySummary(
      [optionalEvent('One', 600, 660), optionalEvent('Two', 630, 690)],
      HOURS
    );
    expect(summary.clashCount).toBe(0);
  });

  // The rule this replaces said the opposite. A family event used to block the
  // day and therefore collide with a meeting; it is now information, so a
  // meeting running over the school run is not a diary problem to solve.
  it('does not call a meeting overlapping a family event a clash', () => {
    const summary = buildDaySummary(
      [event('Sprint planning', 600, 660), familyEvent('School pickup', 630, 690)],
      HOURS
    );
    expect(summary.clashCount).toBe(0);
  });
});

describe('buildDaySummary with optional meetings', () => {
  it('does not let an optional meeting reduce free time', () => {
    const summary = buildDaySummary([optionalEvent('Catch-up', 600, 660)], HOURS);
    expect(summary.totalFreeMinutes).toBe(510);
    expect(summary.totalBusyMinutes).toBe(0);
  });

  it('shows an optional meeting inside the free time it competes for', () => {
    const summary = buildDaySummary([optionalEvent('Catch-up', 600, 660)], HOURS);
    expect(summary.timeline.map(describeEntry)).toEqual(['free 510 (Catch-up)']);
    expect(summary.totalOptionalMinutes).toBe(60);
  });

  it('keeps an optional meeting hidden behind a required one out of the free count', () => {
    // The user's example: 10:00-11:00 required, 10:30-11:00 optional. The
    // optional one costs nothing, because that time was never yours anyway.
    const summary = buildDaySummary(
      [event('Sprint planning', 600, 660), optionalEvent('Catch-up', 630, 660)],
      HOURS
    );
    expect(summary.totalOptionalMinutes).toBe(0);
    expect(summary.totalFreeMinutes).toBe(510 - 60);
  });

  it('still reports free time either side of an optional meeting', () => {
    const summary = buildDaySummary(
      [event('Stand-up', 540, 570), optionalEvent('Catch-up', 660, 720)],
      HOURS
    );
    expect(summary.timeline.map(describeEntry)).toEqual(['Stand-up', 'free 480 (Catch-up)']);
    expect(summary.totalFreeMinutes).toBe(480);
  });
});

describe('findNextUp with optional meetings', () => {
  it('reports free time up to the next required meeting, ignoring an optional one', () => {
    const result = findNextUp(
      [optionalEvent('Catch-up', 660, 720), event('Review', 780, 840)],
      600,
      HOURS
    );
    expect(result.freeRightNowMinutes).toBe(180);
    expect(result.next?.title).toBe('Review');
    expect(result.nextOptional?.title).toBe('Catch-up');
    expect(result.minutesUntilNextOptional).toBe(60);
  });

  it('does not surface an optional meeting that starts after the next required one', () => {
    const result = findNextUp(
      [event('Review', 660, 720), optionalEvent('Catch-up', 780, 840)],
      600,
      HOURS
    );
    expect(result.nextOptional).toBeNull();
  });

  it('stays free while only an optional meeting is running', () => {
    const result = findNextUp([optionalEvent('Catch-up', 600, 660)], 620, HOURS);
    expect(result.current).toBeNull();
    expect(result.currentOptional?.title).toBe('Catch-up');
    expect(result.freeRightNowMinutes).toBe(510 - 80);
  });

  it('names the other meetings you are also meant to be in', () => {
    const result = findNextUp(
      [event('Team A', 600, 660), event('Team B', 630, 690), event('Team C', 645, 700)],
      650,
      HOURS
    );
    expect(result.current?.title).toBe('Team A');
    expect(result.alsoNow.map(e => e.title)).toEqual(['Team B', 'Team C']);
  });
});

describe('buildDaySummary with family events', () => {
  it('does not let a family event reduce free time', () => {
    const summary = buildDaySummary([familyEvent('Swimming lesson', 600, 660)], HOURS);
    expect(summary.totalFreeMinutes).toBe(510);
    expect(summary.totalBusyMinutes).toBe(0);
  });

  it('keeps a family event out of the optional tally', () => {
    // The whole point of the split: "how much of my free time has something
    // competing for it?" must not start counting other people's commitments.
    const summary = buildDaySummary([familyEvent('Swimming lesson', 600, 660)], HOURS);
    expect(summary.totalOptionalMinutes).toBe(0);
  });

  it('still shows a family event inside the free time it sits in', () => {
    const summary = buildDaySummary([familyEvent('Swimming lesson', 600, 660)], HOURS);
    expect(summary.timeline.map(describeEntry)).toEqual(['free 510 (fyi Swimming lesson)']);
  });

  it('files optional and family events in the same gap separately', () => {
    const summary = buildDaySummary(
      [optionalEvent('Catch-up', 600, 660), familyEvent('Swimming lesson', 630, 690)],
      HOURS
    );
    const [gap] = summary.freePeriods;
    expect(gap.optionalEvents.map(e => e.title)).toEqual(['Catch-up']);
    expect(gap.informationalEvents.map(e => e.title)).toEqual(['Swimming lesson']);
    // Only the optional one is asking for the time, so only it is counted.
    expect(summary.totalOptionalMinutes).toBe(60);
  });

  it('never groups a family event with a meeting it overlaps', () => {
    // The meeting stays an ordinary block. Boxing the two together would
    // highlight an overlap that costs nothing, which is the whole point of
    // the event being information rather than a commitment.
    const summary = buildDaySummary(
      [familyEvent('School pickup', 600, 690), event('Sprint planning', 600, 660)],
      HOURS
    );
    expect(summary.timeline.some(entry => entry.kind === 'cluster')).toBe(false);
    expect(summary.timeline.map(describeEntry)).toContain('Sprint planning');
  });

  it('gives a family event its own row when no gap can hold it', () => {
    // 09:00–17:30 working day, wall-to-wall meetings either side of it, so
    // there is no free period for the family event to sit inside.
    const summary = buildDaySummary(
      [
        event('Morning block', 540, 690),
        familyEvent('School pickup', 600, 660),
        event('Afternoon block', 690, 1050),
      ],
      HOURS
    );
    expect(summary.timeline.map(describeEntry)).toEqual([
      'Morning block',
      'School pickup',
      'Afternoon block',
    ]);
    // It is on the timeline, but it still took nothing.
    expect(summary.totalFreeMinutes).toBe(0);
    expect(summary.totalOptionalMinutes).toBe(0);
  });
});

describe('findNextUp with family events', () => {
  const at = (minutes: number, events: CalendarEvent[]) => findNextUp(events, minutes, HOURS);

  it('never reports a family event as the next thing up', () => {
    const next = at(9 * 60, [familyEvent('School pickup', 900, 960)]);
    expect(next.next).toBeNull();
    expect(next.nextOptional).toBeNull();
  });

  it('stays free while a family event is running', () => {
    const next = at(920, [familyEvent('School pickup', 900, 960)]);
    expect(next.current).toBeNull();
    expect(next.currentOptional).toBeNull();
    // Clear to the end of the working day, straight through the school run.
    expect(next.freeRightNowMinutes).toBe(HOURS.endMinutes - 920);
  });

  it('does not let a family event shorten the run up to the next meeting', () => {
    const next = at(9 * 60, [
      familyEvent('School pickup', 600, 660),
      event('Sprint planning', 780, 840),
    ]);
    expect(next.next?.title).toBe('Sprint planning');
    expect(next.freeRightNowMinutes).toBe(780 - 9 * 60);
  });
});
