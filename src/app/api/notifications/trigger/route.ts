import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { processFollowUps } from '@/lib/cron';

export async function POST() {
  const session = await auth();
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await processFollowUps();
  return NextResponse.json({ message: 'Follow-up processing triggered' });
}
