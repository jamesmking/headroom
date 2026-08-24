import type {RoleSummary} from '@/features/calendar/types';
import type {DateKey} from '@/lib/dates';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'DONE';

export const TASK_STATUSES: {value: TaskStatus; label: string; description: string}[] = [
  {value: 'BACKLOG', label: 'Backlog', description: 'Not started, not scheduled'},
  {value: 'TODO', label: 'To do', description: 'Picked up and in progress'},
  {value: 'DONE', label: 'Done', description: 'Finished'},
];

export const statusLabel = (status: TaskStatus): string =>
  TASK_STATUSES.find(entry => entry.value === status)?.label ?? status;

export type TaskView = {
  id: string;
  title: string;
  jiraUrl: string | null;
  dueDate: DateKey | null;
  status: TaskStatus;
  notes: string | null;
  role: RoleSummary | null;
  completedAt: Date | null;
  /** True when the task is on the given day's plan. */
  onTodaysPlan: boolean;
};

/** TaskView carries everything the edit form needs; this is the mapping. */
export const toTaskRecord = (task: TaskView) => ({
  id: task.id,
  title: task.title,
  jiraUrl: task.jiraUrl,
  dueDate: task.dueDate,
  status: task.status,
  notes: task.notes,
  roleId: task.role?.id ?? null,
});
