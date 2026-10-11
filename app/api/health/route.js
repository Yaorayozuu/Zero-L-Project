import { NextResponse } from 'next/server';

export const GET = async () => {
  return NextResponse.json({ ok: true, message: 'Netflix QR web API running.' });
};
