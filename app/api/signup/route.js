import { initDb, createUser, getUser, addGeneration, getDailyCount, incrementUsage, getFreePool, consumePool, getUserHistory, getPoolStats } from '@/lib/db.js';
import { getSession } from '@/lib/auth.js';
import { hashPassword, verifyPassword, PLAN_LABELS, PLAN_QUALITY, DAILY_LIMIT } from '@/lib/helpers.js';
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export const POST = async (req) => {
  try {
    await initDb();
  } catch (err) {
    console.error('[signup] initDb failed:', err.message);
    return NextResponse.json({ ok: false, error: 'Database unavailable. Connect Vercel Postgres.' }, { status: 503 });
  }

  const { username, password } = await req.json();
  if (!username || !password || password.length < 6) {
    return NextResponse.json({ ok: false, error: 'Username & password (min 6 chars) required.' }, { status: 400 });
  }

  const existing = await getUser(username);
  if (existing) {
    return NextResponse.json({ ok: false, error: 'Username sudah dipakai.' }, { status: 409 });
  }

  const hash = await hashPassword(password);
  const user = await createUser(username, hash);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Gagal bikin user.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, username: user.username });
};
