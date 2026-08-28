import {NextResponse} from 'next/server';
import {syncFamilyCalendar, usersWithFamilyCalendar} from '@/features/family-calendar/sync';
import {env} from '@/lib/env';

export const dynamic = 'force-dynamic';
/** A sync is a 2 MB fetch and a parse per user; the 10s default is too tight. */
export const maxDuration = 60;

/**
 * Scheduled refresh of every configured family calendar.
 *
 * Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`. Without a
 * secret configured the endpoint refuses everything rather than defaulting to
 * open: it is the one route outside the signed-in area that does real work.
 *
 * The response deliberately carries counts and statuses but no user ids or
 * addresses. It is a health signal for the Vercel dashboard, not a report.
 */
export const GET = async (request: Request): Promise<NextResponse> => {
  const secret = env.cronSecret;

  if (!secret) {
    return NextResponse.json(
      {error: 'CRON_SECRET is not configured on this deployment.'},
      {status: 503}
    );
  }

  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  }

  const userIds = await usersWithFamilyCalendar();
  const tally = {ok: 0, error: 0, disabled: 0};
  const failures: string[] = [];

  // Sequential on purpose. Each run pulls a multi-megabyte feed and writes a
  // few hundred rows; doing that for several users at once would spike memory
  // and the connection pool for no gain on a job with no deadline.
  for (const userId of userIds) {
    const outcome = await syncFamilyCalendar(userId);
    tally[outcome.status] += 1;
    if (outcome.status === 'error') failures.push(outcome.message);
  }

  return NextResponse.json({
    considered: userIds.length,
    ...tally,
    // Messages describe the feed, not the person whose feed it is.
    failures,
  });
};
