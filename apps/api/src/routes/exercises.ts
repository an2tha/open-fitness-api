import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { db } from '@repo/db';
import { exercisesTable } from '@repo/db/src/schema';
import { eq, sql, or, desc } from 'drizzle-orm';
import { NotFoundError } from '../lib/error';
import { toFriendlyCase } from '../lib/utils';

const exerciseSchema = z.object({
  id: z.number().openapi({ description: 'Exercise ID' }),
  name: z.string().openapi({ description: 'Exercise name' }),
  description: z.string().optional().openapi({ description: 'Exercise description' }),
  updatedAt: z.string().datetime().optional().openapi({ description: 'Last update timestamp' }),
});

const searchExercisesRoute = createRoute({
  method: 'get',
  path: '/search',
  tags: ['Exercises'],
  summary: 'Search exercises',
  description: 'Search exercises using full-text and fuzzy search',
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
          schema: z.array(exerciseSchema),
        },
      },
    },
  },
});

const exercises = new OpenAPIHono();

exercises.openapi(searchExercisesRoute, async (c) => {
  const { q, limit, offset } = c.req.valid('query');
  const searchQuery = q.trim().split(/\s+/).map(term => `${term}:*`).join(' & ');

  const result = await db.execute(sql`
    WITH matches AS (
      (
        SELECT *, ts_rank(search_vector, to_tsquery('english', ${searchQuery})) as rank
        FROM exercises 
        WHERE search_vector @@ to_tsquery('english', ${searchQuery})
        LIMIT ${limit + offset + 100}
      )
      UNION ALL
      (
        SELECT *, similarity(name, ${q}) as rank
        FROM exercises 
        WHERE name % ${q}
        LIMIT ${limit + offset + 100}
      )
    )
    SELECT DISTINCT ON (id) * FROM matches
    ORDER BY id, rank DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  return c.json(result.map((e: any) => {
    const { search_vector, searchVector, rank, ...rest } = e;
    return {
      ...rest,
      name: toFriendlyCase(rest.name)
    };
  }));
});

const listExercisesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Exercises'],
  summary: 'List all exercises',
  description: 'Retrieve a list of all exercises with pagination',
  request: {
    query: z.object({
      limit: z.string().default('50').transform(Number),
      offset: z.string().default('0').transform(Number),
    }),
  },
  responses: {
    200: {
      description: 'List of exercises',
      content: {
        'application/json': {
          schema: z.array(exerciseSchema),
        },
      },
    },
  },
});

exercises.openapi(listExercisesRoute, async (c) => {
  const { limit, offset } = c.req.valid('query');
  const result = await db.select().from(exercisesTable).limit(limit).offset(offset);
  return c.json(result.map((e: any) => {
    const { search_vector, searchVector, ...rest } = e;
    return {
      ...rest,
      name: toFriendlyCase(rest.name)
    };
  }));
});

const getExerciseRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Exercises'],
  summary: 'Get an exercise by ID',
  description: 'Retrieve a single exercise by its ID',
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
  },
  responses: {
    200: {
      description: 'Exercise details',
      content: {
        'application/json': {
          schema: exerciseSchema,
        },
      },
    },
    404: {
      description: 'Exercise not found',
    },
  },
});

exercises.openapi(getExerciseRoute, async (c) => {
  const { id } = c.req.valid('param');
  const result = await db.select().from(exercisesTable).where(eq(exercisesTable.id, id));
  if (result.length === 0) {
    throw new NotFoundError('Exercise');
  }
  const { search_vector, searchVector, ...rest } = result[0] as any;
  return c.json({
    ...rest,
    name: toFriendlyCase(rest.name)
  });
});

export default exercises;
export type ListExercisesRoute = typeof listExercisesRoute;
export type GetExerciseRoute = typeof getExerciseRoute;
export type SearchExercisesRoute = typeof searchExercisesRoute;