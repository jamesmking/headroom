import 'server-only';

import {cache} from 'react';
import {prisma} from '@/lib/prisma';

export type UserSettingsView = {
  workdayStartMinutes: number;
  workdayEndMinutes: number;
  timeZone: string;
  /** Whether a family calendar feed is configured and switched on. */
  familyCalendarEnabled: boolean;
  /**
   * Whether a URL is stored at all. The URL itself is deliberately absent from
   * this type so it can never be handed to a Client Component by accident.
   */
  hasIcalUrl: boolean;
  /** Host only, e.g. 'calendar.google.com', for confirming what is configured. */
  icalHost: string | null;
};

const DEFAULTS = {
  workdayStartMinutes: 540,
  workdayEndMinutes: 1050,
  timeZone: 'Europe/London',
};

const hostOf = (url: string | null): string | null => {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
};

/**
 * Settings for display. Never includes the iCal URL.
 *
 * Memoised for the lifetime of one request. A Day render asks for settings
 * three times over — the route needs the timezone to work out which day it is,
 * the view needs the working hours, and the calendar needs the feed URL — and
 * without this each one is a separate round trip to the database.
 */
export const getSettings = cache(async (userId: string): Promise<UserSettingsView> => {
  const settings = await prisma.userSettings.findUnique({where: {userId}});

  return {
    workdayStartMinutes: settings?.workdayStartMinutes ?? DEFAULTS.workdayStartMinutes,
    workdayEndMinutes: settings?.workdayEndMinutes ?? DEFAULTS.workdayEndMinutes,
    timeZone: settings?.timeZone ?? DEFAULTS.timeZone,
    familyCalendarEnabled: Boolean(settings?.icalEnabled && settings.icalUrl),
    hasIcalUrl: Boolean(settings?.icalUrl),
    icalHost: hostOf(settings?.icalUrl ?? null),
  };
});
