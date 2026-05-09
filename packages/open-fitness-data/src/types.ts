type QueryValue = string | number | boolean;

export type QueryPrimitive = QueryValue | null | undefined;
export type QueryParams = Record<string, QueryPrimitive | readonly QueryValue[]>;

export type FetchHeaders = RequestInit['headers'];
export type FetchBody = RequestInit['body'];
export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface PaginationInput {
  limit?: number;
  offset?: number;
}

export interface SearchFoodsInput extends PaginationInput {
  q: string;
  brand?: string;
  dataSource?: string;
  category?: string;
  minProtein?: QueryValue;
  maxProtein?: QueryValue;
  minCalories?: QueryValue;
  maxCalories?: QueryValue;
  nutrientName?: string;
  minNutrientValue?: QueryValue;
}

export interface SearchExercisesInput extends PaginationInput {
  q: string;
  muscle?: string;
  equipment?: string;
}

export interface SearchSupplementsInput extends PaginationInput {
  q: string;
}

export interface SearchNutrientsInput extends PaginationInput {
  q: string;
}

export interface OfdClientConfig {
  baseUrl?: string;
  apiKey?: string;
  apiKeyHeader?: 'Authorization' | 'X-API-Key';
  headers?: FetchHeaders;
  fetch?: FetchLike;
}

export interface OfdRequestOptions extends Omit<RequestInit, 'headers' | 'body'> {
  headers?: FetchHeaders;
  query?: QueryParams;
  body?: FetchBody;
}

export type { QueryValue };
