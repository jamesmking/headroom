'use server';

import {revalidatePath} from 'next/cache';
import {requireUserId} from '@/features/auth/queries/get-current-user';
import {prisma} from '@/lib/prisma';

/** See the note in `src/features/tasks/actions/quick-actions.ts`. */

/**
 * Archive or restore a role. Archiving never touches the role's meetings or
 * tasks, so historic records keep their name and colour.
 */
export const toggleRoleActive = async (formData: FormData): Promise<void> => {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');
  const active = formData.get('active') === 'true';

  if (!id) return;

  await prisma.role.updateMany({where: {id, userId}, data: {active}});
  revalidatePath('/', 'layout');
};

/** Deletes a role only when nothing is attached to it. */
export const deleteEmptyRole = async (formData: FormData): Promise<void> => {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const role = await prisma.role.findFirst({
    where: {id, userId},
    include: {_count: {select: {meetings: true, tasks: true}}},
  });

  if (!role || role._count.meetings > 0 || role._count.tasks > 0) return;

  await prisma.role.delete({where: {id: role.id}});
  revalidatePath('/', 'layout');
};
