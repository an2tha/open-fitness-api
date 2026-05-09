import { describe, expect, test } from 'bun:test';
import { DEFAULT_BASE_URL, OfdApiError, createOfdClient, foodSchema } from '../index.ts';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  });
}

describe('open-fitness-data client', () => {
  test('builds typed requests, serializes query params, and applies bearer auth', async () => {
    const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];

    const client = createOfdClient({
      apiKey: 'ofd_test_key',
      fetch: async (input, init) => {
        calls.push({ input, init });
        return jsonResponse([
          {
            id: 1,
            dataSource: 'usda',
            name: 'Kale',
            brand: 'Organic Farms',
            category: 'vegetables',
            other_nutrients: [],
          },
        ]);
      },
    });

    const foods = await client.foods.search({
      q: 'kale',
      limit: 10,
      offset: 2,
      dataSource: 'usda',
      minProtein: 1,
    });

    expect(client.baseUrl).toBe(DEFAULT_BASE_URL);
    expect(foods[0]?.name).toBe('Kale');
    expect(calls).toHaveLength(1);

    const url = new URL(String(calls[0]?.input));
    expect(url.pathname).toBe('/api/v1/foods/search');
    expect(url.searchParams.get('q')).toBe('kale');
    expect(url.searchParams.get('limit')).toBe('10');
    expect(url.searchParams.get('offset')).toBe('2');
    expect(url.searchParams.get('dataSource')).toBe('usda');
    expect(url.searchParams.get('minProtein')).toBe('1');

    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer ofd_test_key');
  });

  test('supports X-API-Key auth and schema-aware requests', async () => {
    const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];

    const client = createOfdClient({
      apiKey: 'ofd_test_key',
      apiKeyHeader: 'X-API-Key',
      fetch: async (input, init) => {
        calls.push({ input, init });
        return jsonResponse({
          id: 7,
          dataSource: 'usda',
          name: 'Eggs',
          brand: 'Farm Fresh',
          category: 'protein',
        });
      },
    });

    const food = await client.request('/foods/7', foodSchema, { method: 'GET' });

    expect(food.id).toBe(7);
    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get('X-API-Key')).toBe('ofd_test_key');
  });

  test('throws OfdApiError for failed responses', async () => {
    const client = createOfdClient({
      fetch: async () =>
        new Response(JSON.stringify({ message: 'Not found' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        }),
    });

    await expect(client.foods.get(404)).rejects.toBeInstanceOf(OfdApiError);

    try {
      await client.foods.get(404);
    } catch (error) {
      expect(error).toBeInstanceOf(OfdApiError);
      expect((error as OfdApiError).status).toBe(404);
      expect((error as OfdApiError).url).toContain('/foods/404');
    }
  });
});
