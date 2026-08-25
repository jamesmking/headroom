import type {Metadata} from 'next';
import {notFound, redirect} from 'next/navigation';
import {requireUser} from '@/features/auth/queries/get-current-user';
import {WeekView} from '@/features/calendar/components/week-view';
import {getSettings} from '@/features/settings/queries/get-settings';
import {formatShortDate, isDateKey, startOfWeek, todayKey} from '@/lib/dates';
import {weekPath} from '@/routes';

export const dynamic = 'force-dynamic';

type WeekDatePageProps = {params: Promise<{date: string}>};

export const generateMetadata = async ({params}: WeekDatePageProps): Promise<Metadata> => {
  const {date} = await params;
  return {title: isDateKey(date) ? `Week of ${formatShortDate(startOfWeek(date))}` : 'Week'};
};

const WeekDatePage = async ({params}: WeekDatePageProps) => {
  const {date} = await params;
  if (!isDateKey(date)) notFound();

  const user = await requireUser();
  const settings = await getSettings(user.id);

  // The current week has one canonical URL, matching how Today keeps '/'.
  if (startOfWeek(date) === startOfWeek(todayKey(settings.timeZone))) redirect(weekPath());

  return <WeekView anchor={date} />;
};

export default WeekDatePage;
