import postgres from 'postgres';
import { config } from 'dotenv';
config();

const url = process.env.DATABASE_URL;

if (!url) { console.error('NO URL'); process.exit(1); }
console.log('Connecting to URL:', url.replace(/:[^:]+@/, ':***@'));
try {
  const sql = postgres(url, { max: 1, idle_timeout: 10, connect_timeout: 5 });
  const test = await sql`SELECT 1`;
  console.log('OK', test);
  process.exit(0);
} catch (e) {
  console.error('ERROR', e);
  process.exit(1);
}
