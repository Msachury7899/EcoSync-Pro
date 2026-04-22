import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { envs } from '@core/envs';
import * as schema from './schema';

// Singleton connection — shared across all repositories to avoid
// lambda cold-start overhead of multiple connections.
const sql = postgres(envs.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

export const db = drizzle(sql, { schema });

export type DrizzleDb = typeof db;
