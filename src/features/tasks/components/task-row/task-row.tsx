'use client';

import clsx from 'clsx';
import {ExternalLink, Minus, Pencil, Plus} from 'lucide-react';
import {
  addTaskToPlan,
  moveTaskStatus,
  removeTaskFromPlan,
} from '@/features/tasks/actions/quick-actions';
import {RoleBadge} from '@/components/role-badge';
import {TASK_STATUSES, type TaskView} from '@/features/tasks/types';
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
 * Every control is a real form posting a plain server action, so a status or
 * plan change can only ever happen because a button was pressed — there is no
 * dispatch to replay and no change handler that could fire without intent.
 */
export const TaskRow = ({task, planDate, today, showPlanControl = true, onEdit}: TaskRowProps) => {
  const overdue = task.dueDate !== null && task.dueDate < today && task.status !== 'DONE';
  const dueToday = task.dueDate === today;

  return (
    <li
      className={clsx(styles.Row, task.status === 'DONE' && styles.Done)}
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
        <form action={moveTaskStatus}>
          <input type="hidden" name="id" value={task.id} />
          <div className={styles.Status} role="group" aria-label={`Status for ${task.title}`}>
            {TASK_STATUSES.map(status => {
              const current = task.status === status.value;
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
          <form action={task.onTodaysPlan ? removeTaskFromPlan : addTaskToPlan}>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="date" value={planDate} />
            <button
              type="submit"
              className={clsx(styles.Action, task.onTodaysPlan && styles.ActionOn)}
            >
              {task.onTodaysPlan ? (
                <Minus size={14} aria-hidden="true" />
              ) : (
                <Plus size={14} aria-hidden="true" />
              )}
              <span className="sr-only">
                {task.onTodaysPlan
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
