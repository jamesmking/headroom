import type {DateKey} from '@/lib/dates';

/** A role badge as rendered in the UI. Safe to pass to Client Components. */
export type RoleSummary = {
  id: string;
  name: string;
  shortName: string;
  colour: string;
};

/**
 * A role as offered in a picker.
 *
 * Archived roles are carried alongside active ones so that editing something
 * filed under a role you have since archived does not silently move it. The
 * forms offer an archived role only when it is the current value.
 */
export type RoleOption = RoleSummary & {active: boolean};

/**
 * A single thing occupying time on a given day.
 *
 * Both manually entered meetings and read-only family calendar events are
 * normalised into this shape, so the timeline and availability calculation
 * never need to know where an event came from.
 */
export type CalendarEvent = {
  /** Stable within a day. Recurring meetings use `${meetingId}:${dateKey}`. */
  id: string;
  /** The underlying Meeting id, when this event is editable. */
  meetingId: string | null;
  source: 'meeting' | 'family';
  title: string;
  date: DateKey;
  startMinutes: number;
  endMinutes: number;
  allDay: boolean;
  notes: string | null;
  /**
   * Never null: every meeting must have a role, and family calendar events
   * carry the synthetic `FAMILY_ROLE` so the UI has one shape to render.
   */
  role: RoleSummary;
  /** True when this event is one occurrence of a recurring meeting. */
  recurring: boolean;
  /**
   * An event you would join if you were free.
   *
   * Optional events are shown in full but never reduce reported availability:
   * the whole point of marking one is that the time is still yours. Family
   * calendar events are never optional — a school pickup genuinely blocks you.
   */
  optional: boolean;
  /** Family calendar events cannot be edited inside the application. */
  readOnly: boolean;
};

export type WorkingHours = {
  startMinutes: number;
  endMinutes: number;
};
