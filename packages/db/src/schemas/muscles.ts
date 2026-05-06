import { pgTable, integer, varchar, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { exercisesTable } from './exercises';

export const musclesTable = pgTable(
  'muscles',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 2056 }).notNull(),
    group: varchar({ length: 2056 }),
  },
  (t) => ({
    nameIdx: index('muscles_name_idx').on(t.name),
  }),
);

export const exerciseMusclesTable = pgTable(
  'exercise_muscles',
  {
    exerciseId: integer()
      .notNull()
      .references(() => exercisesTable.id, { onDelete: 'cascade' }),
    muscleId: integer()
      .notNull()
      .references(() => musclesTable.id, { onDelete: 'cascade' }),
    role: varchar({ length: 2056 }).notNull(),
  },
  (t) => ({
    pk: index('exercise_muscles_pk').on(t.exerciseId, t.muscleId, t.role),
  }),
);
