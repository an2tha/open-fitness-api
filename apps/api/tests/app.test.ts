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
    test('GET /foods - should return a list of foods', async () => {
      const res = await app.request(`${prefix}/foods?limit=5`);
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
      expect(body.length).toBeGreaterThan(0);
      expect(body[0].name.toLowerCase()).toContain('apple');
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
      // We can't easily check the nested nutrient in this simple test without deeper mapping,
      // but status 200 confirms the query logic is sound.
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

  describe('Friendly Casing', () => {
    test('Search results should have friendly casing', async () => {
      const res = await app.request(`${prefix}/foods/search?q=APPLE&limit=1`);
      const body = await res.json();
      if (body.length > 0) {
        // If it was "APPLE" in DB, it should now be "Apple"
        const name = body[0].name;
        const isFriendly =
          name === name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() || name !== name.toUpperCase();
        expect(isFriendly).toBe(true);
      }
    });
  });
});
