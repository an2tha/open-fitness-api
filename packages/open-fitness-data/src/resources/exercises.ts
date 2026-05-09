import { z } from 'zod';
import { exerciseSchema, type Exercise } from '../schemas.js';
import type { OfdRequest } from '../request.js';
import type { PaginationInput, SearchExercisesInput } from '../types.js';
import { paginationQuery } from './shared.js';

export interface ExercisesResource {
  list(input?: PaginationInput): Promise<Exercise[]>;
  search(input: SearchExercisesInput): Promise<Exercise[]>;
  get(id: string | number): Promise<Exercise>;
}

export function createExercisesResource(request: OfdRequest): ExercisesResource {
  return {
    list: (input) => request('/exercises', z.array(exerciseSchema), { method: 'GET', query: paginationQuery(input) }),
    search: (input) =>
      request('/exercises/search', z.array(exerciseSchema), {
        method: 'GET',
        query: {
          q: input.q,
          ...paginationQuery(input),
          muscle: input.muscle,
          equipment: input.equipment,
        },
      }),
    get: (id) => request(`/exercises/${encodeURIComponent(String(id))}`, exerciseSchema, { method: 'GET' }),
  };
}
