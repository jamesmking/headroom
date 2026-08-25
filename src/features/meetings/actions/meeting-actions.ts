'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireUserId} from '@/features/auth/queries/get-current-user';
import {rememberRole} from '@/features/roles/last-used-role';
import {type ActionResult, errorResult, fromZodError, successResult} from '@/lib/action-result';
import {fromDateKey, isDateKey} from '@/lib/dates';
import {prisma} from '@/lib/prisma';
import {parseTime} from '@/lib/time';

const dateKey = z.string().trim().refine(isDateKey, 'Choose a date.');

const timeField = (message: string) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      const minutes = parseTime(value);
      if (minutes === null) {
        ctx.addIssue({code: z.ZodIssueCode.custom, message});
        return z.NEVER;
      }
      return minutes;
    });

const meetingSchema = z
  .object({
    id: z.string().trim().optional(),
    title: z
      .string()
      .trim()
      .min(1, 'Give the meeting a title.')
      .max(140, 'Keep the title under 140 characters.'),
    date: dateKey,
    startTime: timeField('Enter a start time.'),
    endTime: timeField('Enter an end time.'),
    roleId: z.string().trim().optional(),
    notes: z.string().trim().max(2000, 'Keep notes under 2000 characters.').optional(),
    recurrence: z.enum(['NONE', 'DAILY', 'WEEKDAYS', 'WEEKLY', 'FORTNIGHTLY']),
    recurrenceEndDate: z.union([dateKey, z.literal('')]).optional(),
  })
  .refine(data => data.endTime > data.startTime, {
    message: 'The end time must be after the start time.',
    path: ['endTime'],
  })
  .refine(
    data =>
      !data.recurrenceEndDate || data.recurrence === 'NONE' || data.recurrenceEndDate >= data.date,
    {message: 'The repeat must end on or after the first meeting.', path: ['recurrenceEndDate']}
  );

const readMeetingForm = (formData: FormData) => ({
  id: formData.get('id') || undefined,
  title: formData.get('title') ?? '',
  date: formData.get('date') ?? '',
  startTime: formData.get('startTime') ?? '',
  endTime: formData.get('endTime') ?? '',
  roleId: formData.get('roleId') || undefined,
  notes: formData.get('notes') || undefined,
  recurrence: formData.get('recurrence') ?? 'NONE',
  recurrenceEndDate: formData.get('recurrenceEndDate') ?? '',
});

/** Confirm a role belongs to the signed-in user before attaching it. */
const resolveRoleId = async (userId: string, roleId?: string): Promise<string | null> => {
  if (!roleId) return null;
  const role = await prisma.role.findFirst({where: {id: roleId, userId}, select: {id: true}});
  return role?.id ?? null;
};

export const saveMeetingAction = async (
  _previous: ActionResult,
  formData: FormData
): Promise<ActionResult> => {
  const userId = await requireUserId();
  const parsed = meetingSchema.safeParse(readMeetingForm(formData));

  if (!parsed.success) return fromZodError(parsed.error);

  const data = parsed.data;
  const roleId = await resolveRoleId(userId, data.roleId);

  const values = {
    title: data.title,
    date: fromDateKey(data.date),
    startMinutes: data.startTime,
    endMinutes: data.endTime,
    notes: data.notes ?? null,
    roleId,
    recurrence: data.recurrence,
    recurrenceEndDate:
      data.recurrence !== 'NONE' && data.recurrenceEndDate
        ? fromDateKey(data.recurrenceEndDate)
        : null,
  };

  try {
    if (data.id) {
      const {count} = await prisma.meeting.updateMany({
        where: {id: data.id, userId},
        data: values,
      });
      if (count === 0) return errorResult('That meeting no longer exists.');
    } else {
      await prisma.meeting.create({data: {...values, userId}});
    }
  } catch {
    return errorResult('The meeting could not be saved. Try again.');
  }

  await rememberRole(roleId);
  revalidatePath('/', 'layout');
  return successResult(data.id ? 'Meeting updated.' : 'Meeting added.');
};
