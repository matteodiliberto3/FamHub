import 'dotenv/config';
import fs from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;

async function applyRls() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing in environment');
  }

  const sql = await fs.readFile(new URL('./rls.sql', import.meta.url), 'utf8');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query(sql);
    console.log('RLS policies applied successfully.');
  } finally {
    await pool.end();
  }
}

applyRls().catch((error) => {
  console.error('Failed to apply RLS policies:', error.message);
  process.exitCode = 1;
});
