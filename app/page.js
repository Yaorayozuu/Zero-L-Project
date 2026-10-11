'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth').then(async (r) => {
      const d = await r.json();
      if (d.ok && d.user) router.push('/dashboard');
    });
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: mode === 'login' ? 'POST' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { username, password } : { username, password }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      if (mode === 'signup') {
        setMode('login');
        setError('');
        alert('Akun dibuat. Silakan login.');
      } else {
        router.push('/dashboard');
      }
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
        <p style={styles.subtitle}>Login buat generate QR Aroshi</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password (min 6 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Login' : 'Daftar'}
          </button>
        </form>
        <p style={styles.switch}>
          {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button
            style={styles.link}
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Daftar' : 'Login'}
          </button>
        </p>
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
  title: {
    color: '#fff',
    margin: '0 0 8px',
    fontSize: 26,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    margin: '0 0 24px',
    textAlign: 'center',
    fontSize: 14,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: '12px 14px',
    color: '#fff',
    fontSize: 15,
    outline: 'none',
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
  error: { color: '#ff6b6b', fontSize: 13, margin: 0 },
  switch: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginTop: 18, margin: 0 },
  link: { background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, padding: 0 },
};
