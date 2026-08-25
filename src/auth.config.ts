import type {NextAuthConfig} from 'next-auth';
import Google from 'next-auth/providers/google';
import {signInPath} from '@/routes';

/**
 * Edge-safe portion of the Auth.js configuration.
 *
 * This is deliberately free of database access so `middleware.ts` can evaluate
 * sessions without pulling Prisma into the middleware bundle. The full
 * configuration in `src/auth.ts` extends this with the adapter and callbacks.
 */
export const authConfig = {
  providers: [
    // AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET are still read from the environment
    // by Auth.js; passing options here does not disable that. Credentials never
    // reach the browser.
    Google({
      /*
       * Link a Google sign-in to an existing user with the same address.
       *
       * Any User row that exists before the first Google sign-in has no Account
       * row against it — `npm run db:seed` and the dev-login provider both
       * create one, and the README suggests reaching for them first. Without
       * this flag Auth.js refuses that sign-in with OAuthAccountNotLinked
       * instead of linking the two, which makes the documented setup order dead
       * end at the last step.
       *
       * The "dangerous" in the name is aimed at providers that do not verify
       * email ownership, where someone could claim an address they do not hold.
       * Google verifies it, and `ALLOWED_EMAILS` still gates every sign-in.
       */
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: signInPath(),
    error: signInPath(),
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    /**
     * Gate every route. Returning false makes Auth.js redirect an anonymous
     * visitor to the sign-in page.
     */
    authorized({auth, request}) {
      const signedIn = Boolean(auth?.user);
      const {pathname} = request.nextUrl;

      if (pathname === signInPath()) {
        if (signedIn) {
          return Response.redirect(new URL('/', request.nextUrl));
        }
        return true;
      }

      return signedIn;
    },
  },
} satisfies NextAuthConfig;
