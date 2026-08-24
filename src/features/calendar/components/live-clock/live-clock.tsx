'use client';

import {useNowMinutes} from '@/lib/use-now-minutes';
import {formatTime} from '@/lib/time';
import styles from './live-clock.module.scss';

export const LiveClock = ({
  timeZone,
  initialMinutes,
}: {
  timeZone: string;
  initialMinutes: number;
}) => {
  const minutes = useNowMinutes(timeZone, initialMinutes);

  return (
    <time className={styles.Clock} aria-label={`Current time ${formatTime(minutes)}`}>
      {formatTime(minutes)}
    </time>
  );
};
