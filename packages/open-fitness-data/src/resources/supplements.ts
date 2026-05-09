import { z } from 'zod';
import { supplementSchema, type Supplement } from '../schemas.js';
import type { OfdRequest } from '../request.js';
import type { PaginationInput, SearchSupplementsInput } from '../types.js';
import { paginationQuery } from './shared.js';

export interface SupplementsResource {
  list(input?: PaginationInput): Promise<Supplement[]>;
  search(input: SearchSupplementsInput): Promise<Supplement[]>;
  get(id: string | number): Promise<Supplement>;
}

export function createSupplementsResource(request: OfdRequest): SupplementsResource {
  return {
    list: (input) =>
      request('/supplements', z.array(supplementSchema), { method: 'GET', query: paginationQuery(input) }),
    search: (input) =>
      request('/supplements/search', z.array(supplementSchema), {
        method: 'GET',
        query: { q: input.q, ...paginationQuery(input) },
      }),
    get: (id) => request(`/supplements/${encodeURIComponent(String(id))}`, supplementSchema, { method: 'GET' }),
  };
}
