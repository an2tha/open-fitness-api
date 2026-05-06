-- Migration: Add better-auth/api-key tables
-- Run this to enable the api-key plugin for authentication

-- API key configurations table
CREATE TABLE IF NOT EXISTS "api_key_configurations" (
  "id" serial PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "default_rate_limit_max" integer,
  "default_time_window" integer,
  "prefix_length" integer,
  "metadata" jsonb,
  "references" varchar(50) DEFAULT 'userId' NOT NULL,
  "storage" varchar(50) DEFAULT 'primary' NOT NULL,
  "fallback_to_database" boolean DEFAULT false NOT NULL,
  "defer_updates" boolean DEFAULT false NOT NULL
);

-- API keys table
CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" serial PRIMARY KEY,
  "config_id" integer NOT NULL REFERENCES "api_key_configurations"("id") ON DELETE CASCADE,
  "name" varchar(255),
  "key" varchar(500) NOT NULL,
  "start" varchar(50),
  "prefix" varchar(50),
  "reference_id" varchar(255) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp,
  "last_refill_at" timestamp,
  "refill_interval" bigint,
  "refill_amount" integer,
  "remaining" integer,
  "enabled" boolean DEFAULT true NOT NULL,
  "metadata" jsonb,
  "permissions" jsonb
);

-- Indexes for better-auth API key tables
CREATE INDEX IF NOT EXISTS "api_keys_config_id_idx" ON "api_keys"("config_id");
CREATE INDEX IF NOT EXISTS "api_keys_reference_id_idx" ON "api_keys"("reference_id");
CREATE INDEX IF NOT EXISTS "api_keys_key_idx" ON "api_keys"("key");