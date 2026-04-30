import { pgTable, integer, varchar, primaryKey } from 'drizzle-orm/pg-core';

export const exercisesNormalizedTable = pgTable('exercises_normalized', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 2056 }).notNull().unique(),
  description: varchar({ length: 2056 }),
});

export const exerciseRelationsNormalizedTable = pgTable(
  'exercise_relations_normalized',
  {
    fromExerciseId: integer().notNull(),
    toExerciseId: integer().notNull(),
    relationType: varchar({ length: 2056 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.fromExerciseId, t.toExerciseId, t.relationType] }),
  })
);
