import { z } from 'zod';
import { OfdApiError } from './errors.js';
import type { OfdClientConfig, OfdRequestOptions, QueryParams } from './types.js';

export interface OfdRequest {
  <T = unknown>(path: string, options?: OfdRequestOptions): Promise<T>;
  <S extends z.ZodTypeAny>(path: string, schema: S, options?: OfdRequestOptions): Promise<z.output<S>>;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

function createUrl(baseUrl: string, path: string, query?: QueryParams) {
  const url = new URL(path.replace(/^\/+/, ''), normalizeBaseUrl(baseUrl));

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
}

function createHeaders(config: OfdClientConfig, headers?: RequestInit['headers']) {
  const merged = new Headers(config.headers);
  merged.set('Accept', 'application/json');

  if (config.apiKey) {
    if (config.apiKeyHeader === 'X-API-Key') {
      merged.set('X-API-Key', config.apiKey);
    } else {
      merged.set('Authorization', config.apiKey.startsWith('Bearer ') ? config.apiKey : `Bearer ${config.apiKey}`);
    }
  }

  if (headers) {
    new Headers(headers).forEach((value, key) => merged.set(key, value));
  }

  return merged;
}

async function readBody(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function isZodSchema(value: unknown): value is z.ZodTypeAny {
  return typeof value === 'object' && value !== null && 'safeParse' in value;
}

async function performRequest<T>(
  config: OfdClientConfig & { baseUrl: string },
  path: string,
  options: OfdRequestOptions = {},
  schema?: z.ZodType<T>,
): Promise<T> {
  const { query, headers, ...init } = options;
  const fetchImpl = config.fetch ?? globalThis.fetch;

  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is not available in this runtime');
  }

  const url = createUrl(config.baseUrl, path, query);
  const response = await fetchImpl(url, {
    ...init,
    headers: createHeaders(config, headers),
  });

  const body = await readBody(response);

  if (!response.ok) {
    throw new OfdApiError({
      status: response.status,
      statusText: response.statusText,
      url: url.toString(),
      body,
    });
  }

  if (schema) {
    return schema.parse(body);
  }

  return body as T;
}

export function createOfdRequest(config: OfdClientConfig & { baseUrl: string }): OfdRequest {
  async function request<T = unknown>(path: string, options?: OfdRequestOptions): Promise<T>;
  async function request<S extends z.ZodTypeAny>(
    path: string,
    schema: S,
    options?: OfdRequestOptions,
  ): Promise<z.output<S>>;
  async function request(
    path: string,
    schemaOrOptions?: z.ZodTypeAny | OfdRequestOptions,
    options: OfdRequestOptions = {},
  ) {
    if (isZodSchema(schemaOrOptions)) {
      return performRequest(config, path, options, schemaOrOptions);
    }

    return performRequest(config, path, schemaOrOptions ?? {});
  }

  return request;
}

export { createHeaders, createUrl, performRequest, readBody };
