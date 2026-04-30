import { pgTable, integer, varchar, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';

export const nutrientsNormalizedTable = pgTable('nutrients_normalized', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 2056 }).notNull(),
  unit: varchar({ length: 2056 }).notNull(),
}, (t) => ({
  nameUnitIdx: uniqueIndex('nutrients_normalized_name_unit_idx').on(t.name, t.unit),
}));

export const foodNutrientsNormalizedTable = pgTable(
  'food_nutrients_normalized',
  {
    foodId: integer().notNull(),
    nutrientId: integer().notNull(),
    value: varchar({ length: 2056 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.foodId, t.nutrientId] }),
  })
);