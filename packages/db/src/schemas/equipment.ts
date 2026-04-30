import { pgTable, integer, varchar, timestamp, primaryKey, boolean } from 'drizzle-orm/pg-core';

export const equipmentTable = pgTable('equipment', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 2056 }).notNull(),
  description: varchar({ length: 2056 }),
  category: varchar({ length: 2056 }),
  isMachine: boolean().default(false),
  updatedAt: timestamp().defaultNow(),
});

export const exerciseEquipmentTable = pgTable(
  'exercise_equipment',
  {
    exerciseId: integer().notNull(),
    equipmentId: integer().notNull(),
    notes: varchar({ length: 2056 }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.exerciseId, t.equipmentId] }),
  })
);
