import type {Metadata} from 'next';
import {Notice} from '@/components/form-message';
import {TimeText} from '@/components/time-text';
import {requireUser} from '@/features/auth/queries/get-current-user';
import {buildDaySummary} from '@/features/availability/availability';
import {WeekGrid} from '@/features/calendar/components/week-grid';
import {getCalendarData, groupEventsByDate} from '@/features/calendar/queries/get-calendar';
import {getSettings} from '@/features/settings/queries/get-settings';
import {formatShortDate, isDateKey, startOfWeek, todayKey, weekKeys} from '@/lib/dates';
import {formatDuration} from '@/lib/time';
import styles from './page.module.scss';

export const metadata: Metadata = {title: 'Week'};

export const dynamic = 'force-dynamic';

const WeekPage = async ({searchParams}: {searchParams: Promise<{week?: string}>}) => {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  const today = todayKey(settings.timeZone);
  const {week} = await searchParams;
  const anchor = week && isDateKey(week) ? week : today;
  const weekStart = startOfWeek(anchor);
  const dateKeys = weekKeys(weekStart);

  const workingHours = {
    startMinutes: settings.workdayStartMinutes,
    endMinutes: settings.workdayEndMinutes,
  };

  const calendar = await getCalendarData(user.id, dateKeys, settings.timeZone);
  const eventsByDate = groupEventsByDate(calendar.events, dateKeys);

  // Weekdays only: a free Saturday is not capacity you are planning to use.
  const weekdayKeys = dateKeys.slice(0, 5);
  const totals = weekdayKeys.reduce(
    (accumulator, key) => {
      const summary = buildDaySummary(eventsByDate.get(key) ?? [], workingHours);
      return {
        free: accumulator.free + summary.totalFreeMinutes,
        busy: accumulator.busy + summary.totalBusyMinutes,
      };
    },
    {free: 0, busy: 0}
  );

  return (
    <div className={styles.Page}>
      <header>
        <span className={styles.Eyebrow}>Week</span>
        <h1 className={styles.Heading}>
          {formatShortDate(weekStart)} – {formatShortDate(dateKeys[6])}
        </h1>
      </header>

      <p className={styles.Totals}>
        <span>
          Free this week (Mon–Fri){' '}
          <TimeText className={styles.TotalValue}>{formatDuration(totals.free)}</TimeText>
        </span>
        <span>
          In meetings{' '}
          <TimeText className={styles.TotalValue}>{formatDuration(totals.busy)}</TimeText>
        </span>
      </p>

      {calendar.family.message && <Notice>{calendar.family.message}</Notice>}

      <WeekGrid
        title="This week"
        weekStart={weekStart}
        dateKeys={dateKeys}
        eventsByDate={eventsByDate}
        workingHours={workingHours}
        today={today}
      />
    </div>
  );
};

export default WeekPage;
