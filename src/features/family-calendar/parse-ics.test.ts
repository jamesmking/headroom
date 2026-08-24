/**
 * @jest-environment node
 */
import {parseIcsToEvents} from './parse-ics';

const calendar = (...events: string[]) =>
  [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Headroom//Test//EN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

const timedEvent = `BEGIN:VEVENT
UID:timed-1
DTSTAMP:20260801T090000Z
DTSTART:20260824T130000Z
DTEND:20260824T140000Z
SUMMARY:Dentist
LOCATION:High Street
END:VEVENT`;

const allDayEvent = `BEGIN:VEVENT
UID:allday-1
DTSTAMP:20260801T090000Z
DTSTART;VALUE=DATE:20260826
DTEND;VALUE=DATE:20260828
SUMMARY:School holiday
END:VEVENT`;

const recurringEvent = `BEGIN:VEVENT
UID:weekly-1
DTSTAMP:20260801T090000Z
DTSTART:20260824T170000Z
DTEND:20260824T180000Z
RRULE:FREQ=WEEKLY;COUNT=4
SUMMARY:Swimming
END:VEVENT`;

const WEEK = [
  '2026-08-24',
  '2026-08-25',
  '2026-08-26',
  '2026-08-27',
  '2026-08-28',
  '2026-08-29',
  '2026-08-30',
];

describe('parseIcsToEvents', () => {
  it('converts a timed event into local wall-clock minutes', () => {
    // 13:00 UTC in August is 14:00 in London (BST).
    const [event] = parseIcsToEvents(calendar(timedEvent), WEEK, 'Europe/London');
    expect(event.title).toBe('Dentist');
    expect(event.date).toBe('2026-08-24');
    expect(event.startMinutes).toBe(14 * 60);
    expect(event.endMinutes).toBe(15 * 60);
    expect(event.allDay).toBe(false);
  });

  it('marks family events read-only and without a role', () => {
    const [event] = parseIcsToEvents(calendar(timedEvent), WEEK, 'Europe/London');
    expect(event.source).toBe('family');
    expect(event.readOnly).toBe(true);
    expect(event.role).toBeNull();
    expect(event.meetingId).toBeNull();
  });

  it('includes the location in the notes', () => {
    const [event] = parseIcsToEvents(calendar(timedEvent), WEEK, 'Europe/London');
    expect(event.notes).toContain('High Street');
  });

  it('converts the same instant differently in another timezone', () => {
    const [event] = parseIcsToEvents(calendar(timedEvent), WEEK, 'UTC');
    expect(event.startMinutes).toBe(13 * 60);
  });

  it('expands an all-day event across each day it covers, end-exclusive', () => {
    const events = parseIcsToEvents(calendar(allDayEvent), WEEK, 'Europe/London');
    expect(events.map(event => event.date)).toEqual(['2026-08-26', '2026-08-27']);
    expect(events.every(event => event.allDay)).toBe(true);
    expect(events[0].startMinutes).toBe(0);
    expect(events[0].endMinutes).toBe(1440);
  });

  it('expands a recurring event across the requested range only', () => {
    const events = parseIcsToEvents(calendar(recurringEvent), WEEK, 'Europe/London');
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2026-08-24');
    expect(events[0].recurring).toBe(true);

    const fortnight = [...WEEK, '2026-08-31'];
    const later = parseIcsToEvents(calendar(recurringEvent), fortnight, 'Europe/London');
    expect(later.map(event => event.date)).toEqual(['2026-08-24', '2026-08-31']);
  });

  it('ignores days outside the requested range', () => {
    const events = parseIcsToEvents(calendar(timedEvent), ['2026-09-01'], 'Europe/London');
    expect(events).toEqual([]);
  });

  it('returns nothing for a calendar with no events', () => {
    expect(parseIcsToEvents(calendar(), WEEK, 'Europe/London')).toEqual([]);
  });

  it('sorts events chronologically', () => {
    const events = parseIcsToEvents(calendar(recurringEvent, timedEvent), WEEK, 'Europe/London');
    expect(events.map(event => event.title)).toEqual(['Dentist', 'Swimming']);
  });
});
