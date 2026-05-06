import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '@repo/db';
import { apiKeysTable } from '@repo/db/src/schema';
import { sql } from 'drizzle-orm';

// Use existing `api_keys` table for users (better-auth schema compatible)
// We'll create a separate session table
import { pgTable, serial, varchar, boolean, timestamp, text, integer } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: varchar('image', { length: 500 }),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
});

export const sessionsTable = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at'),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
});

export const verificationsTable = pgTable('verifications', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  expiresAt: timestamp('expires_at'),
  target: text('target').notNull(),
  targetType: text('target_type').notNull(),
  secret: text('secret'),
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: {
      type: 'postgres',
      schema: {
        users: usersTable,
        sessions: sessionsTable,
        verifications: verificationsTable,
      },
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  advanced: {
    generateId: () => {
      return Math.random().toString(36).substring(2, 15);
    },
  },
});

export type Session = typeof auth.$Session;
export type User = typeof auth.$User;