'use client';

import clsx from 'clsx';
import {CircleDashed, Lock, NotebookPen, Pencil, Plus, Repeat, TriangleAlert} from 'lucide-react';
import {RoleBadge} from '@/components/role-badge';
import {TimeText} from '@/components/time-text';
import {buildDaySummary, type TimelineEntry} from '@/features/availability/availability';
import type {CalendarEvent, WorkingHours} from '@/features/calendar/types';
import {useNowMinutes} from '@/lib/use-now-minutes';
import {formatDuration, formatTime, formatTimeRange} from '@/lib/time';
import styles from './day-timeline.module.scss';

/**
 * Block heights are proportional to real duration, so a two-hour meeting looks
 * twice a one-hour meeting and a long gap looks like a long gap. Both ends are
 * clamped: short meetings stay readable, and a four-hour gap does not push the
 * rest of the day off screen.
 */
const PIXELS_PER_MINUTE = 1.1;
const MIN_EVENT_HEIGHT = 58;
const MAX_EVENT_HEIGHT = 220;
const MIN_FREE_HEIGHT = 54;
const MAX_FREE_HEIGHT = 150;

const heightFor = (entry: TimelineEntry): number => {
  const duration = entry.endMinutes - entry.startMinutes;
  const raw = duration * PIXELS_PER_MINUTE;
  if (entry.kind === 'free') {
    return Math.min(MAX_FREE_HEIGHT, Math.max(MIN_FREE_HEIGHT, raw));
  }
  // A cluster has to hold its members side by side, so it needs at least the
  // height of one block plus the offset of the last column's start.
  const minimum = entry.kind === 'cluster' ? MIN_EVENT_HEIGHT * 1.6 : MIN_EVENT_HEIGHT;
  return Math.min(MAX_EVENT_HEIGHT * 1.4, Math.max(minimum, raw));
};

type DayTimelineProps = {
  events: CalendarEvent[];
  workingHours: WorkingHours;
  timeZone: string;
  initialMinutes: number;
  /** Today only: draws the live now-line. */
  showNow: boolean;
  onEditMeeting?: (meetingId: string) => void;
  onAddMeetingAt?: (startMinutes: number, endMinutes: number) => void;
};

