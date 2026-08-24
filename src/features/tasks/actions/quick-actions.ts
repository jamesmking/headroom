'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireUserId} from '@/features/auth/queries/get-current-user';
import {fromDateKey, isDateKey} from '@/lib/dates';
import {prisma} from '@/lib/prisma';

/**
 * Single-click mutations.
 *
 * These take `FormData` directly and return nothing, so they are passed
 * straight to `<form action={...}>` rather than through `useActionState`. A
 * mutation here only ever runs because someone pressed a button — there is no
 * client-side state, no dispatch to replay, and no change handler that could
 * fire without intent.
 *
 * Anything needing field-level validation feedback (the meeting, task and role
 * forms) keeps `useActionState` instead.
 */

const statusSchema = z.enum(['BACKLOG', 'TODO', 'DONE']);

export const moveTaskStatus = async (formData: FormData): Promise<void> => {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');
  const parsed = statusSchema.safeParse(formData.get('status'));

  if (!id || !parsed.success) return;

  const status = parsed.data;
  await prisma.task.updateMany({
    where: {id, userId},
    data: {status, completedAt: status === 'DONE' ? new Date() : null},
  });

  revalidatePath('/', 'layout');
};

export const addTaskToPlan = async (formData: FormData): Promise<void> => {
  const userId = await requireUserId();
  const taskId = String(formData.get('taskId') ?? '');
  const date = String(formData.get('date') ?? '');

  if (!taskId || !isDateKey(date)) return;

  const task = await prisma.task.findFirst({where: {id: taskId, userId}, select: {id: true}});
  if (!task) return;

  const day = fromDateKey(date);
  const existingCount = await prisma.dailyTask.count({where: {userId, date: day}});

  await prisma.dailyTask.upsert({
    where: {taskId_date: {taskId, date: day}},
    update: {},
    create: {userId, taskId, date: day, sortOrder: existingCount},
  });

  revalidatePath('/', 'layout');
};

export const removeTaskFromPlan = async (formData: FormData): Promise<void> => {
  const userId = await requireUserId();
  const taskId = String(formData.get('taskId') ?? '');
  const date = String(formData.get('date') ?? '');

  if (!taskId || !isDateKey(date)) return;

  await prisma.dailyTask.deleteMany({where: {userId, taskId, date: fromDateKey(date)}});

  revalidatePath('/', 'layout');
};

export const deleteTask = async (formData: FormData): Promise<void> => {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await prisma.task.deleteMany({where: {id, userId}});
  revalidatePath('/', 'layout');
};
