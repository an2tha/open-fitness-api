import { pgTable, integer, varchar, timestamp, boolean, index, jsonb } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

export const apiKeysTable = pgTable(
  'api_keys',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    /** A short non-secret prefix (first 8 chars) so admins can identify keys without exposing the secret */
    keyPrefix: varchar('key_prefix', { length: 16 }).notNull(),
    /** SHA-256 hash of the full API key – the plaintext is NEVER stored */
    keyHash: varchar('key_hash', { length: 128 }).notNull().unique(),
    /** Human-readable label, e.g. "mobile-app-prod" */
    name: varchar({ length: 256 }).notNull(),
    /** Owner identifier (email, user-id, org name, etc.) */
    owner: varchar({ length: 256 }).notNull(),
    /** Scopes this key is allowed to use. NULL = all scopes */
    scopes: jsonb('scopes').$type<string[] | null>().default(null),
    /** Per-key rate limit override (requests per window). NULL = use global default */
    rateLimitMax: integer('rate_limit_max'),
    /** Per-key rate limit window in seconds. NULL = use global default */
    rateLimitWindowSecs: integer('rate_limit_window_secs'),
    /** Total number of requests made with this key (updated async) */
    requestCount: integer('request_count').notNull().default(0),
    /** Last time this key was used */
    lastUsedAt: timestamp('last_used_at'),
    /** Optional expiration date – NULL means the key never expires */
    expiresAt: timestamp('expires_at'),
    /** Soft-revoke flag */
    revoked: boolean().notNull().default(false),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    hashIdx: index('api_keys_hash_idx').on(t.keyHash),
    prefixIdx: index('api_keys_prefix_idx').on(t.keyPrefix),
    ownerIdx: index('api_keys_owner_idx').on(t.owner),
  }),
);

export type ApiKey = InferSelectModel<typeof apiKeysTable>;
export type NewApiKey = InferInsertModel<typeof apiKeysTable>;
