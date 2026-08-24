'use client';

import clsx from 'clsx';
import {RoleBadge} from '@/components/role-badge';
import {TimeText} from '@/components/time-text';
import {findNextUp} from '@/features/availability/availability';
import type {CalendarEvent, WorkingHours} from '@/features/calendar/types';
import {useNowMinutes} from '@/lib/use-now-minutes';
import {formatCountdown, formatDuration, formatTime, formatTimeRange} from '@/lib/time';
import styles from './now-next.module.scss';

type NowNextProps = {
  events: CalendarEvent[];
  workingHours: WorkingHours;
  timeZone: string;
  initialMinutes: number;
};

/**
 * The answer to "how much room have I got, and what's coming?" — the first
 * thing the eye should land on when glancing at the screen.
 */
export const NowNext = ({events, workingHours, timeZone, initialMinutes}: NowNextProps) => {
  const now = useNowMinutes(timeZone, initialMinutes);
  const {next, minutesUntilNext, current, minutesUntilCurrentEnds, freeRightNowMinutes} =
    findNextUp(events, now, workingHours);

  const beforeWork = now < workingHours.startMinutes;
  const afterWork = now >= workingHours.endMinutes;

  return (
    <section className={clsx(styles.Status, current && styles.InMeeting)} aria-label="Right now">
      <div className={styles.Headline}>
        {current ? (
          <>
            <span className={styles.Label}>In a meeting</span>
            <TimeText className={styles.Figure}>
              {formatDuration(minutesUntilCurrentEnds ?? 0)} left
            </TimeText>
            <p className={styles.Detail}>
              <span className={styles.Strong}>{current.title}</span> until{' '}
              <TimeText>{formatTime(current.endMinutes)}</TimeText>
            </p>
          </>
        ) : freeRightNowMinutes !== null ? (
          <>
            <span className={styles.Label}>Free right now</span>
            <TimeText className={styles.Figure}>{formatDuration(freeRightNowMinutes)}</TimeText>
            <p className={styles.Detail}>
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
            </p>
          </>
        ) : (
          <>
            <span className={styles.Label}>
              {beforeWork ? 'Before your working day' : 'Outside your working day'}
            </span>
            <TimeText className={styles.Figure}>
              {beforeWork
                ? formatTime(workingHours.startMinutes)
                : formatTime(workingHours.endMinutes)}
            </TimeText>
            <p className={styles.Detail}>
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
        )}
      </div>

      <div className={styles.Next}>
        <span className={styles.Label}>Next meeting</span>
        {next ? (
          <>
            <p className={styles.NextTitle}>{next.title}</p>
            <div className={styles.NextMeta}>
              <TimeText>{formatTimeRange(next.startMinutes, next.endMinutes)}</TimeText>
              <RoleBadge
                role={next.role}
                hollow={next.source === 'family'}
                fallbackLabel={next.source === 'family' ? 'Family' : 'No role'}
              />
            </div>
            <p className={styles.Detail}>
              Starts{' '}
              <span className={styles.Countdown}>{formatCountdown(minutesUntilNext ?? 0)}</span>
            </p>
          </>
        ) : (
          <p className={styles.Done}>Nothing else in the diary today.</p>
        )}
      </div>
    </section>
  );
};
