import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

import type { QueryResultRow } from 'pg';

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) {
  const res = await pool.query<T>(text, params);
  return res;
}