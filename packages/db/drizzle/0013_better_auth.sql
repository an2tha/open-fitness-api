-- Migration: Add better-auth tables for user authentication
-- Run this to enable better-auth with email/password sign up and sign in

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "name" varchar(255),
  "email" varchar(255) NOT NULL UNIQUE,
  "email_verified" boolean DEFAULT false NOT NULL,
  "image" varchar(500),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Sessions table for auth sessions
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" text PRIMARY KEY,
  "expires_at" timestamp,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "ip_address" varchar(45),
  "user_agent" text,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE
);

-- Verifications table for email verification, password reset, etc.
CREATE TABLE IF NOT EXISTS "verifications" (
  "id" text PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp,
  "target" text NOT NULL,
  "target_type" text NOT NULL,
  "secret" text
);

-- Accounts table for OAuth providers
CREATE TABLE IF NOT EXISTS "accounts" (
  "id" text PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for better-auth tables
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts"("user_id");