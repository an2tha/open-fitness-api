import { relations } from "drizzle-orm/relations";
import { exercises, exerciseMovementPatterns, movementPatterns, exerciseMuscles, muscles, exerciseEquipment, equipment, exerciseRelations, foods, foodNutrients, nutrients } from "./schema";

export const exerciseMovementPatternsRelations = relations(exerciseMovementPatterns, ({one}) => ({
	exercise: one(exercises, {
		fields: [exerciseMovementPatterns.exerciseId],
		references: [exercises.id]
	}),
	movementPattern: one(movementPatterns, {
		fields: [exerciseMovementPatterns.movementPatternId],
		references: [movementPatterns.id]
	}),
}));

export const exercisesRelations = relations(exercises, ({many}) => ({
	exerciseMovementPatterns: many(exerciseMovementPatterns),
	exerciseMuscles: many(exerciseMuscles),
	exerciseEquipments: many(exerciseEquipment),
	exerciseRelations_fromExerciseId: many(exerciseRelations, {
		relationName: "exerciseRelations_fromExerciseId_exercises_id"
	}),
	exerciseRelations_toExerciseId: many(exerciseRelations, {
		relationName: "exerciseRelations_toExerciseId_exercises_id"
	}),
}));

export const movementPatternsRelations = relations(movementPatterns, ({many}) => ({
	exerciseMovementPatterns: many(exerciseMovementPatterns),
}));

export const exerciseMusclesRelations = relations(exerciseMuscles, ({one}) => ({
	exercise: one(exercises, {
		fields: [exerciseMuscles.exerciseId],
		references: [exercises.id]
	}),
	muscle: one(muscles, {
		fields: [exerciseMuscles.muscleId],
		references: [muscles.id]
	}),
}));

export const musclesRelations = relations(muscles, ({many}) => ({
	exerciseMuscles: many(exerciseMuscles),
}));

export const exerciseEquipmentRelations = relations(exerciseEquipment, ({one}) => ({
	exercise: one(exercises, {
		fields: [exerciseEquipment.exerciseId],
		references: [exercises.id]
	}),
	equipment: one(equipment, {
		fields: [exerciseEquipment.equipmentId],
		references: [equipment.id]
	}),
}));

export const equipmentRelations = relations(equipment, ({many}) => ({
	exerciseEquipments: many(exerciseEquipment),
}));

export const exerciseRelationsRelations = relations(exerciseRelations, ({one}) => ({
	exercise_fromExerciseId: one(exercises, {
		fields: [exerciseRelations.fromExerciseId],
		references: [exercises.id],
		relationName: "exerciseRelations_fromExerciseId_exercises_id"
	}),
	exercise_toExerciseId: one(exercises, {
		fields: [exerciseRelations.toExerciseId],
		references: [exercises.id],
		relationName: "exerciseRelations_toExerciseId_exercises_id"
	}),
}));

export const foodNutrientsRelations = relations(foodNutrients, ({one}) => ({
	food: one(foods, {
		fields: [foodNutrients.foodId],
		references: [foods.id]
	}),
	nutrient: one(nutrients, {
		fields: [foodNutrients.nutrientId],
		references: [nutrients.id]
	}),
}));

export const foodsRelations = relations(foods, ({many}) => ({
	foodNutrients: many(foodNutrients),
}));

export const nutrientsRelations = relations(nutrients, ({many}) => ({
	foodNutrients: many(foodNutrients),
}));