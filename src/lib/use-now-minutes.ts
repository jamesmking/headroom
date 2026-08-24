'use client';

import {useEffect, useState} from 'react';
import {nowMinutes} from '@/lib/dates';

/**
 * Current wall-clock minutes in the user's configured timezone, kept live so
 * the Today screen can be left open all day.
 *
 * The initial value comes from the server render, so the first paint matches
 * the server markup and hydration stays clean; the browser clock takes over on
 * the first effect.
 */
export const useNowMinutes = (timeZone: string, initialMinutes: number): number => {
  const [minutes, setMinutes] = useState(initialMinutes);

  useEffect(() => {
    const tick = () => setMinutes(nowMinutes(timeZone));
    tick();
    const interval = setInterval(tick, 15_000);
    return () => clearInterval(interval);
  }, [timeZone]);

  return minutes;
};
