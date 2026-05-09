import { z } from 'zod';
import { foodSchema, type Food } from '../schemas.js';
import type { OfdRequest } from '../request.js';
import type { PaginationInput, SearchFoodsInput } from '../types.js';
import { paginationQuery } from './shared.js';

export interface FoodsResource {
  list(input?: PaginationInput): Promise<Food[]>;
  search(input: SearchFoodsInput): Promise<Food[]>;
  get(id: string | number): Promise<Food>;
}

export function createFoodsResource(request: OfdRequest): FoodsResource {
  return {
    list: (input) => request('/foods', z.array(foodSchema), { method: 'GET', query: paginationQuery(input) }),
    search: (input) =>
      request('/foods/search', z.array(foodSchema), {
        method: 'GET',
        query: {
          q: input.q,
          ...paginationQuery(input),
          brand: input.brand,
          dataSource: input.dataSource,
          category: input.category,
          minProtein: input.minProtein,
          maxProtein: input.maxProtein,
          minCalories: input.minCalories,
          maxCalories: input.maxCalories,
          nutrientName: input.nutrientName,
          minNutrientValue: input.minNutrientValue,
        },
      }),
    get: (id) => request(`/foods/${encodeURIComponent(String(id))}`, foodSchema, { method: 'GET' }),
  };
}
