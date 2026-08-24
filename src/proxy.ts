import NextAuth from 'next-auth';
import {authConfig} from '@/auth.config';

/**
 * Route protection (Next.js 16 calls this a proxy; it was `middleware.ts`).
 *
 * Built from the edge-safe config only — no Prisma adapter — so this bundle
 * stays small and portable. The `authorized` callback in `auth.config.ts`
 * redirects anonymous requests to the sign-in page.
 *
 * Note the plain default export: Next's static analysis does not recognise a
 * destructured `export const {auth: middleware}`.
 */
const {auth} = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    /*
     * Everything except:
     *  - /api/auth/*  (the Auth.js endpoints themselves)
     *  - /api/health   (container healthcheck; exposes no user data)
     *  - Next.js internals and static assets
     */
    '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)',
  ],
};
