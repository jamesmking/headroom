import type {CalendarEvent, WorkingHours} from '@/features/calendar/types';
import {buildDaySummary, calculateFreePeriods, findNextUp, mergeIntervals} from './availability';

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
  role: null,
  recurring: false,
  readOnly: false,
  ...overrides,
});

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
    expect(
      summary.timeline.map(entry =>
        entry.kind === 'event' ? entry.event.title : `free ${entry.durationMinutes}`
      )
    ).toEqual(['free 60', 'Team A stand-up', 'free 90', 'Team B planning', 'free 270']);
  });

  it('excludes all-day events from the timeline', () => {
    const summary = buildDaySummary(
      [event('School holiday', 0, 1440, {allDay: true, source: 'family'})],
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
