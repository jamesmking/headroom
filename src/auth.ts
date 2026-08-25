import {PrismaAdapter} from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import {authConfig} from '@/auth.config';
import {isEmailAllowed} from '@/features/auth/access';
import {bootstrapNewUser} from '@/features/auth/bootstrap';
import {devLoginProvider, isDevLoginEnabled} from '@/features/auth/dev-login';
import {profileUpdates} from '@/features/auth/profile-sync';
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

    /**
     * Carry the database user id into the token so queries can scope by it,
     * and take the freshest name and picture from the provider.
     *
     * The picture has to be applied here as well as in the `signIn` event.
     * Sessions are JWTs, so what the avatar renders comes from this token, not
     * from a live read — and the event that writes the database runs *after*
     * the token is minted. Without this, a newly linked account would show
     * initials until the *second* sign-in.
     */
    jwt({token, user, profile}) {
      if (user?.id) token.userId = user.id;

      if (profile) {
        const updates = profileUpdates(
          {name: token.name ?? null, image: token.picture ?? null},
          profile
        );
        if (updates.name) token.name = updates.name;
        if (updates.image) token.picture = updates.image;
      }

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

    /**
     * Refresh the stored name and picture from the provider.
     *
     * The adapter writes them only in `createUser`, so a User row that existed
     * before the first Google sign-in — from the seed or the development
     * sign-in — keeps a null picture forever and shows initials instead of a
     * photo. Doing it as an event rather than in the `signIn` callback means
     * the row is definitely persisted by the time this runs.
     */
    async signIn({user, profile}) {
      if (!user.id || !profile) return;

      const current = await prisma.user.findUnique({
        where: {id: user.id},
        select: {name: true, image: true},
      });
      if (!current) return;

      const updates = profileUpdates(current, profile);
      if (Object.keys(updates).length === 0) return;

      await prisma.user.update({where: {id: user.id}, data: updates});
    },
  },
});
