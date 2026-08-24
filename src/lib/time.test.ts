import {formatCountdown, formatDuration, formatTime, formatTimeRange, parseTime} from './time';

describe('parseTime', () => {
  it('parses HH:mm', () => {
    expect(parseTime('09:00')).toBe(540);
    expect(parseTime('17:30')).toBe(1050);
    expect(parseTime('00:00')).toBe(0);
    expect(parseTime('9:05')).toBe(545);
  });

  it('rejects invalid times', () => {
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('12:60')).toBeNull();
    expect(parseTime('noon')).toBeNull();
    expect(parseTime('')).toBeNull();
  });
});

describe('formatTime', () => {
  it('pads to HH:mm', () => {
    expect(formatTime(540)).toBe('09:00');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(1050)).toBe('17:30');
  });

  it('round-trips with parseTime', () => {
    for (const value of ['00:00', '09:15', '13:45', '23:59']) {
      expect(formatTime(parseTime(value) as number)).toBe(value);
    }
  });
});

describe('formatDuration', () => {
  it('formats minutes, hours, and both', () => {
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(0)).toBe('0m');
  });

  it('never reports negative time', () => {
    expect(formatDuration(-30)).toBe('0m');
  });
});

describe('formatCountdown', () => {
  it('reads naturally', () => {
    expect(formatCountdown(0)).toBe('now');
    expect(formatCountdown(1)).toBe('in 1 minute');
    expect(formatCountdown(45)).toBe('in 45 minutes');
    expect(formatCountdown(90)).toBe('in 1h 30m');
  });
});

describe('formatTimeRange', () => {
  it('joins with an en dash', () => {
    expect(formatTimeRange(600, 630)).toBe('10:00 – 10:30');
  });
});
