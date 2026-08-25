import Link from 'next/link';
import {DateNav} from '@/components/date-nav';
import {Notice} from '@/components/form-message';
import {requireUser} from '@/features/auth/queries/get-current-user';
import {DayBoard} from '@/features/calendar/components/day-board';
import {DayShape} from '@/features/calendar/components/day-shape';
import {LiveClock} from '@/features/calendar/components/live-clock';
import {NowNext} from '@/features/calendar/components/now-next';
import {getCalendarData} from '@/features/calendar/queries/get-calendar';
import {getRoleOptions} from '@/features/roles/queries/get-roles';
import {getLastUsedRoleId} from '@/features/roles/last-used-role';
import {getSettings} from '@/features/settings/queries/get-settings';
import {CarryOver} from '@/features/tasks/components/carry-over';
import {TaskList} from '@/features/tasks/components/task-list';
import {getOverdueTasks, getPlannedTasks, getTasksDueOn} from '@/features/tasks/queries/get-tasks';
import {
  type DateKey,
  addDays,
  describeDay,
  describeDayInSentence,
  formatLongDate,
  nowMinutes,
  todayKey,
} from '@/lib/dates';
import {dayPath, dayPathTemplate, tasksPath, todayPath} from '@/routes';
import styles from './day-view.module.scss';

/**
 * One day, whichever day it is.
 *
 * Today is this component with `date` set to today, so the screen the user
 * already relies on and the screen for any other date cannot drift apart —
 * there is only one of them. What changes with the date is confined to three
 * things: the band at the top, whether the now-line is drawn, and the wording.
 */
export const DayView = async ({date}: {date: DateKey}) => {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  const today = todayKey(settings.timeZone);
  const isToday = date === today;
  const initialMinutes = nowMinutes(settings.timeZone);
  const workingHours = {
    startMinutes: settings.workdayStartMinutes,
    endMinutes: settings.workdayEndMinutes,
  };

  const [calendar, roles, lastRoleId, planned, dueOnDate, overdue] = await Promise.all([
    getCalendarData(user.id, [date], settings.timeZone),
    getRoleOptions(user.id),
    getLastUsedRoleId(),
    getPlannedTasks(user.id, date),
    getTasksDueOn(user.id, date),
    // "Overdue" is only meaningful from today or a day already gone. Listing
    // what will be overdue by next Tuesday is noise, not planning.
    date <= today ? getOverdueTasks(user.id, date) : Promise.resolve([]),
  ]);

  // A task already on the plan does not need repeating in the due list.
  const plannedIds = new Set(planned.map(task => task.id));
  const dueNotPlanned = [...overdue, ...dueOnDate].filter(task => !plannedIds.has(task.id));
  const unfinished = planned.filter(task => task.status !== 'DONE');

  return (
    <div className={styles.Page}>
      <header className={styles.Masthead}>
        <div>
          <span className={styles.Eyebrow}>{describeDay(date, today)}</span>
          <h1 className={styles.Date}>{formatLongDate(date)}</h1>
        </div>
        {isToday && (
          <div className={styles.ClockBlock}>
            <span className={styles.Eyebrow}>Now</span>
            <LiveClock timeZone={settings.timeZone} initialMinutes={initialMinutes} />
          </div>
        )}
      </header>

      <DateNav
        label="Change day"
        selected={date}
        today={today}
        previousHref={dayPath(addDays(date, -1))}
        nextHref={dayPath(addDays(date, 1))}
        previousLabel="Previous day"
        nextLabel="Next day"
        anchorHref={todayPath()}
        anchorLabel="Today"
        atAnchor={isToday}
        hrefTemplate={dayPathTemplate}
      />

      {isToday ? (
        <NowNext
          events={calendar.events}
          workingHours={workingHours}
          timeZone={settings.timeZone}
          initialMinutes={initialMinutes}
        />
      ) : (
        <DayShape date={date} today={today} events={calendar.events} workingHours={workingHours} />
      )}

      {calendar.family.message && <Notice>{calendar.family.message}</Notice>}

      <div className={styles.Columns}>
        <DayBoard
          title={isToday ? "Today's timeline" : 'Timeline'}
          date={date}
          isToday={isToday}
          events={calendar.events}
          meetings={calendar.meetings}
          roles={roles}
          defaultRoleId={lastRoleId}
          workingHours={workingHours}
          timeZone={settings.timeZone}
          initialMinutes={initialMinutes}
        />

        <div className={styles.Side}>
          <TaskList
            title={isToday ? "Today's work" : 'Planned work'}
            tasks={planned}
            roles={roles}
            defaultRoleId={lastRoleId}
            planDate={date}
            today={today}
            addLabel="Add task"
            addDefaults={{status: 'TODO'}}
            addToPlanOnCreate
            emptyMessage={
              isToday ? 'Nothing picked for today yet.' : 'Nothing picked for this day yet.'
            }
            emptyHint="Choose a few things from the backlog to focus on."
            footer={
              <div className={styles.Carry}>
                <Link className={styles.BacklogLink} href={tasksPath(date)}>
                  Pick tasks from the backlog →
                </Link>
                {unfinished.length > 0 && date >= today && (
                  <CarryOver
                    from={date}
                    to={addDays(date, 1)}
                    count={unfinished.length}
                    toLabel={describeDayInSentence(addDays(date, 1), today)}
                  />
                )}
              </div>
            }
          />

          <TaskList
            title={isToday ? 'Due today' : 'Due'}
            tasks={dueNotPlanned}
            roles={roles}
            defaultRoleId={lastRoleId}
            planDate={date}
            today={today}
            emptyMessage={isToday ? 'Nothing is due today.' : 'Nothing is due on this day.'}
            emptyHint="Deadlines you set on tasks show up here."
          />
        </div>
      </div>
    </div>
  );
};
