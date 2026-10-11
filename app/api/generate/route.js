import { initDb, getUser, addGeneration, getDailyCount, incrementUsage, getFreePool, consumePool, getUserHistory, logWorkerRun } from '../../../../lib/db.js';
import { getSession } from '../../../../lib/auth.js';
import { PLAN_LABELS, PLAN_QUALITY, DAILY_LIMIT } from '../../../../lib/helpers.js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import QRCode from 'qrcode';

// Generate QR data URI
const qrToDataUrl = async (text) => {
  return QRCode.toDataURL(text, { width: 300, margin: 1, errorCorrectionLevel: 'M' });
};

// Hit worker (worker URL dari env) buat trigger generate fresh ke pool
const triggerWorker = async (plan) => {
  const workerUrl = process.env.WORKER_URL;
  if (!workerUrl) return { triggered: false, reason: 'no_worker_url' };
  try {
    const res = await fetch(workerUrl + '/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.WORKER_TOKEN || ''}` },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));
    return { triggered: res.ok, data };
  } catch (err) {
    return { triggered: false, reason: 'unreachable', error: err.message };
  }
};

export const POST = async (req) => {
  try {
    await initDb();
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Database unavailable.' }, { status: 503 });
  }

  const session = await getSession(cookies());
  if (!session?.userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { plan } = await req.json();
  const safePlan = ['basic', 'medium', 'premium'].includes(plan) ? plan : 'basic';
  const today = new Date().toISOString().slice(0, 10);

  // 1. Cek limit harian
  const used = await getDailyCount(session.userId, today);
  if (used >= DAILY_LIMIT) {
    return NextResponse.json({ ok: false, error: `Limit harian habis (${DAILY_LIMIT}x/hari). Reset besok.` });
  }

  // 2. Trigger worker generate fresh (background, jangan nunggu)
  triggerWorker(safePlan).catch(console.error);

  // 3. Ambil dari pool (fresh dulu)
  const [poolRows] = await getFreePool(safePlan, 5);
  let link = null;
  let source = 'fresh';

  if (poolRows && poolRows.length > 0) {
    const pick = poolRows[0];
    link = pick.netflix_link;
    await consumePool(pick.id);
    source = 'worker';
  }

  // 4. Fallback: pool kosong / worker gagal -> ambil stok user lain (zero-fail guarantee)
  if (!link) {
    const fallback = await getUserHistory(session.userId, 100);
    const stillGood = fallback.find((g) => !g.consumed && g.source === 'worker');
    if (stillGood) {
      link = stillGood.netflix_link;
      source = 'shared';
    }
  }

  // 5. Masih gak dapet? Error, tapi increment usage tetep gak dilakukan biar gak nge-gas limit.
  if (!link) {
    await logWorkerRun({ plan: safePlan, status: 'failed_no_pool', error: 'No available link in pool and no fallback.' });
    return NextResponse.json({ ok: false, error: 'Stok kosong. Coba lagi nanti atau hubungi admin.' }, { status: 503 });
  }

  // 6. Catet usage + history user ini
  await incrementUsage(session.userId, today);
  await addGeneration({
    userId: session.userId,
    plan: safePlan,
    netflixLink: link,
    quality: PLAN_QUALITY[safePlan],
    country: null,
    source,
  });

  const qr = await qrToDataUrl(link);
  return NextResponse.json({
    ok: true,
    plan: PLAN_LABELS[safePlan],
    quality: PLAN_QUALITY[safePlan],
    link,
    qr,
    source,
    remaining: DAILY_LIMIT - used - 1,
  });
};
