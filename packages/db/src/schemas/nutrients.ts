import { pgTable, integer, varchar, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';

export const nutrientsTable = pgTable('nutrients', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 2056 }).notNull(),
  unit: varchar({ length: 2056 }).notNull(),
}, (t) => ({
  nameUnitIdx: uniqueIndex('nutrients_name_unit_idx').on(t.name, t.unit),
}));

export const foodNutrientsTable = pgTable(
  'food_nutrients',
  {
    foodId: integer().notNull(),
    nutrientId: integer().notNull(),
    value: varchar({ length: 2056 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.foodId, t.nutrientId] }),
  })
);
