import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Liveness endpoint for the container healthcheck and any uptime monitoring.
 *
 * Deliberately unauthenticated and free of any user data. It reports database
 * reachability in the body but still answers 200 while the database is down:
 * restarting the application would not fix a database outage, and a failing
 * healthcheck would turn a brief blip into a restart loop.
 */
export const GET = async () => {
  let database: 'up' | 'down' = 'down';

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'up';
  } catch {
    database = 'down';
  }

  return NextResponse.json(
    {status: 'ok', database, timestamp: new Date().toISOString()},
    {headers: {'Cache-Control': 'no-store'}}
  );
};
