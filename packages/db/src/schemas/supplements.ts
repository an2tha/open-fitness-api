import { pgTable, integer, varchar, timestamp, primaryKey, index, customType } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel, sql } from 'drizzle-orm';

export const supplementsTable = pgTable('supplements', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  externalId: varchar({ length: 2056 }),
  dataSource: varchar({ length: 2056 }).notNull(),
  name: varchar({ length: 2056 }).notNull(),
  brand: varchar({ length: 2056 }),
  category: varchar({ length: 2056 }),
  servingSize: varchar({ length: 2056 }),
  servingUnit: varchar({ length: 2056 }),
  updatedAt: timestamp().defaultNow(),
  searchVector: customType<{ data: string }>({
    dataType() { return 'tsvector'; },
  })('search_vector').generatedAlwaysAs(
    sql`to_tsvector('english', "name" || ' ' || COALESCE("brand", ''))`
  ),
}, (t) => ({
  searchIdx: index('supplements_search_idx').using('gin', t.searchVector),
  nameTrgmIdx: index('supplements_name_trgm_idx').using('gin', t.name.op('gin_trgm_ops')),
}));

export const ingredientsTable = pgTable('ingredients', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 2056 }).notNull(),
});

export const supplementIngredientsTable = pgTable(
  'supplement_ingredients',
  {
    supplementId: integer().notNull(),
    ingredientId: integer().notNull(),
    amount: varchar({ length: 2056 }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.supplementId, t.ingredientId] }),
  })
);

export const prohibitedSubstancesTable = pgTable('prohibited_substances', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 2056 }).notNull(),
  category: varchar({ length: 2056 }),
  notes: varchar({ length: 2056 }),
});

export type Supplement = InferSelectModel<typeof supplementsTable>;
export type NewSupplement = InferInsertModel<typeof supplementsTable>;

export type Ingredient = InferSelectModel<typeof ingredientsTable>;
export type NewIngredient = InferInsertModel<typeof ingredientsTable>;
