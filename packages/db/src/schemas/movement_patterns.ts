import { pgTable, integer, varchar, uniqueIndex, index, customType } from 'drizzle-orm/pg-core';
import { exercisesTable } from './exercises';

export const movementPatternsTable = pgTable('movement_patterns', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 2056 }).notNull(),
}, (t) => ({
  nameIdx: uniqueIndex('movement_patterns_name_idx').on(t.name),
}));

export const exerciseMovementPatternsTable = pgTable(
  'exercise_movement_patterns',
  {
    exerciseId: integer().notNull().references(() => exercisesTable.id, { onDelete: 'cascade' }),
    movementPatternId: integer().notNull().references(() => movementPatternsTable.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: index('exercise_movement_patterns_pk').on(t.exerciseId, t.movementPatternId),
  })
);