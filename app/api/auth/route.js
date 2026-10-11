import { initDb, getUser } from '@/lib/db.js';
import { signToken, getSession } from '@/lib/auth.js';
import { verifyPassword } from '@/lib/helpers.js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const POST = async (req) => {
  try {
    await initDb();
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Database unavailable.' }, { status: 503 });
  }

  const { username, password } = await req.json();
  const user = await getUser(username);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ ok: false, error: 'Username atau password salah.' }, { status: 401 });
  }

  const token = await signToken({ userId: user.id, username: user.username });
  const response = NextResponse.json({ ok: true, username: user.username });
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return response;
};

export const GET = async () => {
  const session = await getSession(cookies());
  return NextResponse.json({ ok: true, user: session || null });
};

export const DELETE = async (req) => {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('session', '', { maxAge: 0, path: '/' });
  return response;
};
