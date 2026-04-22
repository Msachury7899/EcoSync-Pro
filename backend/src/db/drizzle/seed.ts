import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { ulid } from 'ulid';

import { eq, and } from 'drizzle-orm';
import { envs } from '@core/envs';

const databaseUrl = envs.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const sql = postgres(databaseUrl, { max: 1 });
const db = drizzle(sql);

async function main() {

}

main().catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
});
