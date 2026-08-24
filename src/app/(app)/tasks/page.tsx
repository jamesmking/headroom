import type {Metadata} from 'next';
import {requireUser} from '@/features/auth/queries/get-current-user';
import {getActiveRoles} from '@/features/roles/queries/get-roles';
import {getSettings} from '@/features/settings/queries/get-settings';
import {RoleFilter} from '@/features/tasks/components/role-filter';
import {TaskList} from '@/features/tasks/components/task-list';
import {getTasks} from '@/features/tasks/queries/get-tasks';
import {todayKey} from '@/lib/dates';
import {tasksPath} from '@/routes';
import styles from './page.module.scss';

export const metadata: Metadata = {title: 'Tasks'};

export const dynamic = 'force-dynamic';

const TasksPage = async ({searchParams}: {searchParams: Promise<{role?: string}>}) => {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  const today = todayKey(settings.timeZone);

  const roles = await getActiveRoles(user.id);
  const {role} = await searchParams;
  // Ignore a role id that is not the user's, rather than showing nothing.
  const selectedRole = role && roles.some(entry => entry.id === role) ? role : null;

  const tasks = await getTasks(user.id, {roleId: selectedRole, planDate: today});

  const backlog = tasks.filter(task => task.status === 'BACKLOG');
  const todo = tasks.filter(task => task.status === 'TODO');
  const done = tasks.filter(task => task.status === 'DONE');

  const hrefFor = (roleId: string | null) =>
    roleId ? `${tasksPath()}?role=${roleId}` : tasksPath();

  return (
    <div className={styles.Page}>
      <header className={styles.Masthead}>
        <div>
          <span className={styles.Eyebrow}>Tasks</span>
          <h1 className={styles.Heading}>Backlog</h1>
        </div>
      </header>

      <p className={styles.Lede}>
        Use the <strong>+</strong> control on a task to put it on today&rsquo;s plan. A task does
        not need a due date to be something you work on today.
      </p>

      <RoleFilter roles={roles} selected={selectedRole} hrefFor={hrefFor} />

      <div className={styles.Columns}>
        <TaskList
          title="Backlog"
          tasks={backlog}
          roles={roles}
          planDate={today}
          today={today}
          addLabel="Add task"
          addDefaults={{status: 'BACKLOG'}}
          emptyMessage="The backlog is empty."
          emptyHint="Anything without a date lives here until you pick it up."
        />

        <TaskList
          title="To do"
          tasks={todo}
          roles={roles}
          planDate={today}
          today={today}
          emptyMessage="Nothing in progress."
          emptyHint="Move a task here when you start it."
        />

        <TaskList
          title="Done"
          tasks={done}
          roles={roles}
          planDate={today}
          today={today}
          showPlanControl={false}
          emptyMessage="Nothing finished yet."
        />
      </div>
    </div>
  );
};

export default TasksPage;
