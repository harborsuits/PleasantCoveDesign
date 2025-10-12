/*
  Flush demo/seeded data from Postgres while preserving admins/config
*/
import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  if (process.env.FORCE_FLUSH !== 'true') {
    console.error('Refusing to flush without FORCE_FLUSH=true');
    process.exit(1);
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete in dependency-safe order, limiting to seeded=true where applicable
    await client.query('DELETE FROM project_messages WHERE seeded = TRUE');
    await client.query('DELETE FROM appointments WHERE seeded = TRUE');
    await client.query('DELETE FROM activities WHERE seeded = TRUE');
    await client.query('DELETE FROM projects WHERE seeded = TRUE');
    await client.query('DELETE FROM businesses WHERE seeded = TRUE');
    await client.query('DELETE FROM companies WHERE seeded = TRUE');

    await client.query('COMMIT');

    // Analyze for planner improvements
    await client.query('ANALYZE');

    console.log('✅ Flush complete');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Flush failed:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


