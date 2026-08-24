import 'server-only';

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

/** Settings for display. Never includes the iCal URL. */
export const getSettings = async (userId: string): Promise<UserSettingsView> => {
  const settings = await prisma.userSettings.findUnique({where: {userId}});

  return {
    workdayStartMinutes: settings?.workdayStartMinutes ?? DEFAULTS.workdayStartMinutes,
    workdayEndMinutes: settings?.workdayEndMinutes ?? DEFAULTS.workdayEndMinutes,
    timeZone: settings?.timeZone ?? DEFAULTS.timeZone,
    familyCalendarEnabled: Boolean(settings?.icalEnabled && settings.icalUrl),
    hasIcalUrl: Boolean(settings?.icalUrl),
    icalHost: hostOf(settings?.icalUrl ?? null),
  };
};

/**
 * Server-only accessor for the iCal feed URL. Used exclusively by the family
 * calendar fetcher; the value must never cross into a client payload.
 */
export const getIcalUrl = async (userId: string): Promise<string | null> => {
  const settings = await prisma.userSettings.findUnique({
    where: {userId},
    select: {icalUrl: true, icalEnabled: true},
  });
  if (!settings?.icalEnabled) return null;
  return settings.icalUrl ?? null;
};
