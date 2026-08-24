'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireUserId} from '@/features/auth/queries/get-current-user';
import {type ActionResult, errorResult, fromZodError, successResult} from '@/lib/action-result';
import {prisma} from '@/lib/prisma';

const HEX_COLOUR = /^#[0-9a-fA-F]{6}$/;

const roleSchema = z.object({
  id: z.string().trim().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Give the role a name.')
    .max(60, 'Keep the name under 60 characters.'),
  shortName: z
    .string()
    .trim()
    .min(1, 'Add a short name — it labels meetings and tasks.')
    .max(8, 'Short names are at most 8 characters.'),
  colour: z.string().trim().regex(HEX_COLOUR, 'Pick a colour.'),
  description: z.string().trim().max(280, 'Keep the description under 280 characters.').optional(),
});

/** Refresh every screen that renders role colours or filters. */
const revalidateRoleConsumers = () => {
  revalidatePath('/', 'layout');
};

export const saveRoleAction = async (
  _previous: ActionResult,
  formData: FormData
): Promise<ActionResult> => {
  const userId = await requireUserId();

  const parsed = roleSchema.safeParse({
    id: formData.get('id') || undefined,
    name: formData.get('name') ?? '',
    shortName: formData.get('shortName') ?? '',
    colour: formData.get('colour') ?? '',
    description: formData.get('description') || undefined,
  });

  if (!parsed.success) return fromZodError(parsed.error);

  const {id, name, shortName, colour, description} = parsed.data;

  try {
    if (id) {
      // Scope the update by userId so one user can never edit another's role.
      const {count} = await prisma.role.updateMany({
        where: {id, userId},
        data: {name, shortName, colour, description: description ?? null},
      });
      if (count === 0) return errorResult('That role no longer exists.');
    } else {
      const roleCount = await prisma.role.count({where: {userId}});
      await prisma.role.create({
        data: {
          userId,
          name,
          shortName,
          colour,
          description: description ?? null,
          sortOrder: roleCount,
        },
      });
    }
  } catch {
    return errorResult('The role could not be saved. Try again.');
  }

  revalidateRoleConsumers();
  return successResult(id ? 'Role updated.' : `${name} added.`);
};
