import 'server-only';

import type {TaskStatus, TaskView} from '@/features/tasks/types';
import {type DateKey, fromDateKey, toDateKey} from '@/lib/dates';
import {prisma} from '@/lib/prisma';

const ROLE_SELECT = {select: {id: true, name: true, shortName: true, colour: true}} as const;

type TaskRow = {
  id: string;
  title: string;
  jiraUrl: string | null;
  dueDate: Date | null;
  status: TaskStatus;
  notes: string | null;
  completedAt: Date | null;
  role: {id: string; name: string; shortName: string; colour: string};
  dailyTasks?: {id: string}[];
};

const toView = (task: TaskRow): TaskView => ({
  id: task.id,
  title: task.title,
  jiraUrl: task.jiraUrl,
  dueDate: task.dueDate ? toDateKey(task.dueDate) : null,
  status: task.status,
  notes: task.notes,
  role: task.role,
  completedAt: task.completedAt,
  onTodaysPlan: (task.dailyTasks?.length ?? 0) > 0,
});

/**
 * Tasks for the backlog screen.
 *
 * `planDate` decides which day's plan the `onTodaysPlan` flag refers to, so a
 * row can show whether it is already selected without a second query.
 */
export const getTasks = async (
  userId: string,
  {statuses, roleId, planDate}: {statuses?: TaskStatus[]; roleId?: string | null; planDate: DateKey}
): Promise<TaskView[]> => {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      ...(statuses ? {status: {in: statuses}} : {}),
      ...(roleId ? {roleId} : {}),
    },
    include: {
      role: ROLE_SELECT,
      dailyTasks: {where: {date: fromDateKey(planDate)}, select: {id: true}},
    },
    orderBy: [
      {status: 'asc'},
      {dueDate: {sort: 'asc', nulls: 'last'}},
      {sortOrder: 'asc'},
      {createdAt: 'asc'},
    ],
  });

  return tasks.map(toView);
};

/** Tasks with a due date of exactly this day, excluding completed ones. */
export const getTasksDueOn = async (userId: string, date: DateKey): Promise<TaskView[]> => {
  const tasks = await prisma.task.findMany({
    where: {userId, dueDate: fromDateKey(date), status: {not: 'DONE'}},
    include: {
      role: ROLE_SELECT,
      dailyTasks: {where: {date: fromDateKey(date)}, select: {id: true}},
    },
    orderBy: [{sortOrder: 'asc'}, {createdAt: 'asc'}],
  });

  return tasks.map(toView);
};

/** Tasks whose due date has passed and which are still not done. */
export const getOverdueTasks = async (userId: string, date: DateKey): Promise<TaskView[]> => {
  const tasks = await prisma.task.findMany({
    where: {userId, dueDate: {lt: fromDateKey(date)}, status: {not: 'DONE'}},
    include: {
      role: ROLE_SELECT,
      dailyTasks: {where: {date: fromDateKey(date)}, select: {id: true}},
    },
    orderBy: [{dueDate: 'asc'}],
  });

  return tasks.map(toView);
};

/**
 * The tasks explicitly chosen for a given day, in the order they were added.
 * This is the deliberate "what am I working on today" list, independent of due
 * dates entirely.
 */
export const getPlannedTasks = async (userId: string, date: DateKey): Promise<TaskView[]> => {
  const planned = await prisma.dailyTask.findMany({
    where: {userId, date: fromDateKey(date)},
    include: {task: {include: {role: ROLE_SELECT}}},
    orderBy: [{sortOrder: 'asc'}, {createdAt: 'asc'}],
  });

  return planned.map(entry => ({
    ...toView({...entry.task, dailyTasks: [{id: entry.id}]}),
  }));
};

export type TaskRecord = {
  id: string;
  title: string;
  jiraUrl: string | null;
  dueDate: DateKey | null;
  status: TaskStatus;
  notes: string | null;
  roleId: string;
};

export const getTask = async (userId: string, taskId: string): Promise<TaskRecord | null> => {
  const task = await prisma.task.findFirst({where: {id: taskId, userId}});
  if (!task) return null;

  return {
    id: task.id,
    title: task.title,
    jiraUrl: task.jiraUrl,
    dueDate: task.dueDate ? toDateKey(task.dueDate) : null,
    status: task.status,
    notes: task.notes,
    roleId: task.roleId,
  };
};

/** Counts per status, for the backlog filter chips. */
export const getTaskCounts = async (
  userId: string,
  roleId?: string | null
): Promise<Record<TaskStatus, number>> => {
  const grouped = await prisma.task.groupBy({
    by: ['status'],
    where: {userId, ...(roleId ? {roleId} : {})},
    _count: {_all: true},
  });

  const counts: Record<TaskStatus, number> = {BACKLOG: 0, TODO: 0, DONE: 0};
  for (const row of grouped) counts[row.status] = row._count._all;
  return counts;
};
