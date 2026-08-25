import type {Metadata} from 'next';
import Link from 'next/link';
import {requireUser} from '@/features/auth/queries/get-current-user';
import {getRoleOptions} from '@/features/roles/queries/get-roles';
import {getSettings} from '@/features/settings/queries/get-settings';
import {RoleFilter} from '@/features/tasks/components/role-filter';
import {TaskList} from '@/features/tasks/components/task-list';
import {getLastUsedRoleId} from '@/features/roles/last-used-role';
import {getTasks} from '@/features/tasks/queries/get-tasks';
import {describeDayInSentence, formatLongDate, isDateKey, todayKey} from '@/lib/dates';
import {dayPath, tasksPath} from '@/routes';
import styles from './page.module.scss';

export const metadata: Metadata = {title: 'Tasks'};

export const dynamic = 'force-dynamic';

const TasksPage = async ({
  searchParams,
}: {
  searchParams: Promise<{role?: string; plan?: string}>;
}) => {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  const today = todayKey(settings.timeZone);

  const [roles, lastRoleId, {role, plan}] = await Promise.all([
    getRoleOptions(user.id),
    getLastUsedRoleId(),
    searchParams,
  ]);

  // Filtering only ever offers roles still in use.
  const activeRoles = roles.filter(entry => entry.active);
  // Ignore a role id that is not the user's, rather than showing nothing.
  const selectedRole = role && roles.some(entry => entry.id === role) ? role : null;

  // Arriving from another day's plan keeps the + controls pointed at that day,
  // so "pick tasks for tomorrow" actually picks them for tomorrow.
  const planDate = plan && isDateKey(plan) ? plan : today;
  const planningAhead = planDate !== today;

  const tasks = await getTasks(user.id, {roleId: selectedRole, planDate});

  const backlog = tasks.filter(task => task.status === 'BACKLOG');
  const todo = tasks.filter(task => task.status === 'TODO');
  const done = tasks.filter(task => task.status === 'DONE');

  const hrefFor = (roleId: string | null) => {
    const params = new URLSearchParams();
    if (roleId) params.set('role', roleId);
    if (planningAhead) params.set('plan', planDate);
    const query = params.toString();
    return query ? `${tasksPath()}?${query}` : tasksPath();
  };

  return (
    <div className={styles.Page}>
      <header className={styles.Masthead}>
        <div>
          <span className={styles.Eyebrow}>Tasks</span>
          <h1 className={styles.Heading}>Backlog</h1>
        </div>
      </header>

      {planningAhead ? (
        <p className={styles.Lede}>
          The <strong>+</strong> control is adding to <strong>{formatLongDate(planDate)}</strong>.{' '}
          <Link className={styles.PlanLink} href={dayPath(planDate)}>
            Back to {describeDayInSentence(planDate, today)} →
          </Link>
        </p>
      ) : (
        <p className={styles.Lede}>
          Use the <strong>+</strong> control on a task to put it on today&rsquo;s plan. A task does
          not need a due date to be something you work on today.
        </p>
      )}

      <RoleFilter roles={activeRoles} selected={selectedRole} hrefFor={hrefFor} />

      <div className={styles.Columns}>
        <TaskList
          title="Backlog"
          tasks={backlog}
          roles={roles}
          planDate={planDate}
          today={today}
          defaultRoleId={lastRoleId}
          addLabel="Add task"
          addDefaults={{status: 'BACKLOG'}}
          emptyMessage="The backlog is empty."
          emptyHint="Anything without a date lives here until you pick it up."
        />

        <TaskList
          title="To do"
          tasks={todo}
          roles={roles}
          planDate={planDate}
          today={today}
          emptyMessage="Nothing in progress."
          emptyHint="Move a task here when you start it."
        />

        <TaskList
          title="Done"
          tasks={done}
          roles={roles}
          planDate={planDate}
          today={today}
          showPlanControl={false}
          emptyMessage="Nothing finished yet."
        />
      </div>
    </div>
  );
};

export default TasksPage;
