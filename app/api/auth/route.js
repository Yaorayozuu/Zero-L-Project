import { isValidCode, signSession, getSession } from '@/lib/access.js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST = masukin kode akses
export const POST = async (req) => {
  const { code } = await req.json().catch(() => ({}));
  if (!isValidCode(code)) {
    return NextResponse.json(
      { ok: false, error: 'Kode akses salah atau belum aktif.' },
      { status: 401 }
    );
  }

  // Simpan label pendek (4 char terakhir) biar gak nyimpen kode utuh.
  const label = String(code).trim().slice(-4);
  const token = await signSession(label);

  const response = NextResponse.json({ ok: true, label });
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return response;
};

// GET = cek status sesi
export const GET = async () => {
  const session = await getSession(cookies());
  return NextResponse.json({ ok: true, user: session ? { label: session.code } : null });
};

// DELETE = keluar
export const DELETE = async () => {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('session', '', { maxAge: 0, path: '/' });
  return response;
};
