import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { db } from '@repo/db';
import { supplementsTable } from '@repo/db/src/schema';
import { eq, sql, or, desc } from 'drizzle-orm';
import { NotFoundError } from '../lib/error';
import { toFriendlyCase } from '../lib/utils';

const supplementSchema = z.object({
  id: z.number().openapi({ description: 'Supplement ID' }),
  externalId: z.string().optional().openapi({ description: 'External ID from data source' }),
  dataSource: z.string().openapi({ description: 'Data source identifier' }),
  name: z.string().openapi({ description: 'Supplement name' }),
  brand: z.string().optional().openapi({ description: 'Brand name' }),
  category: z.string().optional().openapi({ description: 'Supplement category' }),
  servingSize: z.string().optional().openapi({ description: 'Serving size' }),
  servingUnit: z.string().optional().openapi({ description: 'Serving unit' }),
  updatedAt: z.string().datetime().optional().openapi({ description: 'Last update timestamp' }),
});

const searchSupplementsRoute = createRoute({
  method: 'get',
  path: '/search',
  tags: ['Supplements'],
  summary: 'Search supplements',
  description: 'Search supplements using full-text and fuzzy search',
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
          schema: z.array(supplementSchema),
        },
      },
    },
  },
});

const supplements = new OpenAPIHono();

supplements.openapi(searchSupplementsRoute, async (c) => {
  const { q, limit, offset } = c.req.valid('query');
  const searchQuery = q.trim().split(/\s+/).map(term => `${term}:*`).join(' & ');

  const result = await db.execute(sql`
    WITH matches AS (
      (
        SELECT *, ts_rank(search_vector, to_tsquery('english', ${searchQuery})) as rank
        FROM supplements 
        WHERE search_vector @@ to_tsquery('english', ${searchQuery})
        LIMIT ${limit + offset + 100}
      )
      UNION ALL
      (
        SELECT *, similarity(name, ${q}) as rank
        FROM supplements 
        WHERE name % ${q}
        LIMIT ${limit + offset + 100}
      )
    )
    SELECT DISTINCT ON (id) * FROM matches
    ORDER BY id, rank DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  return c.json(result.map((s: any) => {
    const { search_vector, searchVector, rank, ...rest } = s;
    return {
      ...rest,
      name: toFriendlyCase(rest.name),
      brand: toFriendlyCase(rest.brand)
    };
  }));
});

const listSupplementsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Supplements'],
  summary: 'List all supplements',
  description: 'Retrieve a list of all supplements with pagination',
  request: {
    query: z.object({
      limit: z.string().default('50').transform(Number),
      offset: z.string().default('0').transform(Number),
    }),
  },
  responses: {
    200: {
      description: 'List of supplements',
      content: {
        'application/json': {
          schema: z.array(supplementSchema),
        },
      },
    },
  },
});

supplements.openapi(listSupplementsRoute, async (c) => {
  const { limit, offset } = c.req.valid('query');
  const result = await db.select().from(supplementsTable).limit(limit).offset(offset);
  return c.json(result.map((s: any) => {
    const { search_vector, searchVector, ...rest } = s;
    return {
      ...rest,
      name: toFriendlyCase(rest.name),
      brand: toFriendlyCase(rest.brand)
    };
  }));
});

const getSupplementRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Supplements'],
  summary: 'Get a supplement by ID',
  description: 'Retrieve a single supplement by its ID',
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
  },
  responses: {
    200: {
      description: 'Supplement details',
      content: {
        'application/json': {
          schema: supplementSchema,
        },
      },
    },
    404: {
      description: 'Supplement not found',
    },
  },
});

supplements.openapi(getSupplementRoute, async (c) => {
  const { id } = c.req.valid('param');
  const result = await db.select().from(supplementsTable).where(eq(supplementsTable.id, id));
  if (result.length === 0) {
    throw new NotFoundError('Supplement');
  }
  const { search_vector, searchVector, ...rest } = result[0] as any;
  return c.json({
    ...rest,
    name: toFriendlyCase(rest.name),
    brand: toFriendlyCase(rest.brand)
  });
});

export default supplements;
export type ListSupplementsRoute = typeof listSupplementsRoute;
export type GetSupplementRoute = typeof getSupplementRoute;
export type SearchSupplementsRoute = typeof searchSupplementsRoute;