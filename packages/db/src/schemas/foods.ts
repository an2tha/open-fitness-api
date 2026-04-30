import { pgTable, integer, varchar, timestamp, index, customType } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel, sql } from 'drizzle-orm';

export const foodsTable = pgTable('foods', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  externalId: varchar({ length: 2056 }),
  dataSource: varchar({ length: 2056 }).notNull(),
  name: varchar({ length: 2056 }).notNull(),
  brand: varchar({ length: 2056 }),
  category: varchar({ length: 2056 }),
  servingSize: varchar({ length: 2056 }),
  servingUnit: varchar({ length: 2056 }),
  updatedAt: timestamp().defaultNow(),
  calories: varchar({ length: 2056 }).default('0'),
  protein: varchar({ length: 2056 }).default('0'),
  fat: varchar({ length: 2056 }).default('0'),
  carbohydrates: varchar({ length: 2056 }).default('0'),
  fiber: varchar({ length: 2056 }).default('0'),
  sugar: varchar({ length: 2056 }).default('0'),
  sodium: varchar({ length: 2056 }).default('0'),
  searchVector: customType<{ data: string }>({
    dataType() { return 'tsvector'; },
  })('search_vector').generatedAlwaysAs(
    sql`to_tsvector('english', "name" || ' ' || COALESCE("brand", ''))`
  ),
}, (t) => ({
  searchIdx: index('foods_search_idx').using('gin', t.searchVector),
  nameTrgmIdx: index('foods_name_trgm_idx').using('gin', t.name.op('gin_trgm_ops')),
}));

export type Food = InferSelectModel<typeof foodsTable>;
export type NewFood = InferInsertModel<typeof foodsTable>;