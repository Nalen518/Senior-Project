'use strict';

// New database: creates all tables from src/models/schema.sql.
// Existing database: applies src/models/upgrade.sql, which is safe to run any number of times.
// Usage: npm run db:migrate

const fs = require('node:fs');
const path = require('node:path');

const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const { loadConfig } = require('../src/config/env');
const { createPool } = require('../src/db/pool');

async function main() {
  const pool = createPool(loadConfig());
  const client = await pool.connect(); // one connection, so BEGIN/COMMIT cover every query
  try {
    const { rows } = await client.query("SELECT to_regclass('public.users') AS existing");
    const exists = Boolean(rows[0].existing);
    const sql = fs.readFileSync(path.join(__dirname, '..', 'src', 'models', exists ? 'upgrade.sql' : 'schema.sql'), 'utf8');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(exists ? 'Schema up to date. If resources changed, run npm run db:seed-safety.' : 'Schema created.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
