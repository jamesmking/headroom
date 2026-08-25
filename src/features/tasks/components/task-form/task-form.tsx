'use client';

import {useActionState, useEffect, useRef} from 'react';
import {Button} from '@/components/button';
import {Field, fieldStyles} from '@/components/field';
import {FormMessage} from '@/components/form-message';
import type {RoleOption} from '@/features/calendar/types';
import {RoleRequired} from '@/features/roles/components/role-required';
import {deleteTask} from '@/features/tasks/actions/quick-actions';
import {saveTaskAction} from '@/features/tasks/actions/task-actions';
import type {TaskRecord} from '@/features/tasks/queries/get-tasks';
import {TASK_STATUSES} from '@/features/tasks/types';
import {idleResult} from '@/lib/action-result';
import type {DateKey} from '@/lib/dates';
import {useDismiss} from '@/lib/use-dismiss';
import styles from './task-form.module.scss';

type TaskFormProps = {
  roles: RoleOption[];
  task?: TaskRecord | null;
  /** Defaults for a new task. */
  defaults?: {status?: 'BACKLOG' | 'TODO' | 'DONE'; dueDate?: DateKey; roleId?: string};
  /** When set, a newly created task is also added to that day's plan. */
  planDate?: DateKey;
  onDone: () => void;
};

export const TaskForm = ({roles, task, defaults, planDate, onDone}: TaskFormProps) => {
  const [result, formAction] = useActionState(saveTaskAction, idleResult);
  const titleRef = useRef<HTMLInputElement>(null);

  // Escape closes the editor; clicking away deliberately does not, so a
  // half-written task survives a stray click on the page behind it.
  useDismiss(onDone);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (result.status === 'success') onDone();
  }, [result, onDone]);

  const errors = result.fieldErrors ?? {};

  const currentRoleId = task?.roleId ?? null;
  // See the note on the same filter in the meeting form.
  const options = roles.filter(role => role.active || role.id === currentRoleId);
  const suggested =
    defaults?.roleId && options.some(role => role.id === defaults.roleId && role.active)
      ? defaults.roleId
      : options.length === 1
        ? options[0].id
        : '';
  const selectedRoleId = currentRoleId ?? suggested;

  // All hooks above run unconditionally; only the render branches.
  if (options.length === 0) return <RoleRequired noun="task" />;

  return (
    <form action={formAction} className={styles.Form}>
      <p className={styles.Legend}>{task ? 'Edit task' : 'New task'}</p>

      {task && <input type="hidden" name="id" value={task.id} />}
      {!task && planDate && <input type="hidden" name="planDate" value={planDate} />}

      <FormMessage result={result} />

      <div className={styles.Grid}>
        <Field label="Title" error={errors.title} className={styles.Full}>
          {({id, describedBy, invalid}) => (
            <input
              ref={titleRef}
              id={id}
              name="title"
              className={fieldStyles.Input}
              defaultValue={task?.title ?? ''}
              placeholder="Review the release notes"
              maxLength={200}
              required
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field label="Role" error={errors.roleId}>
          {({id, describedBy, invalid}) => (
            <select
              id={id}
              name="roleId"
              className={fieldStyles.Select}
              defaultValue={selectedRoleId}
              required
              aria-describedby={describedBy}
              aria-invalid={invalid}
            >
              <option value="" disabled>
                Choose a role…
              </option>
              {options.map(role => (
                <option key={role.id} value={role.id}>
                  {role.active ? role.name : `${role.name} (archived)`}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Status" error={errors.status}>
          {({id, describedBy}) => (
            <select
              id={id}
              name="status"
              className={fieldStyles.Select}
              defaultValue={task?.status ?? defaults?.status ?? 'BACKLOG'}
              aria-describedby={describedBy}
            >
              {TASK_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="Due date"
          optional
          hint="Only set a real deadline. To work on it today, add it to today's work instead."
          error={errors.dueDate}
        >
          {({id, describedBy, invalid}) => (
            <input
              id={id}
              name="dueDate"
              type="date"
              className={fieldStyles.Time}
              defaultValue={task?.dueDate ?? defaults?.dueDate ?? ''}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field label="Jira ticket" optional error={errors.jiraUrl}>
          {({id, describedBy, invalid}) => (
            <input
              id={id}
              name="jiraUrl"
              type="url"
              className={fieldStyles.Input}
              defaultValue={task?.jiraUrl ?? ''}
              placeholder="https://jira.example.com/browse/ABC-123"
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field label="Notes" optional error={errors.notes} className={styles.Full}>
          {({id, describedBy, invalid}) => (
            <textarea
              id={id}
              name="notes"
              className={fieldStyles.Textarea}
              defaultValue={task?.notes ?? ''}
              rows={2}
              maxLength={2000}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>
      </div>

      <div className={styles.Footer}>
        <Button type="submit">{task ? 'Save task' : 'Add task'}</Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <span className={styles.Spacer} />
        {task && (
          <Button type="submit" variant="danger" formAction={deleteTask}>
            Delete
          </Button>
        )}
      </div>
    </form>
  );
};
