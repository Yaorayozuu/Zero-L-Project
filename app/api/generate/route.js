import { getSession } from '@/lib/access.js';
import { PLAN_LABELS, PLAN_QUALITY } from '@/lib/helpers.js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import QRCode from 'qrcode';

export const maxDuration = 60; // Vercel: izinin function jalan sampai 60s (worker generate ~30-60s)
export const dynamic = 'force-dynamic';

const qrToDataUrl = async (text) => {
  return QRCode.toDataURL(text, { width: 300, margin: 1, errorCorrectionLevel: 'M' });
};

const workerBase = () => (process.env.WORKER_URL || '').replace(/\/$/, '');
const workerHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${process.env.WORKER_TOKEN || ''}`,
});

// Ambil 1 link dari memory pool worker (kalau ada stok instan).
const fetchWorkerPool = async (plan) => {
  const base = workerBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/pool?plan=${plan}`, { headers: workerHeaders() });
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    const first = (data.items || [])[0];
    return first?.link || null;
  } catch {
    return null;
  }
};

// Panggil worker buat GENERATE BARU & tunggu link-nya (?wait=1).
// Ini yang dipakai mode kode-akses: worker balikin link langsung dalam 1 request.
const generateFresh = async (plan) => {
  const base = workerBase();
  if (!base) return { ok: false, reason: 'no_worker_url' };
  try {
    const res = await fetch(`${base}/generate?wait=1`, {
      method: 'POST',
      headers: workerHeaders(),
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.link) return { ok: true, link: data.link, source: data.source || 'fresh' };
    return { ok: false, reason: data.error || `http_${res.status}` };
  } catch (err) {
    return { ok: false, reason: 'unreachable', error: err.message };
  }
};

export const POST = async (req) => {
  const session = await getSession(cookies());
  if (!session?.code) {
    return NextResponse.json({ ok: false, error: 'Belum masuk. Masukin kode akses dulu.' }, { status: 401 });
  }

  const { plan } = await req.json().catch(() => ({}));
  const safePlan = ['basic', 'medium', 'premium'].includes(plan) ? plan : 'basic';

  // 1. Cek memory pool dulu (instan, kalau ada stok siap).
  let link = await fetchWorkerPool(safePlan);
  let source = link ? 'pool' : null;

  // 2. Pool kosong -> generate baru & tunggu (worker butuh ~30-60 detik).
  if (!link) {
    const gen = await generateFresh(safePlan);
    if (gen.ok) {
      link = gen.link;
      source = gen.source;
    }
  }

  if (!link) {
    return NextResponse.json(
      { ok: false, error: 'Stok kosong / worker belum siap. Coba lagi sebentar.' },
      { status: 503 }
    );
  }

  const qr = await qrToDataUrl(link);
  return NextResponse.json({
    ok: true,
    plan: PLAN_LABELS[safePlan],
    quality: PLAN_QUALITY[safePlan],
    link,
    qr,
    source,
  });
};
