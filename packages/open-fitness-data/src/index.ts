export { DEFAULT_BASE_URL } from './constants.js';
export { OfdApiError } from './errors.js';
export { createOfdRequest, createHeaders, createUrl } from './request.js';
export type { OfdRequest } from './request.js';
export { createOfdClient, createOfdAPI } from './client.js';
export type { OfdClient } from './client.js';
export type {
  OfdClientConfig,
  OfdRequestOptions,
  PaginationInput,
  QueryParams,
  QueryPrimitive,
  SearchFoodsInput,
  SearchExercisesInput,
  SearchSupplementsInput,
  SearchNutrientsInput,
  QueryValue,
  FetchLike,
} from './types.js';
export {
  foodSchema,
  foodNutrientSchema,
  exerciseSchema,
  muscleSchema,
  equipmentSchema,
  supplementSchema,
  nutrientSchema,
  healthPingSchema,
  healthDbSchema,
  healthStatsSchema,
} from './schemas.js';
export type {
  Food,
  FoodNutrient,
  Exercise,
  Muscle,
  Equipment,
  Supplement,
  Nutrient,
  HealthPing,
  HealthDb,
  HealthStats,
} from './schemas.js';
export type { HealthResource } from './resources/health.js';
export type { FoodsResource } from './resources/foods.js';
export type { ExercisesResource } from './resources/exercises.js';
export type { SupplementsResource } from './resources/supplements.js';
export type { NutrientsResource } from './resources/nutrients.js';
