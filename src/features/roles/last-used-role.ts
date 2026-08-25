import 'server-only';

import {cookies} from 'next/headers';

/**
 * The role most recently attached to a meeting or task.
 *
 * Someone working across several teams tends to add three Team A meetings in a
 * row, not one of each. Remembering the last choice removes a select from the
 * common case without ever guessing on the user's behalf: it is only ever a
 * pre-selection, always visible, always changeable before saving.
 *
 * Deliberately a cookie rather than a settings column — it is a transient
 * convenience, not a preference worth persisting against the account.
 */
const COOKIE = 'headroom.last-role';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export const getLastUsedRoleId = async (): Promise<string | null> => {
  const store = await cookies();
  return store.get(COOKIE)?.value || null;
};

/** Called from the meeting and task actions once a save succeeds. */
export const rememberRole = async (roleId: string): Promise<void> => {
  const store = await cookies();

  store.set(COOKIE, roleId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  });
};
