import { getSession } from '@/lib/access.js';
import { PLAN_LABELS, PLAN_QUALITY } from '@/lib/helpers.js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import QRCode from 'qrcode';

const qrToDataUrl = async (text) => {
  return QRCode.toDataURL(text, { width: 300, margin: 1, errorCorrectionLevel: 'M' });
};

// Minta worker generate link fresh buat plan ini.
const triggerWorker = async (plan) => {
  const workerUrl = process.env.WORKER_URL;
  if (!workerUrl) return { ok: false, reason: 'no_worker_url' };
  try {
    const res = await fetch(workerUrl.replace(/\/$/, '') + '/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WORKER_TOKEN || ''}`,
      },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch (err) {
    return { ok: false, reason: 'unreachable', error: err.message };
  }
};

// Ambil link dari memory pool worker (endpoint /pool).
const fetchWorkerPool = async (plan) => {
  const workerUrl = process.env.WORKER_URL;
  if (!workerUrl) return null;
  try {
    const res = await fetch(`${workerUrl.replace(/\/$/, '')}/pool?plan=${plan}`, {
      headers: { Authorization: `Bearer ${process.env.WORKER_TOKEN || ''}` },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    const first = (data.items || [])[0];
    return first?.link || null;
  } catch {
    return null;
  }
};

export const POST = async (req) => {
  const session = await getSession(cookies());
  if (!session?.code) {
    return NextResponse.json({ ok: false, error: 'Belum masuk. Masukin kode akses dulu.' }, { status: 401 });
  }

  const { plan } = await req.json().catch(() => ({}));
  const safePlan = ['basic', 'medium', 'premium'].includes(plan) ? plan : 'basic';

  // 1. Coba ambil dari pool worker dulu (biasanya masih ada stok fresh).
  let link = await fetchWorkerPool(safePlan);
  let source = link ? 'pool' : null;

  // 2. Pool kosong? Minta worker generate baru, tunggu hasilnya.
  if (!link) {
    const gen = await triggerWorker(safePlan);
    const fromGen = gen?.data?.link || gen?.data?.url;
    if (fromGen) {
      link = fromGen;
      source = 'fresh';
    }
    // Kadang /generate nyimpen ke pool duluan, ambil sekali lagi.
    if (!link) {
      link = await fetchWorkerPool(safePlan);
      if (link) source = 'pool';
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
