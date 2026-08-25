/**
 * @jest-environment node
 */
import {
  addDays,
  dateKeyInZone,
  describeDay,
  describeWeek,
  formatDateRange,
  daysBetween,
  describeDueDate,
  fromDateKey,
  isDateKey,
  isWeekend,
  localDateKey,
  minutesInZone,
  startOfWeek,
  toDateKey,
  weekKeys,
} from './dates';

describe('date keys', () => {
  it('round-trips a key through a Date without shifting the day', () => {
    expect(toDateKey(fromDateKey('2026-08-24'))).toBe('2026-08-24');
    expect(toDateKey(fromDateKey('2026-01-01'))).toBe('2026-01-01');
    expect(toDateKey(fromDateKey('2026-12-31'))).toBe('2026-12-31');
  });

  it('validates the key format', () => {
    expect(isDateKey('2026-08-24')).toBe(true);
    expect(isDateKey('24-08-2026')).toBe(false);
    expect(isDateKey('not a date')).toBe(false);
  });

  it('adds days across a month boundary', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('counts days between keys', () => {
    expect(daysBetween('2026-08-24', '2026-08-31')).toBe(7);
    expect(daysBetween('2026-08-31', '2026-08-24')).toBe(-7);
  });

  it('counts days across a DST change without drifting', () => {
    // UK clocks go back on 25 October 2026.
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
  });
});

describe('weeks', () => {
  it('starts the week on Monday', () => {
    expect(startOfWeek('2026-08-24')).toBe('2026-08-24'); // Monday
    expect(startOfWeek('2026-08-28')).toBe('2026-08-24'); // Friday
    expect(startOfWeek('2026-08-30')).toBe('2026-08-24'); // Sunday
  });

  it('lists seven days beginning on Monday', () => {
    const keys = weekKeys('2026-08-27');
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe('2026-08-24');
    expect(keys[6]).toBe('2026-08-30');
  });

  it('identifies weekends', () => {
    expect(isWeekend('2026-08-29')).toBe(true);
    expect(isWeekend('2026-08-30')).toBe(true);
    expect(isWeekend('2026-08-28')).toBe(false);
  });
});

describe('timezone conversion', () => {
  it('maps an instant to the local calendar day', () => {
    // 23:30 UTC is already the next day in Sydney.
    const instant = new Date('2026-08-24T23:30:00Z');
    expect(dateKeyInZone(instant, 'UTC')).toBe('2026-08-24');
    expect(dateKeyInZone(instant, 'Australia/Sydney')).toBe('2026-08-25');
  });

  it('maps an instant to local wall-clock minutes', () => {
    const instant = new Date('2026-08-24T13:00:00Z');
    expect(minutesInZone(instant, 'UTC')).toBe(13 * 60);
    expect(minutesInZone(instant, 'Europe/London')).toBe(14 * 60); // BST
  });

  it('normalises midnight to zero rather than 24:00', () => {
    expect(minutesInZone(new Date('2026-08-24T00:00:00Z'), 'UTC')).toBe(0);
  });

  it('reads a local-midnight Date back as its own calendar date', () => {
    const local = new Date(2026, 7, 26); // 26 August, local midnight
    expect(localDateKey(local)).toBe('2026-08-26');
  });
});

describe('describeDueDate', () => {
  const today = '2026-08-24';

  it('describes today and tomorrow', () => {
    expect(describeDueDate('2026-08-24', today)).toBe('Due today');
    expect(describeDueDate('2026-08-25', today)).toBe('Due tomorrow');
  });

  it('describes overdue tasks', () => {
    expect(describeDueDate('2026-08-23', today)).toBe('Due yesterday');
    expect(describeDueDate('2026-08-22', today)).toBe('Overdue by 2 days');
  });

  it('names the weekday within the coming week', () => {
    expect(describeDueDate('2026-08-28', today)).toBe('Due Friday');
  });

  it('falls back to a short date further out', () => {
    expect(describeDueDate('2026-09-15', today)).toBe('Due Tue 15 Sep');
  });
});

describe('describeDay', () => {
  // A Monday, matching the fixture used throughout this file.
  const today = '2026-08-24';

  it('names the days either side of today', () => {
    expect(describeDay(today, today)).toBe('Today');
    expect(describeDay('2026-08-25', today)).toBe('Tomorrow');
    expect(describeDay('2026-08-23', today)).toBe('Yesterday');
  });

  it('names weekdays within the coming week', () => {
    expect(describeDay('2026-08-26', today)).toBe('Wednesday');
    expect(describeDay('2026-08-30', today)).toBe('Sunday');
  });

  it('qualifies the same weekday a week out', () => {
    expect(describeDay('2026-08-31', today)).toBe('Next Monday');
  });

  it('falls back to a dated label once a weekday would be ambiguous', () => {
    expect(describeDay('2026-09-15', today)).toBe('Tue 15 Sep');
    // Two days back is a weekday name people would read as the coming one.
    expect(describeDay('2026-08-22', today)).toBe('Sat 22 Aug');
  });
});

describe('describeWeek', () => {
  const today = '2026-08-26';

  it('names the weeks either side of this one', () => {
    expect(describeWeek('2026-08-24', today)).toBe('This week');
    expect(describeWeek('2026-08-31', today)).toBe('Next week');
    expect(describeWeek('2026-08-17', today)).toBe('Last week');
  });

  it('dates anything further out', () => {
    expect(describeWeek('2026-09-14', today)).toBe('Week of Mon 14 Sep');
  });
});

describe('formatDateRange', () => {
  it('states the month once when both ends share it', () => {
    expect(formatDateRange('2026-08-24', '2026-08-30')).toBe('Mon 24 – Sun 30 Aug');
  });

  it('states both months when the range crosses one', () => {
    expect(formatDateRange('2026-09-28', '2026-10-04')).toBe('Mon 28 Sep – Sun 4 Oct');
  });
});
