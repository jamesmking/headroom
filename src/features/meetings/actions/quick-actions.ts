'use server';

import {revalidatePath} from 'next/cache';
import {requireUserId} from '@/features/auth/queries/get-current-user';
import {fromDateKey, isDateKey} from '@/lib/dates';
import {prisma} from '@/lib/prisma';

/** See the note in `src/features/tasks/actions/quick-actions.ts`. */

export const deleteMeeting = async (formData: FormData): Promise<void> => {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await prisma.meeting.deleteMany({where: {id, userId}});
  revalidatePath('/', 'layout');
};

/**
 * Cancel one occurrence of a recurring meeting and leave the series intact —
 * "today's stand-up is off".
 */
export const skipMeetingOccurrence = async (formData: FormData): Promise<void> => {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');
  const date = String(formData.get('occurrenceDate') ?? '');

  if (!id || !isDateKey(date)) return;

  const meeting = await prisma.meeting.findFirst({where: {id, userId}});
  if (!meeting) return;

  if (meeting.recurrence === 'NONE') {
    await prisma.meeting.delete({where: {id: meeting.id}});
    revalidatePath('/', 'layout');
    return;
  }

  const occurrence = fromDateKey(date);
  const alreadySkipped = meeting.skippedDates.some(
    skipped => skipped.getTime() === occurrence.getTime()
  );

  if (!alreadySkipped) {
    await prisma.meeting.update({
      where: {id: meeting.id},
      data: {skippedDates: {push: occurrence}},
    });
  }

  revalidatePath('/', 'layout');
};
