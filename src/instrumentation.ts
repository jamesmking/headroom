/**
 * Runs once when the Next.js server starts, before it accepts traffic.
 *
 * Its only job is to say plainly when the database is unreachable. Auth.js
 * reports an adapter failure during the OAuth callback as the generic
 * `Configuration` error code, which is indistinguishable from a genuinely
 * broken OAuth client — so a stopped database presents itself to the browser as
 * bad Google credentials. One line in the startup log removes that whole class
 * of misdiagnosis.
 *
 * This never throws. A database outage is not a reason to refuse to boot: the
 * server should still come up, answer its healthcheck and recover when the
 * database does. `src/app/api/health/route.ts` reasons the same way.
 */
export const register = async (): Promise<void> => {
  // Instrumentation also runs in the edge runtime, which cannot load Prisma.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const {prisma} = await import('@/lib/prisma');

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    // Prisma spreads one failure over several lines, the first of which only
    // names the call that failed. Keep the lines that describe the cause.
    const detail = (error instanceof Error ? error.message : String(error))
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('Invalid `prisma'))
      .join(' ');

    console.error(
      [
        '',
        '  ⚠  Database unreachable at startup.',
        `     ${detail}`,
        '',
        '     Sign-in will fail with "Sign-in could not be completed" until this',
        '     is fixed. That is not a problem with AUTH_GOOGLE_ID/SECRET.',
        '',
        '     Local development: docker compose up -d && npm run db:deploy',
        '',
      ].join('\n')
    );
  }
};
