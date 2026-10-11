import bcrypt from 'bcryptjs';

const { hash, compare } = bcrypt;

export const hashPassword = async (password) => {
  return hash(password, 12);
};

export const verifyPassword = async (password, hashStr) => {
  return compare(password, hashStr);
};

export const PLAN_LABELS = {
  basic: 'Basic',
  medium: 'Standard',
  premium: 'Premium',
};

export const PLAN_QUALITY = {
  basic: 'SD 720p',
  medium: 'Full HD 1080p',
  premium: '4K Ultra HD',
};

export const DAILY_LIMIT = 3;
