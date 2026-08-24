import 'server-only';

import Credentials from 'next-auth/providers/credentials';
import {isEmailAllowed} from '@/features/auth/access';
import {bootstrapNewUser} from '@/features/auth/bootstrap';
import {prisma} from '@/lib/prisma';

/**
 * Development-only sign-in.
 *
 * Lets the application run locally before a Google OAuth client exists. It is
 * gated three ways and is impossible to enable in a production build:
 *
 *   1. NODE_ENV must not be 'production'
 *   2. HEADROOM_DEV_LOGIN must be exactly 'true'
 *   3. The email must still pass the ALLOWED_EMAILS allow-list
 *
 * Delete this file and its use in `src/auth.ts` once Google sign-in is set up.
 */
export const isDevLoginEnabled = (): boolean =>
  process.env.NODE_ENV !== 'production' && process.env.HEADROOM_DEV_LOGIN === 'true';

export const devLoginProvider = () =>
  Credentials({
    id: 'dev-login',
    name: 'Development sign-in',
    credentials: {email: {label: 'Email', type: 'email'}},
    authorize: async credentials => {
      if (!isDevLoginEnabled()) return null;

      const email = String(credentials?.email ?? '')
        .trim()
        .toLowerCase();

      // The allow-list still applies; this is a shortcut past Google, not past
      // access control.
      if (!isEmailAllowed(email)) return null;

      const existing = await prisma.user.findUnique({where: {email}});
      if (existing) {
        return {id: existing.id, email: existing.email, name: existing.name};
      }

      const created = await prisma.user.create({
        data: {email, name: email.split('@')[0]},
      });
      // The adapter's createUser event does not fire for this provider.
      await bootstrapNewUser(created.id);

      return {id: created.id, email: created.email, name: created.name};
    },
  });
