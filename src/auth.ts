import {PrismaAdapter} from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import {authConfig} from '@/auth.config';
import {isEmailAllowed} from '@/features/auth/access';
import {bootstrapNewUser} from '@/features/auth/bootstrap';
import {devLoginProvider, isDevLoginEnabled} from '@/features/auth/dev-login';
import {prisma} from '@/lib/prisma';

/**
 * Full Auth.js configuration.
 *
 * The Prisma adapter persists User and Account rows so application data can be
 * owned by a user, while sessions themselves are JWTs. That combination keeps
 * middleware free of database access without giving up real user records.
 */
export const {handlers, auth, signIn, signOut} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    // Present only in development, and only when explicitly switched on.
    ...(isDevLoginEnabled() ? [devLoginProvider()] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,

    /** Enforce the allow-list. A denied account never receives a session. */
    signIn({user}) {
      return isEmailAllowed(user.email);
    },

    /** Carry the database user id into the token so queries can scope by it. */
    jwt({token, user}) {
      if (user?.id) token.userId = user.id;
      return token;
    },

    session({session, token}) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  events: {
    /** Seed sensible defaults the first time an account is created. */
    async createUser({user}) {
      if (user.id) await bootstrapNewUser(user.id);
    },
  },
});
