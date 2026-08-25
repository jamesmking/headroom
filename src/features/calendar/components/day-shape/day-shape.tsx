import {StatusBand, bandStyles as band} from '@/components/status-band';
import {RoleBadge} from '@/components/role-badge';
import {TimeText} from '@/components/time-text';
import {buildDaySummary} from '@/features/availability/availability';
import type {CalendarEvent, WorkingHours} from '@/features/calendar/types';
import {type DateKey, describeDay} from '@/lib/dates';
import {formatDuration, formatTime, formatTimeRange} from '@/lib/time';

type DayShapeProps = {
  date: DateKey;
  today: DateKey;
  events: CalendarEvent[];
  workingHours: WorkingHours;
};

/**
 * What Today's `NowNext` band becomes on any other date.
 *
 * A day you are not standing in has no "now" and no countdown, so the same
 * space answers the question you actually have about it: how much of it is
 * still yours, and when does it start for real.
 */
export const DayShape = ({date, today, events, workingHours}: DayShapeProps) => {
  const summary = buildDaySummary(events, workingHours);
  const timed = events.filter(event => !event.allDay);
  const first = timed[0] ?? null;
  const past = date < today;

  const longest = summary.freePeriods.reduce<(typeof summary.freePeriods)[number] | null>(
    (best, period) => (best && best.durationMinutes >= period.durationMinutes ? best : period),
    null
  );

  const workingMinutes = Math.max(0, workingHours.endMinutes - workingHours.startMinutes);

  return (
    <StatusBand
      label={`${describeDay(date, today)} at a glance`}
      leading={
        <>
          <span className={band.Label}>{past ? 'Was free' : 'Free'}</span>
          <TimeText className={band.Figure}>{formatDuration(summary.totalFreeMinutes)}</TimeText>
          <p className={band.Detail}>
            {summary.totalBusyMinutes > 0 ? (
              <>
                <TimeText className={band.Strong}>
                  {formatDuration(summary.totalBusyMinutes)}
                </TimeText>{' '}
                booked out of a <TimeText>{formatDuration(workingMinutes)}</TimeText> working day.
              </>
            ) : (
              <>
                Nothing booked at all — the whole{' '}
                <TimeText>{formatDuration(workingMinutes)}</TimeText> is yours.
              </>
            )}
          </p>
        </>
      }
      trailing={
        first ? (
          <>
            <span className={band.Label}>{past ? 'Started with' : 'First up'}</span>
            <p className={band.Title}>{first.title}</p>
            <div className={band.Meta}>
              <TimeText>{formatTimeRange(first.startMinutes, first.endMinutes)}</TimeText>
              <RoleBadge role={first.role} hollow={first.source === 'family'} />
            </div>
            {longest && (
              <p className={band.Detail}>
                Longest clear stretch{' '}
                <span className={band.Accent}>{formatDuration(longest.durationMinutes)}</span> from{' '}
                <TimeText>{formatTime(longest.startMinutes)}</TimeText>
              </p>
            )}
          </>
        ) : (
          <>
            <span className={band.Label}>{past ? 'Started with' : 'First up'}</span>
            <p className={band.Quiet}>
              {past ? 'Nothing was in the diary.' : 'Nothing in the diary yet.'}
            </p>
          </>
        )
      }
    />
  );
};
