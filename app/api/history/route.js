import { initDb, getUserHistory, getPoolStats } from '../../../../lib/db.js';
import { getSession } from '../../../../lib/auth.js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const GET = async (req) => {
  try {
    await initDb();
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Database unavailable.' }, { status: 503 });
  }

  const session = await getSession(cookies());
  if (!session?.userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const history = await getUserHistory(session.userId, 50);
  const stats = await getPoolStats();

  return NextResponse.json({ ok: true, history, stats });
};
