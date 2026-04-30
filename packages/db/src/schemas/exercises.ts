import { pgTable, integer, varchar, timestamp, primaryKey, uniqueIndex, index, customType } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel, sql } from 'drizzle-orm';

export const exercisesTable = pgTable('exercises', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 2056 }).notNull(),
  description: varchar({ length: 2056 }),
  updatedAt: timestamp().defaultNow(),
  searchVector: customType<{ data: string }>({
    dataType() { return 'tsvector'; },
  })('search_vector').generatedAlwaysAs(
    sql`to_tsvector('english', "name" || ' ' || COALESCE("description", ''))`
  ),
}, (t) => ({
  nameIdx: uniqueIndex('exercises_name_idx').on(t.name),
  searchIdx: index('exercises_search_idx').using('gin', t.searchVector),
}));

export const exerciseRelationsTable = pgTable(
  'exercise_relations',
  {
    fromExerciseId: integer().notNull().references(() => exercisesTable.id, { onDelete: 'cascade' }),
    toExerciseId: integer().notNull().references(() => exercisesTable.id, { onDelete: 'cascade' }),
    relationType: varchar({ length: 2056 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.fromExerciseId, t.toExerciseId, t.relationType] }),
  })
);

export type Exercise = InferSelectModel<typeof exercisesTable>;
export type NewExercise = InferInsertModel<typeof exercisesTable>;