import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const appSettingsTable = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type AppSetting = InferSelectModel<typeof appSettingsTable>;
export type NewAppSetting = InferInsertModel<typeof appSettingsTable>;
