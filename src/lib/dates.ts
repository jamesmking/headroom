/**
 * Calendar-date helpers.
 *
 * A "date key" is a plain `yyyy-MM-dd` string. It is the application's unit of
 * "which day", and it never carries a time or an offset.
 *
 * Prisma `@db.Date` columns round-trip as JavaScript Dates at UTC midnight, so
 * every conversion here uses UTC accessors. Reading a date column with local
 * accessors is the classic off-by-one-day bug and is avoided throughout.
 */

export type DateKey = string;

const KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const isDateKey = (value: string): value is DateKey => KEY_PATTERN.test(value);

/** Date (stored at UTC midnight) -> 'yyyy-MM-dd'. */
export const toDateKey = (date: Date): DateKey => date.toISOString().slice(0, 10);

/** 'yyyy-MM-dd' -> Date at UTC midnight, ready to write to a @db.Date column. */
export const fromDateKey = (key: DateKey): Date => new Date(`${key}T00:00:00.000Z`);

/**
 * The calendar date an absolute instant falls on, in the given IANA timezone.
 * This is how iCal events — which are true instants — are mapped onto days.
 */
export const dateKeyInZone = (instant: Date, timeZone: string): DateKey =>
  // 'en-CA' formats as yyyy-MM-dd, which is exactly the key format.
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);

/** The wall-clock time of an instant in the given timezone, as minutes. */
export const minutesInZone = (instant: Date, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant);
  const hour = Number(parts.find(part => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find(part => part.type === 'minute')?.value ?? '0');
  // Some locales render midnight as 24; normalise it.
  return (hour % 24) * 60 + minute;
};

/**
 * Date key taken from a Date's *local* calendar parts.
 *
 * Needed for iCal all-day values: node-ical builds date-only DTSTART/DTEND at
 * server-local midnight, so reading them with local accessors returns exactly
 * the DATE literal from the feed whatever timezone the server runs in. Reading
 * them as UTC shifts the day whenever the server is not on UTC.
 */
export const localDateKey = (date: Date): DateKey => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** The current date in the given IANA timezone, as a date key. */
export const todayKey = (timeZone: string, now: Date = new Date()): DateKey =>
  dateKeyInZone(now, timeZone);

/** Current wall-clock time in the given timezone, as minutes since midnight. */
export const nowMinutes = (timeZone: string, now: Date = new Date()): number =>
  minutesInZone(now, timeZone);

/** Shift a date key by a whole number of days. */
export const addDays = (key: DateKey, days: number): DateKey => {
  const date = fromDateKey(key);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
};

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export const daysBetween = (from: DateKey, to: DateKey): number =>
  Math.round((fromDateKey(to).getTime() - fromDateKey(from).getTime()) / 86_400_000);

/** 0 = Sunday ... 6 = Saturday, matching Date.getUTCDay(). */
export const dayOfWeek = (key: DateKey): number => fromDateKey(key).getUTCDay();

export const isWeekend = (key: DateKey): boolean => {
  const day = dayOfWeek(key);
  return day === 0 || day === 6;
};

/** The Monday on or before the given date. */
export const startOfWeek = (key: DateKey): DateKey => {
  const day = dayOfWeek(key);
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(key, offset);
};

/** The seven date keys of the week containing `key`, Monday first. */
export const weekKeys = (key: DateKey): DateKey[] => {
  const monday = startOfWeek(key);
  return Array.from({length: 7}, (_, index) => addDays(monday, index));
};

const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** 'Monday 24 August 2026' */
export const formatLongDate = (key: DateKey): string => {
  const date = fromDateKey(key);
  return `${WEEKDAY_LABELS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

/** 'Mon 24 Aug' */
export const formatShortDate = (key: DateKey): string => {
  const date = fromDateKey(key);
  return `${WEEKDAY_LABELS[date.getUTCDay()].slice(0, 3)} ${date.getUTCDate()} ${MONTH_LABELS[date.getUTCMonth()].slice(0, 3)}`;
};

/** Relative phrasing used on task due dates: 'Today', 'Tomorrow', 'Overdue'. */
export const describeDueDate = (due: DateKey, today: DateKey): string => {
  const delta = daysBetween(today, due);
  if (delta === 0) return 'Due today';
  if (delta === 1) return 'Due tomorrow';
  if (delta === -1) return 'Due yesterday';
  if (delta < 0) return `Overdue by ${Math.abs(delta)} days`;
  if (delta <= 6) return `Due ${WEEKDAY_LABELS[fromDateKey(due).getUTCDay()]}`;
  return `Due ${formatShortDate(due)}`;
};

/**
 * Relative name for a day, used as the eyebrow above the full date.
 *
 * Stays vague deliberately: 'Tuesday' is only unambiguous within the week
 * ahead, so anything further out falls back to a dated label.
 */
export const describeDay = (key: DateKey, today: DateKey): string => {
  const delta = daysBetween(today, key);
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';
  if (delta === -1) return 'Yesterday';
  if (delta >= 2 && delta <= 6) return WEEKDAY_LABELS[dayOfWeek(key)];
  if (delta === 7) return `Next ${WEEKDAY_LABELS[dayOfWeek(key)]}`;
  return formatShortDate(key);
};

/**
 * `describeDay` cased for use mid-sentence.
 *
 * Only the relative words lowercase: 'move it to tomorrow' reads correctly,
 * 'move it to thursday' does not — a weekday is a proper noun either way.
 */
export const describeDayInSentence = (key: DateKey, today: DateKey): string => {
  const label = describeDay(key, today);
  return ['Today', 'Tomorrow', 'Yesterday'].includes(label) ? label.toLowerCase() : label;
};

/** 'This week' / 'Next week' / 'Last week' / 'Week of Mon 8 Sep'. */
export const describeWeek = (weekStart: DateKey, today: DateKey): string => {
  const delta = daysBetween(startOfWeek(today), weekStart);
  if (delta === 0) return 'This week';
  if (delta === 7) return 'Next week';
  if (delta === -7) return 'Last week';
  return `Week of ${formatShortDate(weekStart)}`;
};

/** 'Mon 24 – Sun 30 Aug' / 'Mon 29 Sep – Sun 5 Oct' — collapses a shared month. */
export const formatDateRange = (from: DateKey, to: DateKey): string => {
  const start = fromDateKey(from);
  const end = fromDateKey(to);
  const startLabel = `${WEEKDAY_LABELS[start.getUTCDay()].slice(0, 3)} ${start.getUTCDate()}`;
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  return sameMonth
    ? `${startLabel} – ${formatShortDate(to)}`
    : `${formatShortDate(from)} – ${formatShortDate(to)}`;
};
