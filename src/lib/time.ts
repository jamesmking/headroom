/**
 * Wall-clock time helpers.
 *
 * The whole application represents times as "minutes since local midnight".
 * Meetings, working hours and availability all share this representation, so
 * comparisons are plain integer arithmetic and never involve timezone maths.
 */

export const MINUTES_IN_DAY = 24 * 60;

/** '09:00' -> 540. Returns null when the input is not a valid HH:mm time. */
export const parseTime = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

/** 540 -> '09:00'. Suitable for <input type="time"> values. */
export const formatTime = (minutes: number): string => {
  const clamped = Math.max(0, Math.min(MINUTES_IN_DAY, Math.round(minutes)));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/** 90 -> '1h 30m', 45 -> '45m', 120 -> '2h'. */
export const formatDuration = (minutes: number): string => {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
};

/** Human phrasing for countdowns: 'in 45 minutes', 'in 1h 30m', 'now'. */
export const formatCountdown = (minutes: number): string => {
  if (minutes <= 0) return 'now';
  if (minutes === 1) return 'in 1 minute';
  if (minutes < 60) return `in ${minutes} minutes`;
  return `in ${formatDuration(minutes)}`;
};

/** '09:00 – 10:30' */
export const formatTimeRange = (startMinutes: number, endMinutes: number): string =>
  `${formatTime(startMinutes)} – ${formatTime(endMinutes)}`;
