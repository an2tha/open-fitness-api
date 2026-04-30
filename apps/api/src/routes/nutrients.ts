import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { db } from '@repo/db';
import { nutrientsTable } from '@repo/db/src/schema';
import { eq, sql, or, desc } from 'drizzle-orm';
import { NotFoundError } from '../lib/error';
import { toFriendlyCase } from '../lib/utils';

const nutrientSchema = z.object({
  id: z.number().openapi({ description: 'Nutrient ID' }),
  name: z.string().openapi({ description: 'Nutrient name' }),
  unit: z.string().openapi({ description: 'Nutrient unit' }),
});

const searchNutrientsRoute = createRoute({
  method: 'get',
  path: '/search',
  tags: ['Nutrients'],
  summary: 'Search nutrients',
  description: 'Search nutrients using full-text and fuzzy search',
  request: {
    query: z.object({
      q: z.string().min(1, 'Search query is required'),
      limit: z.string().default('50').transform(Number),
      offset: z.string().default('0').transform(Number),
    }),
  },
  responses: {
    200: {
      description: 'Search results',
      content: {
        'application/json': {
          schema: z.array(nutrientSchema),
        },
      },
    },
  },
});

const nutrients = new OpenAPIHono();

nutrients.openapi(searchNutrientsRoute, async (c) => {
  const { q, limit, offset } = c.req.valid('query');
  const searchQuery = q.trim().split(/\s+/).map(term => `${term}:*`).join(' & ');

  const result = await db.execute(sql`
    WITH matches AS (
      (
        SELECT *, ts_rank(search_vector, to_tsquery('english', ${searchQuery})) as rank
        FROM nutrients 
        WHERE search_vector @@ to_tsquery('english', ${searchQuery})
        LIMIT ${limit + offset + 100}
      )
      UNION ALL
      (
        SELECT *, similarity(name, ${q}) as rank
        FROM nutrients 
        WHERE name % ${q}
        LIMIT ${limit + offset + 100}
      )
    )
    SELECT DISTINCT ON (id) * FROM matches
    ORDER BY id, rank DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  return c.json(result.map((n: any) => {
    const { search_vector, searchVector, rank, ...rest } = n;
    return {
      ...rest,
      name: toFriendlyCase(rest.name)
    };
  }));
});

const listNutrientsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Nutrients'],
  summary: 'List all nutrients',
  description: 'Retrieve a list of all nutrients with pagination',
  request: {
    query: z.object({
      limit: z.string().default('50').transform(Number),
      offset: z.string().default('0').transform(Number),
    }),
  },
  responses: {
    200: {
      description: 'List of nutrients',
      content: {
        'application/json': {
          schema: z.array(nutrientSchema),
        },
      },
    },
  },
});

nutrients.openapi(listNutrientsRoute, async (c) => {
  const { limit, offset } = c.req.valid('query');
  const result = await db.select().from(nutrientsTable).limit(limit).offset(offset);
  return c.json(result.map((n: any) => {
    const { search_vector, searchVector, ...rest } = n;
    return {
      ...rest,
      name: toFriendlyCase(rest.name)
    };
  }));
});

const getNutrientRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Nutrients'],
  summary: 'Get a nutrient by ID',
  description: 'Retrieve a single nutrient by its ID',
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
  },
  responses: {
    200: {
      description: 'Nutrient details',
      content: {
        'application/json': {
          schema: nutrientSchema,
        },
      },
    },
    404: {
      description: 'Nutrient not found',
    },
  },
});

nutrients.openapi(getNutrientRoute, async (c) => {
  const { id } = c.req.valid('param');
  const result = await db.select().from(nutrientsTable).where(eq(nutrientsTable.id, id));
  if (result.length === 0) {
    throw new NotFoundError('Nutrient');
  }
  const { search_vector, searchVector, ...rest } = result[0] as any;
  return c.json({
    ...rest,
    name: toFriendlyCase(rest.name)
  });
});

export default nutrients;
export type ListNutrientsRoute = typeof listNutrientsRoute;
export type GetNutrientRoute = typeof getNutrientRoute;
export type SearchNutrientsRoute = typeof searchNutrientsRoute;