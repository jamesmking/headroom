import type {DateKey} from '@/lib/dates';

/** A role badge as rendered in the UI. Safe to pass to Client Components. */
export type RoleSummary = {
  id: string;
  name: string;
  shortName: string;
  colour: string;
};

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
  role: RoleSummary | null;
  /** True when this event is one occurrence of a recurring meeting. */
  recurring: boolean;
  /** Family calendar events cannot be edited inside the application. */
  readOnly: boolean;
};

export type WorkingHours = {
  startMinutes: number;
  endMinutes: number;
};
