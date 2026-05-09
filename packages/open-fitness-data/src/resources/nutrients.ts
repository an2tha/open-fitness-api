import { z } from 'zod';
import { nutrientSchema, type Nutrient } from '../schemas.js';
import type { OfdRequest } from '../request.js';
import type { PaginationInput, SearchNutrientsInput } from '../types.js';
import { paginationQuery } from './shared.js';

export interface NutrientsResource {
  list(input?: PaginationInput): Promise<Nutrient[]>;
  search(input: SearchNutrientsInput): Promise<Nutrient[]>;
  get(id: string | number): Promise<Nutrient>;
}

export function createNutrientsResource(request: OfdRequest): NutrientsResource {
  return {
    list: (input) => request('/nutrients', z.array(nutrientSchema), { method: 'GET', query: paginationQuery(input) }),
    search: (input) =>
      request('/nutrients/search', z.array(nutrientSchema), {
        method: 'GET',
        query: { q: input.q, ...paginationQuery(input) },
      }),
    get: (id) => request(`/nutrients/${encodeURIComponent(String(id))}`, nutrientSchema, { method: 'GET' }),
  };
}
