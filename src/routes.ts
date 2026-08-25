import type {DateKey} from '@/lib/dates';

/**
 * Today keeps the root path: it is the home screen, and a bookmark of it
 * should always mean "the day I am in", never a date frozen at bookmark time.
 * Every other day is addressable, and therefore bookmarkable, at /day/<date>.
 */
export const todayPath = () => '/';

/**
 * Href templates, and the placeholder inside them.
 *
 * A Client Component cannot be handed a function across the server boundary,
 * so anything that builds a URL from a date the user has not chosen yet — the
 * date picker — receives one of these templates and fills it in instead.
 */
export const DATE_TOKEN = ':date';
export const dayPathTemplate = `/day/${DATE_TOKEN}`;
export const weekPathTemplate = `/week/${DATE_TOKEN}`;

export const fillDate = (template: string, date: DateKey): string =>
  template.replace(DATE_TOKEN, date);

export const dayPath = (date: DateKey) => fillDate(dayPathTemplate, date);
export const weekPath = (date?: DateKey) => (date ? fillDate(weekPathTemplate, date) : '/week');
/** An explicit plan date makes the backlog add to that day rather than today. */
export const tasksPath = (planDate?: DateKey) =>
  planDate ? `/tasks?plan=${planDate}` : '/tasks';
export const settingsPath = () => '/settings';
export const signInPath = () => '/signin';
