import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
