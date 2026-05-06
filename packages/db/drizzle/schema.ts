import { pgTable, index, unique, integer, varchar, jsonb, timestamp, boolean, foreignKey, uniqueIndex, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const apiKeys = pgTable("api_keys", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "api_keys_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),
	keyHash: varchar("key_hash", { length: 128 }).notNull(),
	name: varchar({ length: 256 }).notNull(),
	owner: varchar({ length: 256 }).notNull(),
	scopes: jsonb().default(null),
	rateLimitMax: integer("rate_limit_max"),
	rateLimitWindowSecs: integer("rate_limit_window_secs"),
	requestCount: integer("request_count").default(0).notNull(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	revoked: boolean().default(false).notNull(),
	revokedAt: timestamp("revoked_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("api_keys_hash_idx").using("btree", table.keyHash.asc().nullsLast().op("text_ops")),
	index("api_keys_owner_idx").using("btree", table.owner.asc().nullsLast().op("text_ops")),
	index("api_keys_prefix_idx").using("btree", table.keyPrefix.asc().nullsLast().op("text_ops")),
	unique("api_keys_key_hash_unique").on(table.keyHash),
]);

export const exerciseMovementPatterns = pgTable("exercise_movement_patterns", {
	exerciseId: integer().notNull(),
	movementPatternId: integer().notNull(),
}, (table) => [
	index("exercise_movement_patterns_pk").using("btree", table.exerciseId.asc().nullsLast().op("int4_ops"), table.movementPatternId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.exerciseId],
			foreignColumns: [exercises.id],
			name: "exercise_movement_patterns_exerciseId_exercises_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.movementPatternId],
			foreignColumns: [movementPatterns.id],
			name: "exercise_movement_patterns_movementPatternId_movement_patterns_"
		}).onDelete("cascade"),
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

export const exercisesNormalized = pgTable("exercises_normalized", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "exercises_normalized_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
	description: varchar({ length: 2056 }),
}, (table) => [
	unique("exercises_normalized_name_unique").on(table.name),
]);

export const equipment = pgTable("equipment", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "equipment_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
	category: varchar({ length: 2056 }),
}, (table) => [
	uniqueIndex("equipment_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const exercises = pgTable("exercises", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "exercises_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
	description: varchar({ length: 2056 }),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
	// TODO: failed to parse database type 'tsvector'
	searchVector: unknown("search_vector").generatedAlwaysAs(sql`to_tsvector('english'::regconfig, (((name)::text || ' '::text) || (COALESCE(description, ''::character varying))::text))`),
}, (table) => [
	uniqueIndex("exercises_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("exercises_search_idx").using("gin", table.searchVector.asc().nullsLast().op("tsvector_ops")),
]);

export const exerciseMuscles = pgTable("exercise_muscles", {
	exerciseId: integer().notNull(),
	muscleId: integer().notNull(),
	role: varchar({ length: 2056 }).notNull(),
}, (table) => [
	index("exercise_muscles_pk").using("btree", table.exerciseId.asc().nullsLast().op("int4_ops"), table.muscleId.asc().nullsLast().op("int4_ops"), table.role.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.exerciseId],
			foreignColumns: [exercises.id],
			name: "exercise_muscles_exerciseId_exercises_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.muscleId],
			foreignColumns: [muscles.id],
			name: "exercise_muscles_muscleId_muscles_id_fk"
		}).onDelete("cascade"),
]);

export const ingredients = pgTable("ingredients", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "ingredients_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
});

export const movementPatterns = pgTable("movement_patterns", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "movement_patterns_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
});

export const nutrients = pgTable("nutrients", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "nutrients_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
	unit: varchar({ length: 2056 }).notNull(),
	// TODO: failed to parse database type 'tsvector'
	searchVector: unknown("search_vector").generatedAlwaysAs(sql`to_tsvector('english'::regconfig, (name)::text)`),
});

