import type {Metadata} from 'next';
import Link from 'next/link';
import {Notice} from '@/components/form-message';
import {LiveClock} from '@/features/calendar/components/live-clock';
import {DayBoard} from '@/features/calendar/components/day-board';
import {NowNext} from '@/features/calendar/components/now-next';
import {getCalendarData} from '@/features/calendar/queries/get-calendar';
import {requireUser} from '@/features/auth/queries/get-current-user';
import {getMeeting} from '@/features/meetings/queries/get-meetings';
import {getActiveRoles} from '@/features/roles/queries/get-roles';
import {getSettings} from '@/features/settings/queries/get-settings';
import {TaskList} from '@/features/tasks/components/task-list';
import {getOverdueTasks, getPlannedTasks, getTasksDueOn} from '@/features/tasks/queries/get-tasks';
import {formatLongDate, nowMinutes, todayKey} from '@/lib/dates';
import {tasksPath} from '@/routes';
import styles from './page.module.scss';

export const metadata: Metadata = {title: 'Today'};

// The screen is a live view of the current moment; never serve it from a cache.
export const dynamic = 'force-dynamic';

const TodayPage = async () => {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  const today = todayKey(settings.timeZone);
  const initialMinutes = nowMinutes(settings.timeZone);
  const workingHours = {
    startMinutes: settings.workdayStartMinutes,
    endMinutes: settings.workdayEndMinutes,
  };

  const [calendar, roles, planned, dueToday, overdue] = await Promise.all([
    getCalendarData(user.id, [today], settings.timeZone),
    getActiveRoles(user.id),
    getPlannedTasks(user.id, today),
    getTasksDueOn(user.id, today),
    getOverdueTasks(user.id, today),
  ]);

  // Editable records for the meetings that appear today, so the inline editor
  // can open without another round trip.
  const meetingIds = [
    ...new Set(calendar.events.map(event => event.meetingId).filter(Boolean)),
  ] as string[];
  const meetings = (await Promise.all(meetingIds.map(id => getMeeting(user.id, id)))).filter(
    meeting => meeting !== null
  );

  // A task already on the plan does not need repeating in the due-today list.
  const plannedIds = new Set(planned.map(task => task.id));
  const dueNotPlanned = [...overdue, ...dueToday].filter(task => !plannedIds.has(task.id));

  return (
    <div className={styles.Page}>
      <header className={styles.Masthead}>
        <div>
          <span className={styles.Eyebrow}>Today</span>
          <h1 className={styles.Date}>{formatLongDate(today)}</h1>
        </div>
        <div className={styles.ClockBlock}>
          <span className={styles.Eyebrow}>Now</span>
          <LiveClock timeZone={settings.timeZone} initialMinutes={initialMinutes} />
        </div>
      </header>

      <NowNext
        events={calendar.events}
        workingHours={workingHours}
        timeZone={settings.timeZone}
        initialMinutes={initialMinutes}
      />

      {calendar.family.message && <Notice>{calendar.family.message}</Notice>}

      <div className={styles.Columns}>
        <DayBoard
          title="Today's timeline"
          date={today}
          events={calendar.events}
          meetings={meetings}
          roles={roles}
          workingHours={workingHours}
          timeZone={settings.timeZone}
          initialMinutes={initialMinutes}
          showNow
        />

        <div className={styles.Side}>
          <TaskList
            title="Today's work"
            tasks={planned}
            roles={roles}
            planDate={today}
            today={today}
            addLabel="Add task"
            addDefaults={{status: 'TODO'}}
            addToPlanOnCreate
            emptyMessage="Nothing picked for today yet."
            emptyHint="Choose a few things from the backlog to focus on."
            footer={
              <Link className={styles.BacklogLink} href={tasksPath()}>
                Pick tasks from the backlog →
              </Link>
            }
          />

          <TaskList
            title="Due today"
            tasks={dueNotPlanned}
            roles={roles}
            planDate={today}
            today={today}
            emptyMessage="Nothing is due today."
            emptyHint="Deadlines you set on tasks show up here."
          />
        </div>
      </div>
    </div>
  );
};

export default TodayPage;
