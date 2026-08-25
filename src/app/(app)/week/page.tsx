import type {Metadata} from 'next';
import {requireUser} from '@/features/auth/queries/get-current-user';
import {WeekView} from '@/features/calendar/components/week-view';
import {getSettings} from '@/features/settings/queries/get-settings';
import {todayKey} from '@/lib/dates';

export const metadata: Metadata = {title: 'Week'};

export const dynamic = 'force-dynamic';

/** Like `/`, this always means "the week I am in", not a week frozen in a link. */
const WeekPage = async () => {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  return <WeekView anchor={todayKey(settings.timeZone)} />;
};

export default WeekPage;
