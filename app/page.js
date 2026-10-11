'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccessPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.user) router.push('/dashboard');
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || 'Kode akses salah.');
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>Netflix QR Generator</h1>
        <p style={styles.subtitle}>Masukin kode akses buat lanjut</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="Kode akses"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoFocus
            autoComplete="off"
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? '...' : 'Masuk'}
          </button>
        </form>
        <p style={styles.hint}>Belum punya kode? Minta ke admin.</p>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: 20,
  },
  card: {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 380,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  title: { color: '#fff', margin: '0 0 8px', fontSize: 26, textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.7)', margin: '0 0 24px', textAlign: 'center', fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: '12px 14px',
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    textAlign: 'center',
    letterSpacing: 2,
  },
  button: {
    background: '#e50914',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
  error: { color: '#ff6b6b', fontSize: 13, margin: 0, textAlign: 'center' },
  hint: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginTop: 18, marginBottom: 0 },
};