export const DayTimeline = ({
  events,
  workingHours,
  timeZone,
  initialMinutes,
  showNow,
  onEditMeeting,
  onAddMeetingAt,
}: DayTimelineProps) => {
  const now = useNowMinutes(timeZone, initialMinutes);
  const summary = buildDaySummary(events, workingHours);
  const allDay = events.filter(event => event.allDay);

  // Meetings that fall outside working hours still need to be visible.
  const outside = events.filter(
    event =>
      !event.allDay &&
      (event.endMinutes <= workingHours.startMinutes ||
        event.startMinutes >= workingHours.endMinutes)
  );

  if (summary.timeline.length === 0 && allDay.length === 0 && outside.length === 0) {
    return null;
  }

  return (
    <div>
      {allDay.length > 0 && (
        <div className={styles.AllDay}>
          <p className={styles.AllDayLabel}>
            {allDay.length === 1 ? 'All day' : `All day · ${allDay.length}`}
          </p>
          {allDay.map(event => (
            <div key={event.id}>
              <p className={styles.AllDayEvent}>
                <span className={styles.AllDayDot} aria-hidden="true" />
                {event.title}
              </p>
              {event.notes && <p className={styles.AllDayNote}>{event.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <ol className={styles.Timeline}>
        {summary.timeline.map(entry => {
          const containsNow = showNow && now >= entry.startMinutes && now < entry.endMinutes;
          const nowOffset = containsNow
            ? ((now - entry.startMinutes) / (entry.endMinutes - entry.startMinutes)) * 100
            : 0;

          return (
            <li
              key={`${entry.kind}-${entry.startMinutes}-${entry.endMinutes}`}
              className={styles.Row}
              style={{'--row-height': `${heightFor(entry)}px`} as React.CSSProperties}
            >
              <span className={clsx(styles.Rail, entry.kind !== 'free' && styles.RailStrong)}>
                {formatTime(entry.startMinutes)}
              </span>

              {entry.kind === 'event' && (
                <EventBlock event={entry.event} current={containsNow} onEdit={onEditMeeting} />
              )}

              {entry.kind === 'cluster' && (
                <ClusterBlock entry={entry} now={showNow ? now : null} onEdit={onEditMeeting} />
              )}

              {entry.kind === 'free' && (
                <div className={styles.Free}>
                  <div className={styles.FreeTop}>
                    {/* The rail is dropped on narrow screens, so the gap has
                        to state its own start time there. */}
                    <TimeText className={styles.FreeStart}>
                      {formatTime(entry.startMinutes)}
                    </TimeText>
                    <span className={styles.FreeLabel}>
                      {formatDuration(entry.durationMinutes)} clear
                    </span>
                    <span className={styles.Rule} aria-hidden="true" />
                    {onAddMeetingAt && (
                      <button
                        type="button"
                        className={styles.FreeAdd}
                        onClick={() => onAddMeetingAt(entry.startMinutes, entry.endMinutes)}
                      >
                        <Plus size={12} aria-hidden="true" />
                        Add meeting
                        <span className="sr-only">{` at ${formatTime(entry.startMinutes)}`}</span>
                      </button>
                    )}
                  </div>

                  {/* Optional meetings do not take the time, but they are
                      competing for it, so they are shown inside it. */}
                  {entry.optionalEvents.map(event => (
                    <button
                      key={event.id}
                      type="button"
                      className={styles.FreeOptional}
                      onClick={() => event.meetingId && onEditMeeting?.(event.meetingId)}
                      disabled={!event.meetingId || !onEditMeeting}
                      style={{'--role-colour': event.role.colour} as React.CSSProperties}
                    >
                      <CircleDashed size={12} aria-hidden="true" className={styles.TagIcon} />
                      <TimeText>{formatTimeRange(event.startMinutes, event.endMinutes)}</TimeText>
                      <span className={styles.FreeOptionalTitle}>{event.title}</span>
                      <span className={styles.OptionalTag}>Optional</span>
                    </button>
                  ))}
                </div>
              )}

              {containsNow && (
                <span
                  className={styles.NowLine}
                  style={{'--now-offset': `${nowOffset}%`} as React.CSSProperties}
                  aria-hidden="true"
                >
                  <span className={styles.NowDot} />
                  <span className={styles.NowLabel}>{formatTime(now)}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {outside.length > 0 && (
        <>
          <p className={styles.OutsideNote}>Outside working hours</p>
          <ol className={styles.Timeline}>
            {outside.map(event => (
              <li key={event.id} className={styles.Row}>
                <span className={clsx(styles.Rail, styles.RailStrong)}>
                  {formatTime(event.startMinutes)}
                </span>
                <EventBlock event={event} current={false} onEdit={onEditMeeting} />
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
};

/**
 * Two or more events that collide, drawn side by side.
 *
 * Columns come from the availability calculation. Each block sizes to its own
 * content rather than to its share of the group's span: at four columns on a
 * real screen a thirty-minute block is shorter than the text inside it, and
 * proportional heights meant titles and role markers spilling out of the box.
 * The overlap is carried by the columns and the header's merged range, and
 * each block states its own times.
 */
const ClusterBlock = ({
  entry,
  now,
  onEdit,
}: {
  entry: Extract<TimelineEntry, {kind: 'cluster'}>;
  now: number | null;
  onEdit?: (meetingId: string) => void;
}) => {
  return (
    <div className={clsx(styles.Cluster, entry.clash && styles.ClusterClash)}>
      <p className={styles.ClusterHead}>
        {entry.clash ? (
          <>
            <TriangleAlert size={12} aria-hidden="true" className={styles.ClusterIcon} />
            <span className={styles.ClusterWord}>Clash</span>
          </>
        ) : (
          <span className={styles.ClusterWord}>Overlapping</span>
        )}
        <TimeText className={styles.ClusterRange}>
          {formatTimeRange(entry.startMinutes, entry.endMinutes)}
        </TimeText>
      </p>

      <div
        className={styles.ClusterGrid}
        style={{'--cluster-columns': entry.columns} as React.CSSProperties}
      >
        {entry.events.map(placed => (
          <div
            key={placed.event.id}
            className={styles.ClusterSlot}
            style={{'--cluster-column': placed.column + 1} as React.CSSProperties}
          >
            <EventBlock
              event={placed.event}
              current={
                now !== null && now >= placed.event.startMinutes && now < placed.event.endMinutes
              }
              onEdit={onEdit}
              compact
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const EventBlock = ({
  event,
  current,
  onEdit,
  compact = false,
}: {
  event: CalendarEvent;
  current: boolean;
  onEdit?: (meetingId: string) => void;
  /** Inside a cluster, where horizontal room is shared. */
  compact?: boolean;
}) => (
  <article
    className={clsx(
      styles.Event,
      event.source === 'family' && styles.Family,
      // Optional meetings recede: dashed edges and a flatter surface, never
      // colour alone, and never at the cost of the role marker.
      event.optional && styles.Optional,
      compact && styles.Compact,
      current && styles.Current
    )}
    style={event.role ? ({'--role-colour': event.role.colour} as React.CSSProperties) : undefined}
  >
    <div className={styles.EventTop}>
      <h3 className={styles.Title}>{event.title}</h3>
      {onEdit && event.meetingId && (
        <div className={styles.Actions}>
          <button
            type="button"
            className={styles.InlineAction}
            onClick={() => onEdit(event.meetingId as string)}
          >
            <Pencil size={12} aria-hidden="true" />
            Edit
            <span className="sr-only">{` ${event.title}`}</span>
          </button>
        </div>
      )}
    </div>

    <div className={styles.Meta}>
      <TimeText className={styles.Range}>
        {formatTimeRange(event.startMinutes, event.endMinutes)}
      </TimeText>
      <RoleBadge role={event.role} hollow={event.source === 'family'} />
      {event.optional && (
        <span className={styles.OptionalTag}>
          <CircleDashed className={styles.TagIcon} aria-hidden="true" />
          Optional
        </span>
      )}
      {event.recurring && !compact && (
        <span className={styles.Tag}>
          <Repeat className={styles.TagIcon} aria-hidden="true" />
          Repeats
        </span>
      )}
      {event.readOnly && (
        <span className={styles.Tag}>
          <Lock className={styles.TagIcon} aria-hidden="true" />
          Read-only
        </span>
      )}
      {event.notes && event.source === 'meeting' && !compact && (
        <span className={styles.Tag}>
          <NotebookPen className={styles.TagIcon} aria-hidden="true" />
          Notes
        </span>
      )}
    </div>

    {event.notes && event.source === 'family' && <p className={styles.Notes}>{event.notes}</p>}
  </article>
);
