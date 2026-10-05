import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSONFilePreset } from 'lowdb/node';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const emptyData = {
  users: [],
  products: [],
  orders: [],
  messages: [],
  newsletter: []
};

export async function createDatabase() {
  // Local development: use the existing db.json
  if (!process.env.DATABASE_URL) {
    return await JSONFilePreset(
      path.join(__dirname, 'data', 'db.json'),
      emptyData
    );
  }

  // Render / production: use PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dreamgrind_state (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )
  `);

  const result = await pool.query(
    'SELECT value FROM dreamgrind_state WHERE key = $1',
    ['main']
  );

  let data;

  if (result.rows.length === 0) {
    data = structuredClone(emptyData);

    await pool.query(
      'INSERT INTO dreamgrind_state (key, value) VALUES ($1, $2)',
      ['main', JSON.stringify(data)]
    );
  } else {
    data = {
      ...emptyData,
      ...result.rows[0].value
    };
  }

  return {
    data,

    async write() {
      await pool.query(
        'UPDATE dreamgrind_state SET value = $1 WHERE key = $2',
        [JSON.stringify(this.data), 'main']
      );
    }
  };
}
   
      