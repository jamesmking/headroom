import {DateNav} from '@/components/date-nav';
import {Notice} from '@/components/form-message';
import {TimeText} from '@/components/time-text';
import {requireUser} from '@/features/auth/queries/get-current-user';
import {buildDaySummary} from '@/features/availability/availability';
import {WeekBoard} from '@/features/calendar/components/week-board';
import {getCalendarData, groupEventsByDate} from '@/features/calendar/queries/get-calendar';
import {getRoleOptions} from '@/features/roles/queries/get-roles';
import {getLastUsedRoleId} from '@/features/roles/last-used-role';
import {getSettings} from '@/features/settings/queries/get-settings';
import {
  type DateKey,
  addDays,
  describeWeek,
  formatDateRange,
  nowMinutes,
  startOfWeek,
  todayKey,
  weekKeys,
} from '@/lib/dates';
import {formatDuration} from '@/lib/time';
import {weekPath, weekPathTemplate} from '@/routes';
import styles from './week-view.module.scss';

/**
 * A week, whichever week it is. The mirror of `DayView`, sharing its date
 * navigation so moving through time works identically on both screens.
 */
export const WeekView = async ({anchor}: {anchor: DateKey}) => {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  const today = todayKey(settings.timeZone);
  const weekStart = startOfWeek(anchor);
  const dateKeys = weekKeys(weekStart);
  const thisWeekStart = startOfWeek(today);

  const workingHours = {
    startMinutes: settings.workdayStartMinutes,
    endMinutes: settings.workdayEndMinutes,
  };

  const [calendar, roles, lastRoleId] = await Promise.all([
    getCalendarData(user.id, dateKeys, settings.timeZone),
    getRoleOptions(user.id),
    getLastUsedRoleId(),
  ]);

  const eventsByDate = groupEventsByDate(calendar.events, dateKeys);

  // Weekdays only: a free Saturday is not capacity you are planning to use.
  // Days already gone are excluded too — time that has passed is not capacity
  // you can offer anyone, and counting it overstates the week every afternoon.
  const weekdayKeys = dateKeys.slice(0, 5);
  const totals = weekdayKeys.reduce(
    (accumulator, key) => {
      const summary = buildDaySummary(eventsByDate.get(key) ?? [], workingHours);
      return {
        free: accumulator.free + (key >= today ? summary.totalFreeMinutes : 0),
        busy: accumulator.busy + summary.totalBusyMinutes,
      };
    },
    {free: 0, busy: 0}
  );

  const hasPast = weekdayKeys.some(key => key < today);

  return (
    <div className={styles.Page}>
      <header>
        <span className={styles.Eyebrow}>{describeWeek(weekStart, today)}</span>
        <h1 className={styles.Heading}>{formatDateRange(weekStart, dateKeys[6])}</h1>
      </header>

      <DateNav
        label="Change week"
        selected={weekStart}
        today={today}
        previousHref={weekPath(addDays(weekStart, -7))}
        nextHref={weekPath(addDays(weekStart, 7))}
        previousLabel="Previous week"
        nextLabel="Next week"
        anchorHref={weekPath()}
        anchorLabel="This week"
        atAnchor={weekStart === thisWeekStart}
        hrefTemplate={weekPathTemplate}
      />

      <p className={styles.Totals}>
        <span>
          {hasPast ? 'Still free this week' : 'Free this week'} (Mon–Fri){' '}
          <TimeText className={styles.TotalValue}>{formatDuration(totals.free)}</TimeText>
        </span>
        <span>
          In meetings{' '}
          <TimeText className={styles.TotalValue}>{formatDuration(totals.busy)}</TimeText>
        </span>
      </p>

      {calendar.family.message && <Notice>{calendar.family.message}</Notice>}

      <WeekBoard
        title={describeWeek(weekStart, today)}
        dateKeys={dateKeys}
        eventsByDate={Object.fromEntries(eventsByDate)}
        meetings={calendar.meetings}
        roles={roles}
        defaultRoleId={lastRoleId}
        workingHours={workingHours}
        today={today}
        timeZone={settings.timeZone}
        initialMinutes={nowMinutes(settings.timeZone)}
      />
    </div>
  );
};
