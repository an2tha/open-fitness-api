import { pgTable, unique, integer, varchar, uniqueIndex, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const nutrientsNormalized = pgTable("nutrients_normalized", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "nutrients_normalized_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
	unit: varchar({ length: 2056 }).notNull(),
}, (table) => [
	unique("nutrients_normalized_name_unique").on(table.name),
]);

export const nutrientsNormalizedMapping = pgTable("nutrients_normalized_mapping", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "nutrients_normalized_mapping_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	originalNutrientId: integer().notNull(),
	normalizedNutrientId: integer().notNull(),
	originalName: varchar({ length: 2056 }).notNull(),
	normalizedName: varchar({ length: 2056 }).notNull(),
}, (table) => [
	uniqueIndex("nutrients_normalized_mapping_original_idx").using("btree", table.originalNutrientId.asc().nullsLast().op("int4_ops")),
]);

export const exercises = pgTable("exercises", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "exercises_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
	description: varchar({ length: 2056 }),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
});

export const foods = pgTable("foods", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "foods_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	externalId: varchar({ length: 2056 }),
	dataSource: varchar({ length: 2056 }).notNull(),
	name: varchar({ length: 2056 }).notNull(),
	brand: varchar({ length: 2056 }),
	category: varchar({ length: 2056 }),
	servingSize: varchar({ length: 2056 }),
	servingUnit: varchar({ length: 2056 }),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
	calories: varchar({ length: 2056 }).default('0'),
	protein: varchar({ length: 2056 }).default('0'),
	fat: varchar({ length: 2056 }).default('0'),
	carbohydrates: varchar({ length: 2056 }).default('0'),
	fiber: varchar({ length: 2056 }).default('0'),
	sugar: varchar({ length: 2056 }).default('0'),
	sodium: varchar({ length: 2056 }).default('0'),
});

export const exercisesNormalized = pgTable("exercises_normalized", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "exercises_normalized_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
	description: varchar({ length: 2056 }),
}, (table) => [
	unique("exercises_normalized_name_unique").on(table.name),
]);

export const exercisesNormalizedMapping = pgTable("exercises_normalized_mapping", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "exercises_normalized_mapping_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	originalExerciseId: integer().notNull(),
	normalizedExerciseId: integer().notNull(),
	originalName: varchar({ length: 2056 }).notNull(),
	normalizedName: varchar({ length: 2056 }).notNull(),
}, (table) => [
	uniqueIndex("exercises_normalized_mapping_original_idx").using("btree", table.originalExerciseId.asc().nullsLast().op("int4_ops")),
]);

export const equipment = pgTable("equipment", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "equipment_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
	category: varchar({ length: 2056 }),
	description: varchar({ length: 2056 }),
	isMachine: boolean().default(false),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
});

export const movementPatterns = pgTable("movement_patterns", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "movement_patterns_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
});

export const muscles = pgTable("muscles", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "muscles_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
	group: varchar({ length: 2056 }),
});

export const nutrients = pgTable("nutrients", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "nutrients_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
	unit: varchar({ length: 2056 }).notNull(),
});

export const ingredients = pgTable("ingredients", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "ingredients_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
});

export const supplements = pgTable("supplements", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "supplements_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	externalId: varchar({ length: 2056 }),
	dataSource: varchar({ length: 2056 }).notNull(),
	name: varchar({ length: 2056 }).notNull(),
	brand: varchar({ length: 2056 }),
	category: varchar({ length: 2056 }),
	servingSize: varchar({ length: 2056 }),
	servingUnit: varchar({ length: 2056 }),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
});

export const exerciseMovementPatterns = pgTable("exercise_movement_patterns", {
	exerciseId: integer().notNull(),
	movementPatternId: integer().notNull(),
}, (table) => [
	primaryKey({ columns: [table.movementPatternId, table.exerciseId], name: "exercise_movement_patterns_exerciseId_movementPatternId_pk"}),
]);

export const foodNutrientsNormalized = pgTable("food_nutrients_normalized", {
	foodId: integer().notNull(),
	nutrientId: integer().notNull(),
	value: varchar({ length: 2056 }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.nutrientId, table.foodId], name: "food_nutrients_normalized_foodId_nutrientId_pk"}),
]);

export const exerciseRelationsNormalized = pgTable("exercise_relations_normalized", {
	fromExerciseId: integer().notNull(),
	toExerciseId: integer().notNull(),
	relationType: varchar({ length: 2056 }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.toExerciseId, table.relationType, table.fromExerciseId], name: "exercise_relations_normalized_fromExerciseId_toExerciseId_relat"}),
]);

export const exerciseRelations = pgTable("exercise_relations", {
	fromExerciseId: integer().notNull(),
	toExerciseId: integer().notNull(),
	relationType: varchar({ length: 2056 }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.toExerciseId, table.relationType, table.fromExerciseId], name: "exercise_relations_fromExerciseId_toExerciseId_relationType_pk"}),
]);

export const exerciseEquipment = pgTable("exercise_equipment", {
	exerciseId: integer().notNull(),
	equipmentId: integer().notNull(),
	notes: varchar({ length: 2056 }),
}, (table) => [
	primaryKey({ columns: [table.exerciseId, table.equipmentId], name: "exercise_equipment_exerciseId_equipmentId_pk"}),
]);

export const foodNutrients = pgTable("food_nutrients", {
	foodId: integer().notNull(),
	nutrientId: integer().notNull(),
	value: varchar({ length: 2056 }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.nutrientId, table.foodId], name: "food_nutrients_foodId_nutrientId_pk"}),
]);

export const exerciseMuscles = pgTable("exercise_muscles", {
	exerciseId: integer().notNull(),
	muscleId: integer().notNull(),
	role: varchar({ length: 2056 }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.role, table.muscleId, table.exerciseId], name: "exercise_muscles_exerciseId_muscleId_role_pk"}),
]);

export const supplementIngredients = pgTable("supplement_ingredients", {
	supplementId: integer().notNull(),
	ingredientId: integer().notNull(),
	amount: varchar({ length: 2056 }),
}, (table) => [
	primaryKey({ columns: [table.supplementId, table.ingredientId], name: "supplement_ingredients_supplementId_ingredientId_pk"}),
]);
