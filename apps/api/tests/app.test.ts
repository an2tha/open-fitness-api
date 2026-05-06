import { expect, test, describe } from 'bun:test';
import app from '../src/app';

describe('Open Fitness Data API', () => {
  const prefix = '/api/v1';

  test('GET /health - should return 200 and healthy status', async () => {
    const res = await app.request(`${prefix}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  describe('Foods', () => {
    test('GET /foods/search - should return a list of foods', async () => {
      const res = await app.request(`${prefix}/foods/search?limit=5&q=a`);
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
      const res = await app.request(`${prefix}/foods/search?q=apple&limit=5`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      if (body.length > 0) {
        expect(body[0].name.toLowerCase()).toContain('apple');
      }
    });

    test('GET /foods/search - should support filters (minProtein)', async () => {
      const res = await app.request(`${prefix}/foods/search?q=bean&minProtein=10&limit=5`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      body.forEach((food: any) => {
        expect(parseFloat(food.protein)).toBeGreaterThanOrEqual(10);
      });
    });

    test('GET /foods/search - should support nutrientName filter', async () => {
      const res = await app.request(`${prefix}/foods/search?q=milk&nutrientName=Calcium&minNutrientValue=100&limit=5`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });

    test('GET /foods/:id - should return single food item', async () => {
      const search = await app.request(`${prefix}/foods/search?q=a&limit=1`);
      const searchBody = await search.json();
      if (searchBody.length > 0) {
        const id = searchBody[0].id;
        const res = await app.request(`${prefix}/foods/${id}`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('id', id);
      }
    });
  });

  describe('Exercises', () => {
    test('GET /exercises/search - should return exercise results', async () => {
      const res = await app.request(`${prefix}/exercises/search?q=press&limit=5`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      if (body.length > 0) {
        expect(body[0]).toHaveProperty('name');
        expect(body[0]).not.toHaveProperty('search_vector');
      }
    });
  });

  describe('Supplements', () => {
    test('GET /supplements/search - should return supplement results', async () => {
      const res = await app.request(`${prefix}/supplements/search?q=creatine&limit=5`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      if (body.length > 0) {
        expect(body[0]).toHaveProperty('name');
        expect(body[0]).not.toHaveProperty('search_vector');
      }
    });

    test('GET /supplements/:id - should return single supplement', async () => {
      // Assuming a generic search to find one ID first
      const search = await app.request(`${prefix}/supplements/search?q=a&limit=1`);
      const searchBody = await search.json();
      if (searchBody.length > 0) {
        const id = searchBody[0].id;
        const res = await app.request(`${prefix}/supplements/${id}`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('id', id);
      }
    });
  });

  describe('Nutrients', () => {
    test('GET /nutrients/search - should return nutrient results', async () => {
      const res = await app.request(`${prefix}/nutrients/search?q=vitamin&limit=5`);
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
      // Assuming a generic search to find one ID first
      const search = await app.request(`${prefix}/nutrients/search?q=a&limit=1`);
      const searchBody = await search.json();
      if (searchBody.length > 0) {
        const id = searchBody[0].id;
        const res = await app.request(`${prefix}/nutrients/${id}`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('id', id);
      }
    });
  });

  describe('Error Handling', () => {
    test('GET /non-existent-route - should return 404', async () => {
      const res = await app.request(`/non-existent-route`);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });
});
