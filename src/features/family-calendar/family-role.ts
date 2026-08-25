import type {RoleSummary} from '@/features/calendar/types';

/**
 * The category imported family calendar events belong to.
 *
 * Deliberately not a database row. Family events are built in memory from the
 * iCal feed on every request and never persisted, so this role needs no
 * migration, can never appear in a role picker, and cannot be renamed,
 * archived or deleted by accident. `resolveRoleId` validates submitted role
 * ids against the user's own rows, so this id can never reach a meeting.
 */
export const FAMILY_ROLE: RoleSummary = {
  id: 'family',
  name: 'Family',
  shortName: 'FAM',
  // Matches $family in styles/variables/_colours.scss — the one neutral tone
  // reserved for events that are not one of the user's own roles.
  colour: '#6b7a88',
};
