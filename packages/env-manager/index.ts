import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

config({
  path: fileURLToPath(new URL('../../.env', import.meta.url)),
  quiet: true,
});

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.string().regex(/^\d+$/, 'API_PORT must be a number').default('3000'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    API_PREFIX: z.string().default('/api/v1'),
    REQUEST_ID_HEADER: z.string().default('x-request-id'),
    RATE_LIMIT_ENABLED: z
      .string()
      .default('true')
      .transform((v) => v === 'true'),
    RATE_LIMIT_WINDOW: z.string().default('1m'),
    RATE_LIMIT_MAX: z.string().regex(/^\d+$/, 'RATE_LIMIT_MAX must be a number').default('10000'),
    CORS_ORIGIN: z.string().default('*'),
    CORS_METHODS: z.string().default('GET,POST,PUT,DELETE,PATCH,OPTIONS'),
    CORS_HEADERS: z.string().default('Content-Type,Authorization,x-request-id,X-API-Key'),
    SWAGGER_ENABLED: z.string().default('true'),
    API_URL: z.string().default('http://localhost:3000/api/v1'),
    BETTER_AUTH_URL: z.string().default('http://localhost:3000/api/v1'),
    BETTER_AUTH_SECRET: z.string().optional(),
    LOADER_DB_URL: z.string().default(process.env.DATABASE_URL ?? ''),
    API_KEY_AUTH_ENABLED: z.string().default('true'),
    SIGNUPS_DISABLED: z
      .string()
      .default('true')
      .transform((v) => v.trim().toLowerCase() === 'true'),
    API_ONLY: z
      .string()
      .default('true')
      .transform((v) => v.trim().toLowerCase() === 'true'),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production' && !value.API_ONLY && !value.BETTER_AUTH_SECRET?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BETTER_AUTH_SECRET'],
        message: 'BETTER_AUTH_SECRET is required in production',
      });
    }
  });

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid environment variables:');
  console.error(_env.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _env.data;
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
