import { Pool } from '@vercel/postgres';

export const pool = new Pool();

export const sql = async (strings, ...values) => {
  const client = await pool.connect();
  try {
    const text = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
    const { rows } = await client.query(text);
    return rows;
  } finally {
    client.release();
  }
};

export const initDb = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS generations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      plan TEXT NOT NULL,
      netflix_link TEXT NOT NULL,
      cookies TEXT,
      quality TEXT,
      country TEXT,
      expires_at TIMESTAMPTZ,
      source TEXT NOT NULL DEFAULT 'fresh',
      consumed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS daily_usage (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      count INTEGER DEFAULT 0,
      UNIQUE(user_id, date)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS worker_runs (
      id SERIAL PRIMARY KEY,
      plan TEXT NOT NULL,
      status TEXT NOT NULL,
      link TEXT,
      error TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
};

export const createUser = async (username, passwordHash) => {
  const rows = await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    ON CONFLICT (username) DO NOTHING
    RETURNING id, username, created_at
  `;
  return rows[0] || null;
};

export const getUser = async (username) => {
  const rows = await sql`SELECT id, username, password_hash, created_at FROM users WHERE username = $1`;
  return rows[0] || null;
};

export const addGeneration = async ({ userId, plan, netflixLink, cookies, quality, country, expiresAt, source }) => {
  const rows = await sql`
    INSERT INTO generations (user_id, plan, netflix_link, cookies, quality, country, expires_at, source)
    VALUES (${userId}, ${plan}, ${netflixLink}, ${cookies || null}, ${quality || null}, ${country || null}, ${expiresAt || null}, ${source})
    RETURNING id, created_at
  `;
  return rows[0];
};

export const getDailyCount = async (userId, date) => {
  const rows = await sql`SELECT count FROM daily_usage WHERE user_id = $1 AND date = $2`;
  return rows[0]?.count || 0;
};

export const incrementUsage = async (userId, date) => {
  await sql`
    INSERT INTO daily_usage (user_id, date, count) VALUES (${userId}, ${date}, 1)
    ON CONFLICT (user_id, date) DO UPDATE SET count = daily_usage.count + 1
  `;
};

export const getFreePool = async (plan, limit = 10) => {
  return await sql`
    SELECT id, netflix_link, cookies, quality, country, expires_at
    FROM generations
    WHERE plan = $1 AND consumed = FALSE AND source = 'worker'
    ORDER BY created_at ASC
    LIMIT $2
  `, limit;
};

export const consumePool = async (id) => {
  await sql`UPDATE generations SET consumed = TRUE WHERE id = $1`;
};

export const getUserHistory = async (userId, limit = 20) => {
  return await sql`
    SELECT plan, netflix_link, quality, country, source, consumed, created_at
    FROM generations
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `, limit;
};

export const logWorkerRun = async ({ plan, status, link, error }) => {
  await sql`
    INSERT INTO worker_runs (plan, status, link, error)
    VALUES (${plan}, ${status}, ${link || null}, ${error || null})
  `;
};

export const getPoolStats = async () => {
  const rows = await sql`
    SELECT plan, COUNT(*) FILTER (WHERE consumed = FALSE) as available, COUNT(*) FILTER (WHERE consumed = TRUE) as consumed
    FROM generations
    WHERE source = 'worker'
    GROUP BY plan
  `;
  return rows;
};
