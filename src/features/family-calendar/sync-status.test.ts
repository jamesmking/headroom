import {decideFamilyStatus, describeAge, type SyncSnapshot} from './sync-status';
import type {DateKey} from '@/lib/dates';

const NOW = new Date('2026-08-28T12:00:00.000Z');
const DAY = 26 * 60 * 60;

const hoursAgo = (hours: number): Date => new Date(NOW.getTime() - hours * 3_600_000);

const snapshot = (overrides: Partial<SyncSnapshot> = {}): SyncSnapshot => ({
  fetchedAt: hoursAgo(2),
  status: 'ok',
  message: null,
  windowStart: '2026-03-01' as DateKey,
  windowEnd: '2028-02-19' as DateKey,
  ...overrides,
});

const decide = (sync: SyncSnapshot, requested: string[]) =>
  decideFamilyStatus({
    sync,
    requested: requested as DateKey[],
    now: NOW,
    maxAgeSeconds: DAY,
  });

describe('decideFamilyStatus', () => {
  it('serves a recent successful sync without comment', () => {
    expect(decide(snapshot(), ['2026-08-28'])).toEqual({
      serve: true,
      status: 'ok',
      message: null,
    });
  });

  it('refuses a range that has never been expanded', () => {
    // An empty calendar here would read as "nothing on that day", which is a
    // different claim from "nobody has looked".
    const decision = decide(snapshot(), ['2029-01-01']);
    expect(decision.serve).toBe(false);
    expect(decision.status).toBe('unavailable');
    expect(decision.message).toContain('2026-03-01 to 2028-02-19');
  });

  it('refuses a range entirely before the window too', () => {
    expect(decide(snapshot(), ['2025-01-01']).serve).toBe(false);
  });

  it('serves a range that only partly overlaps the window', () => {
    // The overlap is real data; refusing the whole week because its last day
    // falls outside would hide days that were synced.
    expect(decide(snapshot(), ['2028-02-18', '2028-02-19', '2028-02-20']).serve).toBe(true);
  });

  it('still serves the last good rows when the refresh failed, and says so', () => {
    const decision = decide(
      snapshot({status: 'error', message: 'Calendar feed responded with 503', fetchedAt: hoursAgo(5)}),
      ['2026-08-28']
    );
    expect(decision).toMatchObject({serve: true, status: 'stale'});
    expect(decision.message).toContain('503');
    expect(decision.message).toContain('5 hours ago');
  });

  it('marks a successful but long-stale sync as stale', () => {
    // The alarm is for a schedule that has stopped, not for a normal gap
    // between runs, so it is measured in days rather than minutes.
    const decision = decide(snapshot({fetchedAt: hoursAgo(50)}), ['2026-08-28']);
    expect(decision).toMatchObject({serve: true, status: 'stale'});
    expect(decision.message).toContain('2 days ago');
  });

  it('does not call a sync stale just inside the threshold', () => {
    expect(decide(snapshot({fetchedAt: hoursAgo(25)}), ['2026-08-28']).status).toBe('ok');
  });

  it('prefers the failure message over the age message', () => {
    // Both conditions hold; the reason it is stale is more useful than the fact.
    const decision = decide(snapshot({status: 'error', message: 'boom', fetchedAt: hoursAgo(50)}), [
      '2026-08-28',
    ]);
    expect(decision.message).toContain('boom');
  });
});

describe('describeAge', () => {
  it.each([
    [0.5, 'less than an hour ago'],
    [1, '1 hour ago'],
    [3, '3 hours ago'],
    [47, '47 hours ago'],
    [48, '2 days ago'],
    [72, '3 days ago'],
  ])('describes %p hours as %p', (hours, expected) => {
    expect(describeAge(hoursAgo(hours as number), NOW)).toBe(expected);
  });
});
