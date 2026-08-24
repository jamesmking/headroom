'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireUserId} from '@/features/auth/queries/get-current-user';
import {type ActionResult, errorResult, fromZodError, successResult} from '@/lib/action-result';
import {fromDateKey, isDateKey} from '@/lib/dates';
import {prisma} from '@/lib/prisma';

/**
 * Only http(s) links are accepted. The Jira URL is rendered as an anchor, so
 * rejecting other schemes keeps `javascript:` and friends out of the markup.
 */
const jiraUrlSchema = z
  .string()
  .trim()
  .max(2048, 'That link is too long.')
  .refine(value => {
    try {
      const {protocol} = new URL(value);
      return protocol === 'https:' || protocol === 'http:';
    } catch {
      return false;
    }
  }, 'Enter a full link starting with https://');

const taskSchema = z.object({
  id: z.string().trim().optional(),
  title: z
    .string()
    .trim()
    .min(1, 'Give the task a title.')
    .max(200, 'Keep the title under 200 characters.'),
  roleId: z.string().trim().optional(),
  jiraUrl: z.union([jiraUrlSchema, z.literal('')]).optional(),
  dueDate: z
    .union([z.string().trim().refine(isDateKey, 'Choose a valid date.'), z.literal('')])
    .optional(),
  status: z.enum(['BACKLOG', 'TODO', 'DONE']),
  notes: z.string().trim().max(2000, 'Keep notes under 2000 characters.').optional(),
  /** When present, a newly created task also joins that day's plan. */
  planDate: z
    .union([z.string().trim().refine(isDateKey, 'Choose a valid date.'), z.literal('')])
    .optional(),
});

const resolveRoleId = async (userId: string, roleId?: string): Promise<string | null> => {
  if (!roleId) return null;
  const role = await prisma.role.findFirst({where: {id: roleId, userId}, select: {id: true}});
  return role?.id ?? null;
};

export const saveTaskAction = async (
  _previous: ActionResult,
  formData: FormData
): Promise<ActionResult> => {
  const userId = await requireUserId();

  const parsed = taskSchema.safeParse({
    id: formData.get('id') || undefined,
    title: formData.get('title') ?? '',
    roleId: formData.get('roleId') || undefined,
    jiraUrl: formData.get('jiraUrl') ?? '',
    dueDate: formData.get('dueDate') ?? '',
    status: formData.get('status') ?? 'BACKLOG',
    notes: formData.get('notes') || undefined,
    planDate: formData.get('planDate') ?? '',
  });

  if (!parsed.success) return fromZodError(parsed.error);

  const data = parsed.data;
  const roleId = await resolveRoleId(userId, data.roleId);

  const values = {
    title: data.title,
    roleId,
    jiraUrl: data.jiraUrl || null,
    dueDate: data.dueDate ? fromDateKey(data.dueDate) : null,
    status: data.status,
    notes: data.notes ?? null,
    completedAt: data.status === 'DONE' ? new Date() : null,
  };

  try {
    if (data.id) {
      const existing = await prisma.task.findFirst({
        where: {id: data.id, userId},
        select: {status: true, completedAt: true},
      });
      if (!existing) return errorResult('That task no longer exists.');

      await prisma.task.update({
        where: {id: data.id},
        data: {
          ...values,
          // Keep the original completion time when a task was already done.
          completedAt: data.status === 'DONE' ? (existing.completedAt ?? new Date()) : null,
        },
      });
    } else {
      const created = await prisma.task.create({data: {...values, userId}});

      // A task added from the Today screen is one you intend to do today.
      if (data.planDate) {
        const day = fromDateKey(data.planDate);
        const existingCount = await prisma.dailyTask.count({where: {userId, date: day}});
        await prisma.dailyTask.create({
          data: {userId, taskId: created.id, date: day, sortOrder: existingCount},
        });
      }
    }
  } catch {
    return errorResult('The task could not be saved. Try again.');
  }

  revalidatePath('/', 'layout');
  return successResult(data.id ? 'Task updated.' : 'Task added.');
};
