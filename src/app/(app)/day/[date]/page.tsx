import type {Metadata} from 'next';
import {notFound, redirect} from 'next/navigation';
import {DayView} from '@/features/calendar/components/day-view';
import {requireUser} from '@/features/auth/queries/get-current-user';
import {getSettings} from '@/features/settings/queries/get-settings';
import {formatLongDate, isDateKey, todayKey} from '@/lib/dates';
import {todayPath} from '@/routes';

export const dynamic = 'force-dynamic';

type DayPageProps = {params: Promise<{date: string}>};

export const generateMetadata = async ({params}: DayPageProps): Promise<Metadata> => {
  const {date} = await params;
  return {title: isDateKey(date) ? formatLongDate(date) : 'Day'};
};

const DayPage = async ({params}: DayPageProps) => {
  const {date} = await params;
  if (!isDateKey(date)) notFound();

  const user = await requireUser();
  const settings = await getSettings(user.id);

  // Today has one canonical URL, so paging back to it from tomorrow lands on
  // home rather than on a second, dated copy of the same screen.
  if (date === todayKey(settings.timeZone)) redirect(todayPath());

  return <DayView date={date} />;
};

export default DayPage;
