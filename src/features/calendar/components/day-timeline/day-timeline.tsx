'use client';

import clsx from 'clsx';
import {Lock, NotebookPen, Pencil, Plus, Repeat} from 'lucide-react';
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
  return entry.kind === 'event'
    ? Math.min(MAX_EVENT_HEIGHT, Math.max(MIN_EVENT_HEIGHT, raw))
    : Math.min(MAX_FREE_HEIGHT, Math.max(MIN_FREE_HEIGHT, raw));
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
          {allDay.map(event => (
            <span key={event.id} className={styles.AllDayEvent}>
              <RoleBadge role={null} hollow fallbackLabel="All day" />
              {event.title}
            </span>
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
              <span className={clsx(styles.Rail, entry.kind === 'event' && styles.RailStrong)}>
                {formatTime(entry.startMinutes)}
              </span>

              {entry.kind === 'event' ? (
                <EventBlock event={entry.event} current={containsNow} onEdit={onEditMeeting} />
              ) : (
                <div className={styles.Free}>
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

const EventBlock = ({
  event,
  current,
  onEdit,
}: {
  event: CalendarEvent;
  current: boolean;
  onEdit?: (meetingId: string) => void;
}) => (
  <article
    className={clsx(
      styles.Event,
      event.source === 'family' && styles.Family,
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
      <RoleBadge
        role={event.role}
        hollow={event.source === 'family'}
        fallbackLabel={event.source === 'family' ? 'Family' : 'No role'}
      />
      {event.recurring && (
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
      {event.notes && event.source === 'meeting' && (
        <span className={styles.Tag}>
          <NotebookPen className={styles.TagIcon} aria-hidden="true" />
          Notes
        </span>
      )}
    </div>

    {event.notes && event.source === 'family' && <p className={styles.Notes}>{event.notes}</p>}
  </article>
);
