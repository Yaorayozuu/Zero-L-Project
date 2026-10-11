import { getSession } from '@/lib/access.js';
import { PLAN_LABELS, PLAN_QUALITY } from '@/lib/helpers.js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import QRCode from 'qrcode';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const qrToDataUrl = async (text) => {
  return QRCode.toDataURL(text, { width: 300, margin: 1, errorCorrectionLevel: 'M' });
};

const workerBase = () => (process.env.WORKER_URL || '').replace(/\/$/, '');
const workerHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${process.env.WORKER_TOKEN || ''}`,
});

// Minta worker memastikan ada generate jalan (idempotent — gak numpuk).
const ensureWorker = async (plan) => {
  const base = workerBase();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/ensure?plan=${plan}`, {
      method: 'POST',
      headers: workerHeaders(),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
};

// Ambil 1 link dari pool worker (sekali pakai). 204 = belum ada, jangan trigger.
// Return: { link, source } | { pending: true } | null (worker gak kebales)
const takeFromWorker = async (plan) => {
  const base = workerBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/take?plan=${plan}`, { headers: workerHeaders(), cache: 'no-store' });
    if (res.status === 204) return { pending: true };
    if (!res.ok) return { pending: true };
    const data = await res.json().catch(() => ({}));
    if (data.ok && data.link) return { link: data.link, source: data.source || 'pool' };
    return { pending: true };
  } catch {
    return null;
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const POST = async (req) => {
  const session = await getSession(cookies());
  if (!session?.code) {
    return NextResponse.json({ ok: false, error: 'Belum masuk. Masukin kode akses dulu.' }, { status: 401 });
  }

  const { plan } = await req.json().catch(() => ({}));
  const safePlan = ['basic', 'medium', 'premium'].includes(plan) ? plan : 'basic';

  if (!workerBase()) {
    return NextResponse.json({ ok: false, error: 'Worker belum di-set (WORKER_URL kosong).' }, { status: 503 });
  }

  // 1. Coba ambil dulu (mungkin udah ada stok di pool).
  let t = await takeFromWorker(safePlan);
  if (t === null) {
    return NextResponse.json({ ok: false, error: 'Worker gak kebales. Cek WORKER_URL / coba lagi.' }, { status: 503 });
  }

  // 2. Belum ada -> minta worker generate (sekali), lalu polling sampai ~50s.
  if (!t.link) {
    await ensureWorker(safePlan);
    const deadline = Date.now() + 50000;
    while (Date.now() < deadline) {
      await sleep(3000);
      t = await takeFromWorker(safePlan);
      if (t === null) break;
      if (t.link) break;
      // Pastikan tetap ada yang digenerate (kalau gagal sebelumnya)
      await ensureWorker(safePlan);
    }
  }

  if (!t || !t.link) {
    return NextResponse.json(
      { ok: false, error: 'Link lagi digenerate, butuh waktu lebih lama. Coba klik Generate lagi.' },
      { status: 503 }
    );
  }

  const qr = await qrToDataUrl(t.link);
  return NextResponse.json({
    ok: true,
    plan: PLAN_LABELS[safePlan],
    quality: PLAN_QUALITY[safePlan],
    link: t.link,
    qr,
    source: t.source,
  });
};
