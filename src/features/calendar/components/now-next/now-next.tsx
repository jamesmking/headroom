'use client';

import {CircleDashed, TriangleAlert} from 'lucide-react';
import {StatusBand, bandStyles as band} from '@/components/status-band';
import {RoleBadge} from '@/components/role-badge';
import {TimeText} from '@/components/time-text';
import {findNextUp} from '@/features/availability/availability';
import type {CalendarEvent, WorkingHours} from '@/features/calendar/types';
import {useNowMinutes} from '@/lib/use-now-minutes';
import {formatCountdown, formatDuration, formatTime, formatTimeRange} from '@/lib/time';

type NowNextProps = {
  events: CalendarEvent[];
  workingHours: WorkingHours;
  timeZone: string;
  initialMinutes: number;
};

/**
 * The answer to "how much room have I got, and what's coming?" — the first
 * thing the eye should land on when glancing at the screen.
 *
 * Today only. Any other day shows `DayShape` in the same band instead, because
 * "now" is not a question you can ask of Thursday.
 */
export const NowNext = ({events, workingHours, timeZone, initialMinutes}: NowNextProps) => {
  const now = useNowMinutes(timeZone, initialMinutes);
  const {
    next,
    minutesUntilNext,
    nextOptional,
    minutesUntilNextOptional,
    current,
    minutesUntilCurrentEnds,
    alsoNow,
    currentOptional,
    freeRightNowMinutes,
  } = findNextUp(events, now, workingHours);

  const beforeWork = now < workingHours.startMinutes;
  const afterWork = now >= workingHours.endMinutes;

  return (
    <StatusBand
      label="Right now"
      alert={Boolean(current)}
      leading={
        current ? (
          <>
            <span className={band.Label}>In a meeting</span>
            <TimeText className={band.Figure}>
              {formatDuration(minutesUntilCurrentEnds ?? 0)} left
            </TimeText>
            <p className={band.Detail}>
              <span className={band.Strong}>{current.title}</span> until{' '}
              <TimeText>{formatTime(current.endMinutes)}</TimeText>
            </p>
            {/* Two calendars can both book you; this is the only place that
                knows about it, so it is the only place that can say so. */}
            {alsoNow.length > 0 && (
              <p className={band.Detail}>
                <TriangleAlert size={13} aria-hidden="true" className={band.WarnIcon} />
                Also now: {alsoNow.map(event => event.title).join(', ')}
              </p>
            )}
          </>
        ) : freeRightNowMinutes !== null ? (
          <>
            <span className={band.Label}>
              {currentOptional ? 'Free — optional meeting on' : 'Free right now'}
            </span>
            <TimeText className={band.Figure}>{formatDuration(freeRightNowMinutes)}</TimeText>
            <p className={band.Detail}>
              {next ? (
                <>
                  Clear until <TimeText>{formatTime(next.startMinutes)}</TimeText>
                </>
              ) : (
                <>
                  Nothing else booked before{' '}
                  <TimeText>{formatTime(workingHours.endMinutes)}</TimeText>
                </>
              )}
              {currentOptional ? (
                <>
                  {' · '}
                  <span className={band.Strong}>{currentOptional.title}</span> is on until{' '}
                  <TimeText>{formatTime(currentOptional.endMinutes)}</TimeText> if you want it
                </>
              ) : (
                nextOptional && (
                  <>
                    {' · optional '}
                    <span className={band.Strong}>{nextOptional.title}</span> at{' '}
                    <TimeText>{formatTime(nextOptional.startMinutes)}</TimeText>
                  </>
                )
              )}
            </p>
          </>
        ) : (
          <>
            <span className={band.Label}>
              {beforeWork ? 'Before your working day' : 'Outside your working day'}
            </span>
            <TimeText className={band.Figure}>
              {beforeWork
                ? formatTime(workingHours.startMinutes)
                : formatTime(workingHours.endMinutes)}
            </TimeText>
            <p className={band.Detail}>
              {beforeWork ? (
                <>
                  Your day starts at <TimeText>{formatTime(workingHours.startMinutes)}</TimeText>.
                </>
              ) : afterWork ? (
                <>
                  Your day finished at <TimeText>{formatTime(workingHours.endMinutes)}</TimeText>.
                </>
              ) : null}
            </p>
          </>
        )
      }
      trailing={
        <>
          <span className={band.Label}>Next meeting</span>
          {next ? (
            <>
              <p className={band.Title}>{next.title}</p>
              <div className={band.Meta}>
                <TimeText>{formatTimeRange(next.startMinutes, next.endMinutes)}</TimeText>
                <RoleBadge role={next.role} hollow={next.source === 'family'} />
              </div>
              <p className={band.Detail}>
                Starts <span className={band.Accent}>{formatCountdown(minutesUntilNext ?? 0)}</span>
              </p>
            </>
          ) : (
            <p className={band.Quiet}>Nothing else in the diary today.</p>
          )}

          {/* Shown beneath, never instead: an optional meeting must not be
              mistaken for the thing that actually constrains the day. */}
          {nextOptional && (
            <p className={band.Detail}>
              <CircleDashed size={13} aria-hidden="true" className={band.WarnIcon} />
              Optional: {nextOptional.title}{' '}
              <span className={band.Accent}>{formatCountdown(minutesUntilNextOptional ?? 0)}</span>
            </p>
          )}
        </>
      }
    />
  );
};
