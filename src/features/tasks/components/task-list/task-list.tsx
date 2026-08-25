'use client';

import {Plus} from 'lucide-react';
import {useCallback, useState} from 'react';
import {Button} from '@/components/button';
import {EmptyState} from '@/components/empty-state';
import {Panel} from '@/components/panel';
import type {RoleSummary} from '@/features/calendar/types';
import {TaskForm} from '@/features/tasks/components/task-form';
import {TaskRow} from '@/features/tasks/components/task-row';
import {type TaskStatus, type TaskView, toTaskRecord} from '@/features/tasks/types';
import type {DateKey} from '@/lib/dates';
import styles from './task-list.module.scss';

type TaskListProps = {
  title: string;
  tasks: TaskView[];
  roles: RoleSummary[];
  planDate: DateKey;
  today: DateKey;
  emptyMessage: string;
  emptyHint?: string;
  /** Omit to hide the add control entirely. */
  addLabel?: string;
  addDefaults?: {status?: TaskStatus; dueDate?: DateKey};
  /** Pre-selects the role last used, so adding several in a row is quicker. */
  defaultRoleId?: string | null;
  /** New tasks created here also join the plan for `planDate`. */
  addToPlanOnCreate?: boolean;
  showPlanControl?: boolean;
  footer?: React.ReactNode;
  className?: string;
};

/**
 * A titled list of tasks with inline add and edit. Used for Today's work, the
 * due-today list and the backlog, which differ only in what they are given.
 */
export const TaskList = ({
  title,
  tasks,
  roles,
  planDate,
  today,
  emptyMessage,
  emptyHint,
  addLabel,
  addDefaults,
  defaultRoleId,
  addToPlanOnCreate = false,
  showPlanControl = true,
  footer,
  className,
}: TaskListProps) => {
  const [editorTaskId, setEditorTaskId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const close = useCallback(() => {
    setAdding(false);
    setEditorTaskId(null);
  }, []);

  const editing = editorTaskId ? (tasks.find(task => task.id === editorTaskId) ?? null) : null;

  return (
    <Panel
      title={title}
      meta={tasks.length > 0 ? String(tasks.length) : undefined}
      flush
      className={className}
      actions={
        addLabel && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              setEditorTaskId(null);
              setAdding(true);
            }}
          >
            <Plus size={14} aria-hidden="true" />
            {addLabel}
          </Button>
        )
      }
    >
      {adding && (
        <TaskForm
          key="create"
          roles={roles}
          defaults={{...addDefaults, roleId: defaultRoleId ?? undefined}}
          planDate={addToPlanOnCreate ? planDate : undefined}
          onDone={close}
        />
      )}
      {editing && (
        <TaskForm key={editing.id} roles={roles} task={toTaskRecord(editing)} onDone={close} />
      )}

      {tasks.length === 0 ? (
        <EmptyState message={emptyMessage} hint={emptyHint} />
      ) : (
        <ul className={styles.List}>
          {tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              planDate={planDate}
              today={today}
              showPlanControl={showPlanControl}
              onEdit={taskId => {
                setAdding(false);
                setEditorTaskId(taskId);
              }}
            />
          ))}
        </ul>
      )}

      {footer && <div className={styles.Footer}>{footer}</div>}
    </Panel>
  );
};
