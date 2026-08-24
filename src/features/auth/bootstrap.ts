import {env} from '@/lib/env';
import {prisma} from '@/lib/prisma';

/**
 * First-run setup for a newly created account.
 *
 * A brand new user gets working hours, a timezone and a starter set of roles so
 * the application is immediately usable rather than presenting empty screens.
 * Roles are only suggestions — they can be renamed, recoloured or archived.
 */
const DEFAULT_ROLES = [
  {name: 'Team A', shortName: 'A', colour: '#3373b0', sortOrder: 0},
  {name: 'Team B', shortName: 'B', colour: '#2f9e6f', sortOrder: 1},
  {name: 'Team C', shortName: 'C', colour: '#d9822b', sortOrder: 2},
  {name: 'Personal', shortName: 'P', colour: '#8e6bbf', sortOrder: 3},
];

export const bootstrapNewUser = async (userId: string): Promise<void> => {
  const icalUrl = env.familyIcalUrl;

  await prisma.$transaction([
    prisma.userSettings.upsert({
      where: {userId},
      update: {},
      create: {
        userId,
        icalUrl,
        icalEnabled: Boolean(icalUrl),
      },
    }),
    prisma.role.createMany({
      data: DEFAULT_ROLES.map(role => ({...role, userId})),
      skipDuplicates: true,
    }),
  ]);
};