export const nutrientsNormalizedMapping = pgTable("nutrients_normalized_mapping", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "nutrients_normalized_mapping_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	originalNutrientId: integer().notNull(),
	normalizedNutrientId: integer().notNull(),
	originalName: varchar({ length: 2056 }).notNull(),
	normalizedName: varchar({ length: 2056 }).notNull(),
});

export const nutrientsNormalized = pgTable("nutrients_normalized", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "nutrients_normalized_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
	unit: varchar({ length: 2056 }).notNull(),
});

export const prohibitedSubstances = pgTable("prohibited_substances", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "prohibited_substances_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
	category: varchar({ length: 2056 }),
	notes: varchar({ length: 2056 }),
});

export const muscles = pgTable("muscles", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "muscles_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 2056 }).notNull(),
	group: varchar({ length: 2056 }),
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
	// TODO: failed to parse database type 'tsvector'
	searchVector: unknown("search_vector").generatedAlwaysAs(sql`to_tsvector('english'::regconfig, (((name)::text || ' '::text) || (COALESCE(brand, ''::character varying))::text))`),
});

export const exerciseEquipment = pgTable("exercise_equipment", {
	exerciseId: integer().notNull(),
	equipmentId: integer().notNull(),
}, (table) => [
	index("exercise_equipment_pk").using("btree", table.exerciseId.asc().nullsLast().op("int4_ops"), table.equipmentId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.exerciseId],
			foreignColumns: [exercises.id],
			name: "exercise_equipment_exerciseId_exercises_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.equipmentId],
			foreignColumns: [equipment.id],
			name: "exercise_equipment_equipmentId_equipment_id_fk"
		}).onDelete("cascade"),
]);

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
	// TODO: failed to parse database type 'tsvector'
	searchVector: unknown("search_vector").generatedAlwaysAs(sql`to_tsvector('english'::regconfig, (((name)::text || ' '::text) || (COALESCE(brand, ''::character varying))::text))`),
});

export const exerciseRelations = pgTable("exercise_relations", {
	fromExerciseId: integer().notNull(),
	toExerciseId: integer().notNull(),
	relationType: varchar({ length: 2056 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.fromExerciseId],
			foreignColumns: [exercises.id],
			name: "exercise_relations_fromExerciseId_exercises_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.toExerciseId],
			foreignColumns: [exercises.id],
			name: "exercise_relations_toExerciseId_exercises_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.fromExerciseId, table.toExerciseId, table.relationType], name: "exercise_relations_fromExerciseId_toExerciseId_relationType_pk"}),
]);

export const exerciseRelationsNormalized = pgTable("exercise_relations_normalized", {
	fromExerciseId: integer().notNull(),
	toExerciseId: integer().notNull(),
	relationType: varchar({ length: 2056 }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.fromExerciseId, table.toExerciseId, table.relationType], name: "exercise_relations_normalized_fromExerciseId_toExerciseId_relat"}),
]);

export const foodNutrientsNormalized = pgTable("food_nutrients_normalized", {
	foodId: integer().notNull(),
	nutrientId: integer().notNull(),
	value: varchar({ length: 2056 }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.foodId, table.nutrientId], name: "food_nutrients_normalized_foodId_nutrientId_pk"}),
]);

export const supplementIngredients = pgTable("supplement_ingredients", {
	supplementId: integer().notNull(),
	ingredientId: integer().notNull(),
	amount: varchar({ length: 2056 }),
}, (table) => [
	primaryKey({ columns: [table.supplementId, table.ingredientId], name: "supplement_ingredients_supplementId_ingredientId_pk"}),
]);

export const foodNutrients = pgTable("food_nutrients", {
	foodId: integer().notNull(),
	nutrientId: integer().notNull(),
	value: varchar({ length: 2056 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.foodId],
			foreignColumns: [foods.id],
			name: "food_nutrients_foodId_foods_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.nutrientId],
			foreignColumns: [nutrients.id],
			name: "food_nutrients_nutrientId_nutrients_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.foodId, table.nutrientId], name: "food_nutrients_foodId_nutrientId_pk"}),
]);
