import 'server-only';

import type {RoleOption, RoleSummary} from '@/features/calendar/types';
import {prisma} from '@/lib/prisma';

export type RoleView = RoleSummary & {
  description: string | null;
  active: boolean;
  sortOrder: number;
  /** How much history is attached, so archiving can explain what it keeps. */
  meetingCount: number;
  taskCount: number;
};

/** Active roles only — what forms and filters offer. */
export const getActiveRoles = async (userId: string): Promise<RoleSummary[]> => {
  const roles = await prisma.role.findMany({
    where: {userId, active: true},
    orderBy: [{sortOrder: 'asc'}, {name: 'asc'}],
    select: {id: true, name: true, shortName: true, colour: true},
  });
  return roles;
};

/**
 * Roles for a picker: active ones first, archived ones after.
 *
 * Forms need the archived ones so that editing a meeting filed under a role
 * you have since archived does not silently reassign it. They are only ever
 * offered as the current value, never as a choice for something new.
 */
export const getRoleOptions = async (userId: string): Promise<RoleOption[]> =>
  prisma.role.findMany({
    where: {userId},
    orderBy: [{active: 'desc'}, {sortOrder: 'asc'}, {name: 'asc'}],
    select: {id: true, name: true, shortName: true, colour: true, active: true},
  });

/** Every role including archived ones, for the settings screen. */
export const getAllRoles = async (userId: string): Promise<RoleView[]> => {
  const roles = await prisma.role.findMany({
    where: {userId},
    orderBy: [{active: 'desc'}, {sortOrder: 'asc'}, {name: 'asc'}],
    include: {_count: {select: {meetings: true, tasks: true}}},
  });

  return roles.map(role => ({
    id: role.id,
    name: role.name,
    shortName: role.shortName,
    colour: role.colour,
    description: role.description,
    active: role.active,
    sortOrder: role.sortOrder,
    meetingCount: role._count.meetings,
    taskCount: role._count.tasks,
  }));
};

/** Index of roles by id, for decorating meetings and tasks. */
export const getRoleMap = async (userId: string): Promise<Map<string, RoleSummary>> => {
  const roles = await prisma.role.findMany({
    where: {userId},
    select: {id: true, name: true, shortName: true, colour: true},
  });
  return new Map(roles.map(role => [role.id, role]));
};
