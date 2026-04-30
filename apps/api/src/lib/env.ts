import { config } from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

config({ 
  path: path.resolve(import.meta.dirname, '../../../../.env'),
  quiet: true 
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  API_PREFIX: z.string().default('/api/v1'),
  REQUEST_ID_HEADER: z.string().default('x-request-id'),
  RATE_LIMIT_WINDOW: z.string().default('1m'),
  RATE_LIMIT_MAX: z.string().default('100'),
  CORS_ORIGIN: z.string().default('*'),
  CORS_METHODS: z.string().default('GET,POST,PUT,DELETE,PATCH,OPTIONS'),
  CORS_HEADERS: z.string().default('Content-Type,Authorization,x-request-id'),
  SWAGGER_ENABLED: z.string().default('true'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_env.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _env.data;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';