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
 * How strongly an event lays claim to your time.
 *
 * Ordered from most to least demanding, which is also the order events are
 * drawn in when they collide.
 */
export type EventClaim = 'required' | 'optional' | 'informational';

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
   * How much of a claim this event has on your working day.
   *
   * - `required` — you are expected there, so the time is gone.
   * - `optional` — you would join if you were free. Shown in full, but it
   *   never reduces reported availability: the whole point of marking one is
   *   that the time is still yours.
   * - `informational` — someone else's commitment, on your calendar so you
   *   know about it. It neither takes the time nor competes for it, so it is
   *   drawn for reference and left out of the day's totals entirely.
   *
   * This is deliberately independent of `source`: it describes what the event
   * does to your day, not where it came from. Family calendar events are
   * informational today, but that is a mapping decision made where they are
   * read, not a fact baked into the shape.
   */
  claim: EventClaim;
  /** Family calendar events cannot be edited inside the application. */
  readOnly: boolean;
};

export type WorkingHours = {
  startMinutes: number;
  endMinutes: number;
};
