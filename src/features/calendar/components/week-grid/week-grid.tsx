'use client';

import clsx from 'clsx';
import {CircleDashed, Plus, TriangleAlert} from 'lucide-react';
import Link from 'next/link';
import {Panel} from '@/components/panel';
import {TimeText} from '@/components/time-text';
import {
  buildDaySummary,
  type FreePeriod,
  type TimelineEntry,
} from '@/features/availability/availability';
import type {CalendarEvent, WorkingHours} from '@/features/calendar/types';
import {type DateKey, formatLongDate, fromDateKey, isWeekend} from '@/lib/dates';
import {formatDuration, formatTime} from '@/lib/time';
import {useNowMinutes} from '@/lib/use-now-minutes';
import {dayPath} from '@/routes';
import styles from './week-grid.module.scss';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Gaps shorter than this are not worth offering as a slot to book into. */
const MIN_BOOKABLE_FREE_MINUTES = 30;
/** Two per column: enough to see where the room is, not enough to become noise. */
const MAX_FREE_CHIPS = 2;

/** One column's contents, meetings and bookable gaps in a single ordering. */
type Slot =
  | {kind: 'event'; startMinutes: number; event: CalendarEvent}
  | {kind: 'cluster'; startMinutes: number; entry: Extract<TimelineEntry, {kind: 'cluster'}>}
  | {kind: 'free'; startMinutes: number; period: FreePeriod};

type WeekGridProps = {
  title: string;
  dateKeys: DateKey[];
  eventsByDate: Record<DateKey, CalendarEvent[]>;
  workingHours: WorkingHours;
  today: DateKey;
  timeZone: string;
  /** Wall-clock minutes at render time, so today stops offering slots gone by. */
  initialMinutes: number;
  /** The chip whose details are currently open. */
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  onAddMeeting: (date: DateKey, startMinutes?: number, endMinutes?: number) => void;
  actions?: React.ReactNode;
};

/**
 * The week at a glance, and now the place you act on it.
 *
 * Still deliberately a summary rather than an hour grid: the question it
 * answers is "which days have room in them", not "what is happening at 14:15
 * on Thursday" — that is the Day screen's job, one click away through the
 * column heading. Because there is no hour grid, the equivalent of clicking an
 * empty slot is clicking the day's clear stretches, which the availability
 * calculation already knows about.
 */
