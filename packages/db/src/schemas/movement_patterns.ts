import { pgTable, integer, varchar, primaryKey } from 'drizzle-orm/pg-core';

export const movementPatternsTable = pgTable('movement_patterns', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 2056 }).notNull(),
});

export const exerciseMovementPatternsTable = pgTable(
  'exercise_movement_patterns',
  {
    exerciseId: integer().notNull(),
    movementPatternId: integer().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.exerciseId, t.movementPatternId] }),
  })
);
