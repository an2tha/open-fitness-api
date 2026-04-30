import { pgTable, integer, varchar, uniqueIndex, index, customType } from 'drizzle-orm/pg-core';
import { exercisesTable } from './exercises';

export const equipmentTable = pgTable('equipment', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 2056 }).notNull(),
  category: varchar({ length: 2056 }),
}, (t) => ({
  nameIdx: uniqueIndex('equipment_name_idx').on(t.name),
}));

export const exerciseEquipmentTable = pgTable(
  'exercise_equipment',
  {
    exerciseId: integer().notNull().references(() => exercisesTable.id, { onDelete: 'cascade' }),
    equipmentId: integer().notNull().references(() => equipmentTable.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: index('exercise_equipment_pk').on(t.exerciseId, t.equipmentId),
  })
);