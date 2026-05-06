import { pgTable, integer, varchar, index } from 'drizzle-orm/pg-core';

export const nutrientsNormalizedMappingTable = pgTable(
  'nutrients_normalized_mapping',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    originalNutrientId: integer().notNull(),
    normalizedNutrientId: integer().notNull(),
    originalName: varchar({ length: 2056 }).notNull(),
    normalizedName: varchar({ length: 2056 }).notNull(),
  },
  (t) => ({
    // Each original nutrient maps to exactly one normalized nutrient.
    // Many originals can map to the same normalized nutrient (many-to-one).
    originalIdx: index('nutrients_normalized_mapping_original_idx').on(t.originalNutrientId),
  }),
);
