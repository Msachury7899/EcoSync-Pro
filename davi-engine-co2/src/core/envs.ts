import { config } from 'dotenv';
import { resolve } from 'path';
import { get } from 'env-var';

config({ path: resolve(__dirname, `.env`) });

export const envs = {
    NODE_ENV: get('NODE_ENV').default('local').asEnum(['local', 'dev', 'qa', 'production', 'test']),
    PORT: get('PORT').required().asPortNumber(),
    DATABASE_URL: get('DATABASE_URL').required().asString(),
    CORS_ORIGINS: get('CORS_ORIGINS').default('http://localhost:5000').asArray(','),
}