export const WeekGrid = ({
  title,
  dateKeys,
  eventsByDate,
  workingHours,
  today,
  timeZone,
  initialMinutes,
  selectedEventId,
  onSelectEvent,
  onAddMeeting,
  actions,
}: WeekGridProps) => {
  const now = useNowMinutes(timeZone, initialMinutes);

  return (
    <Panel title={title} flush actions={actions}>
      <div className={styles.Grid}>
        {dateKeys.map((key, index) => {
          const events = eventsByDate[key] ?? [];
          const allDay = events.filter(event => event.allDay);
          const summary = buildDaySummary(events, workingHours);

          // The day's shape comes from the availability calculation rather
          // than being re-derived here, so a week column and the Day view can
          // never disagree about what overlaps what.
          const timedEntries = summary.timeline.filter(entry => entry.kind !== 'free');
          // Both weaker claims ride along in the gap they sit in. A week column
          // is still a timeline, so leaving family events out would make the
          // week disagree with the day about what is on.
          const optionalInGaps = summary.freePeriods.flatMap(period => [
            ...period.optionalEvents,
            ...period.informationalEvents,
          ]);
          const isToday = key === today;
          const past = key < today;

          // Only offer slots you could actually book: weekdays, still to come,
          // long enough to put something real in, and — on today — not already
          // behind you.
          const freePeriods =
            past || isWeekend(key)
              ? []
              : [...summary.freePeriods]
                  .filter(period => period.durationMinutes >= MIN_BOOKABLE_FREE_MINUTES)
                  .filter(period => !isToday || period.endMinutes > now)
                  .sort((a, b) => b.durationMinutes - a.durationMinutes)
                  .slice(0, MAX_FREE_CHIPS);

          // Meetings and gaps interleaved, so the column reads down the day in
          // order rather than listing everything booked and then everything free.
          const slots: Slot[] = [
            ...timedEntries.map((entry): Slot =>
              entry.kind === 'cluster'
                ? {kind: 'cluster', startMinutes: entry.startMinutes, entry}
                : {kind: 'event', startMinutes: entry.startMinutes, event: entry.event}
            ),
            // Optional meetings sit inside free time rather than occupying it,
            // so they ride along with the gap they are competing for.
            ...optionalInGaps.map((event): Slot => ({
              kind: 'event',
              startMinutes: event.startMinutes,
              event,
            })),
            ...freePeriods.map((period): Slot => ({
              kind: 'free',
              startMinutes: period.startMinutes,
              period,
            })),
          ].sort((a, b) => a.startMinutes - b.startMinutes);

          return (
            <div
              key={key}
              className={clsx(
                styles.Day,
                isWeekend(key) && styles.Weekend,
                past && styles.Past,
                isToday && styles.Today
              )}
            >
              <div className={styles.DayHead}>
                <Link className={styles.DayLink} href={dayPath(key)}>
                  <span className={styles.DayName}>
                    {WEEKDAYS[index]}
                    {isToday && <span className={styles.TodayMarker}> · today</span>}
                  </span>
                  <span className={styles.DayNumber}>{fromDateKey(key).getUTCDate()}</span>
                  <span className="sr-only">{`Open ${formatLongDate(key)}`}</span>
                </Link>

                <button
                  type="button"
                  className={styles.Add}
                  onClick={() => onAddMeeting(key)}
                  title={`Add a meeting on ${formatLongDate(key)}`}
                >
                  <Plus size={13} aria-hidden="true" />
                  <span className="sr-only">{`Add a meeting on ${formatLongDate(key)}`}</span>
                </button>
              </div>

              <div className={styles.Events}>
                {allDay.map(event => (
                  <button
                    key={event.id}
                    type="button"
                    className={clsx(styles.AllDay, selectedEventId === event.id && styles.Selected)}
                    onClick={() => onSelectEvent(event.id)}
                    aria-pressed={selectedEventId === event.id}
                  >
                    <span className={styles.AllDayDot} aria-hidden="true" />
                    <span className={styles.AllDayText}>{event.title}</span>
                    <span className="sr-only"> — all day</span>
                  </button>
                ))}

                {slots.length === 0 && allDay.length === 0 && <p className={styles.Quiet}>Clear</p>}

                {slots.map(slot =>
                  slot.kind === 'cluster' ? (
                    <div
                      key={`cluster-${slot.startMinutes}`}
                      className={clsx(styles.Cluster, slot.entry.clash && styles.ClusterClash)}
                    >
                      <p className={styles.ClusterHead}>
                        {slot.entry.clash && (
                          <TriangleAlert
                            size={10}
                            aria-hidden="true"
                            className={styles.ClusterIcon}
                          />
                        )}
                        {slot.entry.clash ? 'Clash' : 'Overlapping'}
                        <span className="sr-only">
                          {` — ${slot.entry.events.length} events, ${formatTime(slot.entry.startMinutes)} to ${formatTime(slot.entry.endMinutes)}`}
                        </span>
                      </p>
                      {slot.entry.events.map(placed => (
                        <EventChip
                          key={placed.event.id}
                          event={placed.event}
                          selected={selectedEventId === placed.event.id}
                          onSelect={onSelectEvent}
                        />
                      ))}
                    </div>
                  ) : slot.kind === 'event' ? (
                    <EventChip
                      key={slot.event.id}
                      event={slot.event}
                      selected={selectedEventId === slot.event.id}
                      onSelect={onSelectEvent}
                    />
                  ) : (
                    <button
                      key={`free-${slot.startMinutes}`}
                      type="button"
                      className={styles.Free}
                      onClick={() =>
                        onAddMeeting(key, slot.period.startMinutes, slot.period.endMinutes)
                      }
                    >
                      <Plus size={11} className={styles.FreeIcon} aria-hidden="true" />
                      <span className={styles.FreeTime}>
                        {formatTime(slot.period.startMinutes)}
                      </span>
                      <span>{`· ${formatDuration(slot.period.durationMinutes)} clear`}</span>
                      <span className="sr-only">{` — add a meeting on ${formatLongDate(key)}`}</span>
                    </button>
                  )
                )}
              </div>

              <p className={styles.DayFoot}>
                <TimeText className={styles.FootValue}>
                  {formatDuration(summary.totalFreeMinutes)}
                </TimeText>{' '}
                free
                {summary.clashCount > 0 && (
                  <span className={styles.FootClash}>
                    <TriangleAlert size={10} aria-hidden="true" />
                    {summary.clashCount}
                    <span className="sr-only">
                      {summary.clashCount === 1 ? ' clash' : ' clashes'}
                    </span>
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

/**
 * One event in a week column. Shared by the ordinary and clustered cases, so a
 * meeting looks the same wherever it lands.
 */
const EventChip = ({
  event,
  selected,
  onSelect,
}: {
  event: CalendarEvent;
  selected: boolean;
  onSelect: (eventId: string) => void;
}) => (
  <button
    type="button"
    className={clsx(
      styles.Event,
      event.source === 'family' && styles.Family,
      event.claim === 'optional' && styles.Optional,
      selected && styles.Selected
    )}
    style={{'--role-colour': event.role.colour} as React.CSSProperties}
    onClick={() => onSelect(event.id)}
    aria-pressed={selected}
  >
    <span className={styles.EventTime}>
      {formatTime(event.startMinutes)}
      {event.claim === 'optional' && (
        <>
          <CircleDashed size={9} aria-hidden="true" className={styles.OptionalIcon} />
          <span className="sr-only"> optional</span>
        </>
      )}
    </span>
    <span className={styles.EventTitle}>{event.title}</span>
  </button>
);
