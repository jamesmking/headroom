'use client';

import clsx from 'clsx';
import {ExternalLink, Minus, Pencil, Plus} from 'lucide-react';
import {useOptimistic} from 'react';
import {
  addTaskToPlan,
  moveTaskStatus,
  removeTaskFromPlan,
} from '@/features/tasks/actions/quick-actions';
import {RoleBadge} from '@/components/role-badge';
import {TASK_STATUSES, type TaskStatus, type TaskView} from '@/features/tasks/types';
import {type DateKey, describeDueDate} from '@/lib/dates';
import styles from './task-row.module.scss';

type TaskRowProps = {
  task: TaskView;
  /** The day the plan controls act on. */
  planDate: DateKey;
  today: DateKey;
  /** Hide the add/remove control where it would be meaningless. */
  showPlanControl?: boolean;
  onEdit?: (taskId: string) => void;
};

/**
 * A single task line.
 *
 * Every control is still a real form posting a plain server action, so a change
 * can only ever happen because a button was pressed — there is no dispatch to
 * replay and no change handler that could fire without intent.
 *
 * These two are the most-pressed controls in the application, and a round trip
 * to a serverless function and back is long enough to feel like nothing
 * happened. So they move first and reconcile after: `useOptimistic` shows the
 * new state immediately, and React discards it in favour of the server's answer
 * when the action settles — including when it fails, which shows up as the row
 * springing back rather than as a silent lie.
 */
export const TaskRow = ({task, planDate, today, showPlanControl = true, onEdit}: TaskRowProps) => {
  const [optimistic, applyOptimistic] = useOptimistic(
    {status: task.status, onPlan: task.onTodaysPlan},
    (state, patch: Partial<{status: TaskStatus; onPlan: boolean}>) => ({...state, ...patch})
  );

  const overdue = task.dueDate !== null && optimistic.status !== 'DONE' && task.dueDate < today;
  const dueToday = task.dueDate === today;

  return (
    <li
      className={clsx(styles.Row, optimistic.status === 'DONE' && styles.Done)}
      style={task.role ? ({'--role-colour': task.role.colour} as React.CSSProperties) : undefined}
    >
      <div className={styles.Main}>
        <span className={styles.Title}>{task.title}</span>
        <div className={styles.Meta}>
          <RoleBadge role={task.role} />
          {task.dueDate && (
            <span
              className={clsx(styles.Due, overdue && styles.Overdue, dueToday && styles.DueToday)}
            >
              {describeDueDate(task.dueDate, today)}
            </span>
          )}
          {task.jiraUrl && (
            <a
              className={styles.Jira}
              href={task.jiraUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              <ExternalLink size={12} aria-hidden="true" />
              Ticket
              <span className="sr-only">{` for ${task.title} (opens in a new tab)`}</span>
            </a>
          )}
        </div>
      </div>

      <div className={styles.Controls}>
        <form
          action={async formData => {
            const next = formData.get('status');
            if (typeof next === 'string') applyOptimistic({status: next as TaskStatus});
            await moveTaskStatus(formData);
          }}
        >
          <input type="hidden" name="id" value={task.id} />
          <div className={styles.Status} role="group" aria-label={`Status for ${task.title}`}>
            {TASK_STATUSES.map(status => {
              const current = optimistic.status === status.value;
              return (
                <button
                  key={status.value}
                  type="submit"
                  name="status"
                  value={status.value}
                  className={clsx(styles.StatusButton, current && styles.StatusCurrent)}
                  aria-pressed={current}
                >
                  {status.label}
                  <span className="sr-only">{` — move ${task.title} to ${status.label}`}</span>
                </button>
              );
            })}
          </div>
        </form>

        {showPlanControl && (
          <form
            action={async formData => {
              const wasOnPlan = optimistic.onPlan;
              applyOptimistic({onPlan: !wasOnPlan});
              await (wasOnPlan ? removeTaskFromPlan : addTaskToPlan)(formData);
            }}
          >
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="date" value={planDate} />
            <button
              type="submit"
              className={clsx(styles.Action, optimistic.onPlan && styles.ActionOn)}
            >
              {optimistic.onPlan ? (
                <Minus size={14} aria-hidden="true" />
              ) : (
                <Plus size={14} aria-hidden="true" />
              )}
              <span className="sr-only">
                {optimistic.onPlan
                  ? `Remove ${task.title} from today's work`
                  : `Add ${task.title} to today's work`}
              </span>
            </button>
          </form>
        )}

        {onEdit && (
          <button type="button" className={styles.Action} onClick={() => onEdit(task.id)}>
            <Pencil size={14} aria-hidden="true" />
            <span className="sr-only">{`Edit ${task.title}`}</span>
          </button>
        )}
      </div>
    </li>
  );
};
