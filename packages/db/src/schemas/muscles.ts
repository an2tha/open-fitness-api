import { pgTable, integer, varchar, primaryKey } from 'drizzle-orm/pg-core';

export const musclesTable = pgTable('muscles', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 2056 }).notNull(),
  group: varchar({ length: 2056 }),
});

export const exerciseMusclesTable = pgTable(
  'exercise_muscles',
  {
    exerciseId: integer().notNull(),
    muscleId: integer().notNull(),
    role: varchar({ length: 2056 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.exerciseId, t.muscleId, t.role] }),
  })
);
