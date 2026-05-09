import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from '@repo/env-manager';
import { db, authSchema } from '@repo/db';
import { apiKey } from '@better-auth/api-key';

const authBaseUrl = new URL('auth', `${env.BETTER_AUTH_URL.replace(/\/$/, '')}/`).toString();

export const auth = betterAuth({
  baseURL: authBaseUrl,
  logger: {
    disabled: env.NODE_ENV === 'production',
    disableColors: env.NODE_ENV === 'production',
    level: env.NODE_ENV === 'production' ? 'error' : 'debug',
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [apiKey()],
  socialProviders: {},
});
