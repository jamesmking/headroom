'use server';

import {revalidatePath} from 'next/cache';
import {requireUserId} from '@/features/auth/queries/get-current-user';
import {moveWithin} from '@/features/roles/reorder';
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

/**
 * Move a role one place up or down.
 *
 * Roles only ever swap with a neighbour in the same group — active roles among
 * active roles — so the move matches what is on screen, where archived roles
 * are listed after the active ones.
 *
 * Every move rewrites `sortOrder` for the whole list as 0..n-1. That keeps the
 * values contiguous whatever state they were in beforehand, so duplicates or
 * gaps left by older data cannot make the order ambiguous.
 */
export const moveRole = async (formData: FormData): Promise<void> => {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');
  const direction = formData.get('direction') === 'up' ? 'up' : 'down';

  if (!id) return;

  const roles = await prisma.role.findMany({
    where: {userId},
    orderBy: [{active: 'desc'}, {sortOrder: 'asc'}, {name: 'asc'}],
    select: {id: true, active: true},
  });

  const target = roles.find(role => role.id === id);
  if (!target) return;

  const group = roles.filter(role => role.active === target.active);
  const index = group.findIndex(role => role.id === id);
  const moved = moveWithin(group, index, direction);

  // Nothing to do when the role is already at the end of its group.
  if (moved === group) return;

  const others = roles.filter(role => role.active !== target.active);
  const ordered = target.active ? [...moved, ...others] : [...others, ...moved];

  await prisma.$transaction(
    ordered.map((role, sortOrder) =>
      prisma.role.updateMany({where: {id: role.id, userId}, data: {sortOrder}})
    )
  );

  revalidatePath('/', 'layout');
};
