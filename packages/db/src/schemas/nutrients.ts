import { pgTable, integer, varchar, primaryKey, uniqueIndex, index, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { foodsTable } from './foods';

export const nutrientsTable = pgTable('nutrients', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 2056 }).notNull(),
  unit: varchar({ length: 2056 }).notNull(),
  searchVector: customType<{ data: string }>({
    dataType() { return 'tsvector'; },
  })('search_vector').generatedAlwaysAs(
    sql`to_tsvector('english', "name")`
  ),
}, (t) => ({
  nameUnitIdx: uniqueIndex('nutrients_name_unit_idx').on(t.name, t.unit),
  searchIdx: index('nutrients_search_idx').using('gin', t.searchVector),
}));

export const foodNutrientsTable = pgTable(
  'food_nutrients',
  {
    foodId: integer().notNull().references(() => foodsTable.id, { onDelete: 'cascade' }),
    nutrientId: integer().notNull().references(() => nutrientsTable.id, { onDelete: 'cascade' }),
    value: varchar({ length: 2056 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.foodId, t.nutrientId] }),
  })
);