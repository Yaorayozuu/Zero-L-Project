import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production-min-32-chars!!');

export const signToken = async (payload) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
};

export const verifyToken = async (token) => {
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
  return verifyToken(token);
};
