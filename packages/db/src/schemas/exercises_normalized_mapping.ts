import { pgTable, integer, varchar, uniqueIndex } from 'drizzle-orm/pg-core';

export const exercisesNormalizedMappingTable = pgTable(
  'exercises_normalized_mapping',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    originalExerciseId: integer().notNull(),
    normalizedExerciseId: integer().notNull(),
    originalName: varchar({ length: 2056 }).notNull(),
    normalizedName: varchar({ length: 2056 }).notNull(),
  },
  (t) => ({
    originalIdx: uniqueIndex('exercises_normalized_mapping_original_idx').on(t.originalExerciseId),
  }),
);
