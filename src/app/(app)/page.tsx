import type {Metadata} from 'next';
import {DayView} from '@/features/calendar/components/day-view';
import {requireUser} from '@/features/auth/queries/get-current-user';
import {getSettings} from '@/features/settings/queries/get-settings';
import {todayKey} from '@/lib/dates';

export const metadata: Metadata = {title: 'Today'};

// The screen is a live view of the current moment; never serve it from a cache.
export const dynamic = 'force-dynamic';

/**
 * Home is always the day you are actually in. Keeping it on `/` rather than
 * redirecting to a dated URL means a bookmark of the app opens today, forever,
 * rather than opening the day it was bookmarked on.
 */
const TodayPage = async () => {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  return <DayView date={todayKey(settings.timeZone)} />;
};

export default TodayPage;
