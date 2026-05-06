import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '@repo/db';
import { usersTable, sessionsTable, verificationsTable, accountsTable } from '@repo/db/src/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    type: 'postgres',
    schema: {
      users: usersTable,
      sessions: sessionsTable,
      verifications: verificationsTable,
      accounts: accountsTable,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  trustedOrigins: process.env.NODE_ENV === 'production'
    ? [process.env.CORS_ORIGIN || 'https://openfitdata.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
});

// Type cast to access API methods that exist at runtime
const authApi = auth.api as {
  signUp: (options: { body: { email: string; password: string; name?: string }; headers: Headers }) => Promise<{ user: { id: string; email: string; name: string | null; image: string | null; createdAt?: Date } }>;
  signIn: (options: { body: { email: string; password: string }; headers: Headers }) => Promise<{ user: { id: string; email: string; name: string | null; image: string | null; createdAt?: Date }; token: string; expiresAt?: Date } | null>;
  signOut: (options: { headers: Headers }) => Promise<void>;
  getSession: (options: { headers: Headers }) => Promise<{ user: { id: string; email: string; name: string | null; image: string | null; createdAt?: Date }; session: { token: string; expiresAt?: Date } } | null>;
};

export { authApi };
export const authHandler = auth.handler;