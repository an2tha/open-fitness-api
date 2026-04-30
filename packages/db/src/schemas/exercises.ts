import { pgTable, integer, varchar, timestamp, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

export const exercisesTable = pgTable('exercises', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 2056 }).notNull(),
  description: varchar({ length: 2056 }),
  updatedAt: timestamp().defaultNow(),
}, (t) => ({
  nameIdx: uniqueIndex('exercises_name_idx').on(t.name),
}));

export const exerciseRelationsTable = pgTable(
  'exercise_relations',
  {
    fromExerciseId: integer().notNull(),
    toExerciseId: integer().notNull(),
    relationType: varchar({ length: 2056 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.fromExerciseId, t.toExerciseId, t.relationType] }),
  })
);

export type Exercise = InferSelectModel<typeof exercisesTable>;
export type NewExercise = InferInsertModel<typeof exercisesTable>;
