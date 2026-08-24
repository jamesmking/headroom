import clsx from 'clsx';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import Link from 'next/link';
import {Panel} from '@/components/panel';
import {TimeText} from '@/components/time-text';
import {buildDaySummary} from '@/features/availability/availability';
import type {CalendarEvent, WorkingHours} from '@/features/calendar/types';
import {type DateKey, addDays, fromDateKey, isWeekend} from '@/lib/dates';
import {formatDuration, formatTime} from '@/lib/time';
import {weekPath} from '@/routes';
import styles from './week-grid.module.scss';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type WeekGridProps = {
  weekStart: DateKey;
  dateKeys: DateKey[];
  eventsByDate: Map<DateKey, CalendarEvent[]>;
  workingHours: WorkingHours;
  today: DateKey;
  title: string;
};

/**
 * The week at a glance. Deliberately a summary rather than an hour grid: the
 * question it answers is "which days have room in them", not "what is happening
 * at 14:15 on Thursday" — that is the Today screen's job.
 */
export const WeekGrid = ({
  weekStart,
  dateKeys,
  eventsByDate,
  workingHours,
  today,
  title,
}: WeekGridProps) => (
  <Panel
    title={title}
    flush
    actions={
      <nav className={styles.Nav} aria-label="Change week">
        <Link className={styles.NavLink} href={`${weekPath()}?week=${addDays(weekStart, -7)}`}>
          <ChevronLeft size={13} aria-hidden="true" />
          Previous
        </Link>
        <Link className={styles.NavLink} href={weekPath()}>
          This week
        </Link>
        <Link className={styles.NavLink} href={`${weekPath()}?week=${addDays(weekStart, 7)}`}>
          Next
          <ChevronRight size={13} aria-hidden="true" />
        </Link>
      </nav>
    }
  >
    <div className={styles.Grid}>
      {dateKeys.map((key, index) => {
        const events = eventsByDate.get(key) ?? [];
        const timed = events.filter(event => !event.allDay);
        const allDay = events.filter(event => event.allDay);
        const summary = buildDaySummary(events, workingHours);
        const isToday = key === today;

        return (
          <div
            key={key}
            className={clsx(styles.Day, isWeekend(key) && styles.Weekend, isToday && styles.Today)}
          >
            <div className={styles.DayHead}>
              <span className={styles.DayName}>
                {WEEKDAYS[index]}
                {isToday && <span className={styles.TodayMarker}> · today</span>}
              </span>
              <span className={styles.DayNumber}>{fromDateKey(key).getUTCDate()}</span>
            </div>

            <div className={styles.Events}>
              {allDay.map(event => (
                <p key={event.id} className={styles.AllDay}>
                  {event.title}
                </p>
              ))}

              {timed.length === 0 && allDay.length === 0 ? (
                <p className={styles.Quiet}>Clear</p>
              ) : (
                timed.map(event => (
                  <article
                    key={event.id}
                    className={clsx(styles.Event, event.source === 'family' && styles.Family)}
                    style={
                      event.role
                        ? ({'--role-colour': event.role.colour} as React.CSSProperties)
                        : undefined
                    }
                  >
                    <span className={styles.EventTime}>{formatTime(event.startMinutes)}</span>
                    <span className={styles.EventTitle}>{event.title}</span>
                  </article>
                ))
              )}
            </div>

            <p className={styles.DayFoot}>
              <TimeText className={styles.FootValue}>
                {formatDuration(summary.totalFreeMinutes)}
              </TimeText>{' '}
              free
            </p>
          </div>
        );
      })}
    </div>
  </Panel>
);
