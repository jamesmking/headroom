import {occurrencesWithin, occursOn, type RecurringMeeting} from './recurrence';

const meeting = (overrides: Partial<RecurringMeeting> = {}): RecurringMeeting => ({
  // 2026-08-24 is a Monday.
  date: '2026-08-24',
  recurrence: 'NONE',
  recurrenceEndDate: null,
  skippedDates: [],
  ...overrides,
});

describe('occursOn', () => {
  it('matches a one-off meeting only on its own date', () => {
    const oneOff = meeting();
    expect(occursOn(oneOff, '2026-08-24')).toBe(true);
    expect(occursOn(oneOff, '2026-08-25')).toBe(false);
    expect(occursOn(oneOff, '2026-08-23')).toBe(false);
  });

  it('never occurs before the first date, whatever the pattern', () => {
    expect(occursOn(meeting({recurrence: 'DAILY'}), '2026-08-23')).toBe(false);
    expect(occursOn(meeting({recurrence: 'WEEKLY'}), '2026-08-17')).toBe(false);
  });

  it('repeats daily', () => {
    const daily = meeting({recurrence: 'DAILY'});
    expect(occursOn(daily, '2026-08-25')).toBe(true);
    expect(occursOn(daily, '2026-09-30')).toBe(true);
  });

  it('repeats on weekdays only', () => {
    const weekdays = meeting({recurrence: 'WEEKDAYS'});
    expect(occursOn(weekdays, '2026-08-28')).toBe(true); // Friday
    expect(occursOn(weekdays, '2026-08-29')).toBe(false); // Saturday
    expect(occursOn(weekdays, '2026-08-30')).toBe(false); // Sunday
    expect(occursOn(weekdays, '2026-08-31')).toBe(true); // Monday
  });

  it('repeats weekly on the same weekday', () => {
    const weekly = meeting({recurrence: 'WEEKLY'});
    expect(occursOn(weekly, '2026-08-31')).toBe(true);
    expect(occursOn(weekly, '2026-09-07')).toBe(true);
    expect(occursOn(weekly, '2026-08-25')).toBe(false);
  });

  it('repeats fortnightly', () => {
    const fortnightly = meeting({recurrence: 'FORTNIGHTLY'});
    expect(occursOn(fortnightly, '2026-08-31')).toBe(false);
    expect(occursOn(fortnightly, '2026-09-07')).toBe(true);
    expect(occursOn(fortnightly, '2026-09-21')).toBe(true);
  });

  it('stops after the recurrence end date', () => {
    const ending = meeting({recurrence: 'WEEKLY', recurrenceEndDate: '2026-09-07'});
    expect(occursOn(ending, '2026-09-07')).toBe(true);
    expect(occursOn(ending, '2026-09-14')).toBe(false);
  });

  it('skips individually cancelled occurrences', () => {
    const withSkip = meeting({recurrence: 'WEEKDAYS', skippedDates: ['2026-08-26']});
    expect(occursOn(withSkip, '2026-08-25')).toBe(true);
    expect(occursOn(withSkip, '2026-08-26')).toBe(false);
    expect(occursOn(withSkip, '2026-08-27')).toBe(true);
  });

  it('ignores a skipped date on a non-recurring meeting boundary', () => {
    const daily = meeting({recurrence: 'DAILY', skippedDates: ['2026-08-24']});
    expect(occursOn(daily, '2026-08-24')).toBe(false);
  });
});

describe('occurrencesWithin', () => {
  it('lists the days a weekday meeting lands on across a week', () => {
    const week = [
      '2026-08-24',
      '2026-08-25',
      '2026-08-26',
      '2026-08-27',
      '2026-08-28',
      '2026-08-29',
      '2026-08-30',
    ];
    expect(occurrencesWithin(meeting({recurrence: 'WEEKDAYS'}), week)).toEqual([
      '2026-08-24',
      '2026-08-25',
      '2026-08-26',
      '2026-08-27',
      '2026-08-28',
    ]);
  });
});
