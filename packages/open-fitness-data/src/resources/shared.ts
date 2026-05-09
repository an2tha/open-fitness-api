import type { PaginationInput, QueryParams } from '../types.js';

export function paginationQuery(input?: PaginationInput): QueryParams {
  return {
    limit: input?.limit,
    offset: input?.offset,
  };
}
