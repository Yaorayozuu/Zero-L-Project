'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PLANS = [
  { key: 'basic', name: 'Basic', quality: 'SD 720p', color: '#1e8e3e' },
  { key: 'medium', name: 'Standard', quality: 'Full HD 1080p', color: '#f9ab00' },
  { key: 'premium', name: 'Premium', quality: '4K Ultra HD', color: '#e50914' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [label, setLabel] = useState(null);
  const [selected, setSelected] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok || !d.user) return router.push('/');
        setLabel(d.user.label);
      })
      .catch(() => router.push('/'));
  }, [router]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selected }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      setResult(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
  };

  const copyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      alert('Link disalin!');
    } catch {
      alert(link);
    }
  };

  const downloadQr = (dataUrl, plan) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `netflix-qr-${plan}-${Date.now()}.png`;
    a.click();
  };

  if (label === null) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.wrap}>
      <header style={styles.header}>
        <h1 style={styles.title}>Netflix QR Generator</h1>
        <div style={styles.headerRight}>
          <span style={styles.user}>Akses ••••{label}</span>
          <button style={styles.logout} onClick={handleLogout}>Keluar</button>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Generate QR Login</h2>
          <p style={styles.desc}>
            Pilih plan, dapetin link + QR code. Kalo stok fresh habis, sistem otomatis kasih stok yang masih bisa dipake.
          </p>

          <div style={styles.plans}>
            {PLANS.map((p) => (
              <button
                key={p.key}
                style={{ ...styles.planCard, ...(selected === p.key ? styles.planCardSelected : {}), borderColor: p.color }}
                onClick={() => setSelected(p.key)}
              >
                <div style={{ ...styles.planDot, background: p.color }} />
                <div style={styles.planName}>{p.name}</div>
                <div style={styles.planQuality}>{p.quality}</div>
              </button>
            ))}
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
            {loading ? 'Sedang generate...' : 'Generate QR'}
          </button>

          {result && (
            <div style={styles.result}>
              <div style={styles.resultHeader}>
                <span style={{ ...styles.badge, background: result.source === 'fresh' ? '#1e8e3e' : '#5f6368' }}>
                  {result.source === 'fresh' ? 'BARU DIGENERATE' : 'STOK TERSEDIA'}
                </span>
              </div>
              <img src={result.qr} alt="QR" style={styles.qr} />
              <p style={styles.linkText}>{result.link}</p>
              <div style={styles.resultActions}>
                <button style={styles.actionBtn} onClick={() => copyLink(result.link)}>Salin Link</button>
                <button style={styles.actionBtn} onClick={() => downloadQr(result.qr, result.plan)}>Download QR</button>
                <a style={styles.actionBtnLink} href={result.link} target="_blank" rel="noreferrer">Buka Netflix</a>
              </div>
            </div>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Cara Pakai</h2>
          <ol style={styles.steps}>
            <li>Pilih plan (Basic / Standard / Premium).</li>
            <li>Klik <b>Generate QR</b>.</li>
            <li>Klik <b>Buka Netflix</b>, lalu scan QR pakai HP.</li>
            <li>Login langsung tanpa password.</li>
          </ol>
          <p style={styles.note}>
            Catatan: link ini sekali pakai &amp; cepet expired — langsung pakai ya. Refresh halaman = link ilang, jadi
            salin/download dulu.
          </p>
        </section>
      </main>
    </div>
  );
}

const styles = {
  wrap: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
  title: { color: '#fff', margin: 0, fontSize: 20 },
  user: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  logout: { background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 },
  main: { padding: 24, display: 'grid', gap: 24, maxWidth: 760, margin: '0 auto', gridTemplateColumns: '1fr' },
  card: { background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.08)' },
  cardTitle: { color: '#fff', margin: '0 0 12px', fontSize: 18 },
  desc: { color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.5 },
  plans: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, 1fr)' },
  planCard: { background: 'rgba(255,255,255,0.05)', border: '2px solid transparent', borderRadius: 12, padding: 14, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' },
  planCardSelected: { background: 'rgba(255,255,255,0.12)' },
  planDot: { width: 10, height: 10, borderRadius: '50%', margin: '0 auto 8px' },
  planName: { color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 4 },
  planQuality: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  generateBtn: { width: '100%', background: '#e50914', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 20 },
  error: { color: '#ff6b6b', fontSize: 13, margin: '12px 0 0' },
  result: { marginTop: 20, textAlign: 'center' },
  resultHeader: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  badge: { background: '#1e8e3e', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  qr: { width: 220, height: 220, borderRadius: 12, background: '#fff', padding: 8 },
  linkText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, wordBreak: 'break-all', margin: '12px 0', background: 'rgba(0,0,0,0.25)', padding: 10, borderRadius: 8 },
  resultActions: { display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  actionBtn: { background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12 },
  actionBtnLink: { background: '#e50914', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, display: 'inline-block' },
  steps: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.9, margin: 0, paddingLeft: 20 },
  note: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 16, lineHeight: 1.6 },
  loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
};
