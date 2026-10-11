// Verifikasi kode akses + sesi berbasis cookie bertanda tangan (JWT).
// Tanpa database — kode akses dibaca dari env ACCESS_CODES.

import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'change-me-in-production-min-32-chars!!'
);

// Kode akses dari env, format: "KODE1,KODE2,KODE3" (koma). Trim + buang kosong.
export const getAccessCodes = () => {
  const raw = process.env.ACCESS_CODES || '';
  return raw
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
};

// Cek kode valid (case-sensitive biar aman).
export const isValidCode = (code) => {
  if (!code) return false;
  return getAccessCodes().includes(String(code).trim());
};

// Sesi = JWT berisi label kode (bukan kodenya langsung, biar gak kebocor).
export const signSession = async (label) => {
  return new SignJWT({ code: label })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
};

export const verifySession = async (token) => {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
};

export const getSession = async (cookies) => {
  const token = cookies.get('session')?.value;
  if (!token) return null;
  return verifySession(token);
};
