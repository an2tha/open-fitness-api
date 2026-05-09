import { describe, expect, test } from 'bun:test';

process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_ENABLED = 'false';
process.env.API_KEY_AUTH_ENABLED = 'false';
process.env.SWAGGER_ENABLED = 'true';

const { default: app } = await import('../src/app');

const prefix = '/api/v1';

function request(path: string, init: RequestInit = {}) {
  return app.request(`${prefix}${path}`, init);
}

describe('Open Fitness Data API', () => {
  test('GET /health - should return 200 and healthy status', async () => {
    const res = await request('/health');
    expect(res.status).toBe(200);
    expect(res.headers.get('x-request-id')).toBeTruthy();
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
    expect(typeof body.uptime).toBe('number');
  });

  test('GET /health/db - should return 200 and database health', async () => {
    const res = await request('/health/db');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.message).toContain('healthy');
  });

  test('GET /health/stats - should return system stats', async () => {
    const res = await request('/health/stats');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(typeof body.uptime).toBe('number');
    expect(body.counts).toHaveProperty('foods');
    expect(body.counts).toHaveProperty('exercises');
    expect(body.counts).toHaveProperty('supplements');
    expect(typeof body.node_version).toBe('string');
  });

  test('GET /openapi.json - should return an OpenAPI document', async () => {
    const res = await request('/openapi.json');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.openapi).toBe('3.0.0');
    expect(body.info.title).toBe('Open Fitness Data API');
    expect(body.paths).toHaveProperty('/health');
    expect(body.paths).toHaveProperty('/foods/search');
  });

  describe('Foods', () => {
    test('GET /foods/search - should return a list of foods', async () => {
      const res = await request('/foods/search?limit=5&q=a');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      if (body.length > 0) {
        expect(body[0]).toHaveProperty('id');
        expect(body[0]).toHaveProperty('name');
        expect(body[0]).not.toHaveProperty('search_vector');
      }
    });

    test('GET /foods/search - should perform fuzzy search', async () => {
      const res = await request('/foods/search?q=oatmilk&limit=5');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      if (body.length > 0) {
        expect(String(body[0].name).toLowerCase()).toContain('oatmilk');
      }
    });

    test('GET /foods/search - should support missing q', async () => {
      const res = await request('/foods/search?limit=5');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });

    test('GET /foods/search - should support filters (minProtein)', async () => {
      const res = await request('/foods/search?q=bean&minProtein=10&limit=5');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      body.forEach((food: any) => {
        expect(parseFloat(food.protein)).toBeGreaterThanOrEqual(10);
      });
    });

    test('GET /foods/search - should support nutrientName filter', async () => {
      const res = await request('/foods/search?q=milk&nutrientName=Calcium&minNutrientValue=100&limit=5');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });

    test('GET /foods/:id - should return single food item', async () => {
      const search = await request('/foods/search?q=a&limit=1');
      const searchBody = await search.json();
      if (Array.isArray(searchBody) && searchBody.length > 0) {
        const id = searchBody[0].id;
        const res = await request(`/foods/${id}`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.id).toBe(id);
      }
    });

    test('GET /foods/:id - should return 404 for missing food', async () => {
      const res = await request('/foods/999999999');
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Exercises', () => {
    test('GET /exercises/search - should return exercise results', async () => {
      const res = await request('/exercises/search?q=press&limit=5');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      if (body.length > 0) {
        expect(body[0]).toHaveProperty('name');
        expect(body[0]).not.toHaveProperty('search_vector');
      }
    });

    test('GET /exercises/:id - should return 404 for missing exercise', async () => {
      const res = await request('/exercises/999999999');
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Supplements', () => {
    test('GET /supplements/search - should return supplement results', async () => {
      const res = await request('/supplements/search?q=creatine&limit=5');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      if (body.length > 0) {
        expect(body[0]).toHaveProperty('name');
        expect(body[0]).not.toHaveProperty('search_vector');
      }
    });

    test('GET /supplements/:id - should return single supplement', async () => {
      const search = await request('/supplements/search?q=a&limit=1');
      const searchBody = await search.json();
      if (Array.isArray(searchBody) && searchBody.length > 0) {
        const id = searchBody[0].id;
        const res = await request(`/supplements/${id}`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.id).toBe(id);
      }
    });

    test('GET /supplements/:id - should return 404 for missing supplement', async () => {
      const res = await request('/supplements/999999999');
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Nutrients', () => {
    test('GET /nutrients/search - should return nutrient results', async () => {
      const res = await request('/nutrients/search?q=vitamin&limit=5');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      if (body.length > 0) {
        expect(body[0]).toHaveProperty('name');
        expect(body[0]).toHaveProperty('unit');
        expect(body[0]).not.toHaveProperty('search_vector');
      }
    });

    test('GET /nutrients/:id - should return single nutrient', async () => {
      const search = await request('/nutrients/search?q=a&limit=1');
      const searchBody = await search.json();
      if (Array.isArray(searchBody) && searchBody.length > 0) {
        const id = searchBody[0].id;
        const res = await request(`/nutrients/${id}`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.id).toBe(id);
      }
    });

    test('GET /nutrients/:id - should return 404 for missing nutrient', async () => {
      const res = await request('/nutrients/999999999');
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Error Handling', () => {
    test('GET /non-existent-route - should return 404', async () => {
      const res = await request('/non-existent-route');
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });
});
