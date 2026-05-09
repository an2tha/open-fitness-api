import { sql } from 'drizzle-orm';
import { db } from './db';
import { appSettingsTable } from '@repo/db/src/schema';

export type AppSettings = {
  allowNewLogins: boolean;
  [key: string]: unknown;
};

const DEFAULT_SETTINGS: AppSettings = {
  allowNewLogins: true,
};

let ensurePromise: Promise<void> | null = null;

export async function ensureAppSettingsTable() {
  if (!ensurePromise) {
    ensurePromise = db
      .execute(
        sql`
      CREATE TABLE IF NOT EXISTS "app_settings" (
        "key" text PRIMARY KEY NOT NULL,
        "value" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `,
      )
      .then(() => undefined);
  }

  return ensurePromise;
}

export async function readAllAppSettings() {
  await ensureAppSettingsTable();

  const rows = await db.select().from(appSettingsTable);
  const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS };

  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return settings as AppSettings;
}

export async function readPublicAppSettings() {
  const settings = await readAllAppSettings();
  return {
    allowNewLogins: settings.allowNewLogins !== false,
  };
}

export async function setAppSetting(key: string, value: unknown) {
  await ensureAppSettingsTable();

  await db
    .insert(appSettingsTable)
    .values({
      key,
      value,
    })
    .onConflictDoUpdate({
      target: appSettingsTable.key,
      set: {
        value,
        updatedAt: sql`now()`,
      },
    });
}
