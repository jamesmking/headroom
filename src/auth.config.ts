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
  // AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET are read from the environment by
  // Auth.js automatically; credentials never reach the browser.
  providers: [Google],
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
