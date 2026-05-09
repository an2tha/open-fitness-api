import { DEFAULT_BASE_URL } from './constants.js';
import { createOfdRequest } from './request.js';
import { createHealthResource, type HealthResource } from './resources/health.js';
import { createFoodsResource, type FoodsResource } from './resources/foods.js';
import { createExercisesResource, type ExercisesResource } from './resources/exercises.js';
import { createSupplementsResource, type SupplementsResource } from './resources/supplements.js';
import { createNutrientsResource, type NutrientsResource } from './resources/nutrients.js';
import type { OfdClientConfig, OfdRequestOptions } from './types.js';
import type { OfdRequest } from './request.js';

export interface OfdClient {
  readonly baseUrl: string;
  request: OfdRequest;
  health: HealthResource;
  foods: FoodsResource;
  exercises: ExercisesResource;
  supplements: SupplementsResource;
  nutrients: NutrientsResource;
}

export function createOfdClient(config: OfdClientConfig = {}): OfdClient {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const request = createOfdRequest({ ...config, baseUrl });

  return {
    baseUrl,
    request,
    health: createHealthResource(request),
    foods: createFoodsResource(request),
    exercises: createExercisesResource(request),
    supplements: createSupplementsResource(request),
    nutrients: createNutrientsResource(request),
  };
}

export const createOfdAPI = createOfdClient;
export type { OfdRequestOptions };
export default createOfdClient;
