import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { db } from '@repo/db';
import {
  exercisesTable,
  musclesTable,
  exerciseMusclesTable,
  equipmentTable,
  exerciseEquipmentTable,
} from '@repo/db/src/schema';
import { eq, sql, inArray } from 'drizzle-orm';
import { NotFoundError } from '../lib/error';
import { toFriendlyCase } from '../lib/utils';

const muscleSchema = z.object({
  id: z.number(),
  name: z.string(),
  group: z.string().nullable(),
  role: z.string(),
});

const equipmentSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string().nullable(),
});

const exerciseSchema = z.object({
  id: z.number().openapi({ description: 'Exercise ID' }),
  name: z.string().openapi({ description: 'Exercise name' }),
  description: z.string().optional().nullable().openapi({ description: 'Exercise description' }),
  updatedAt: z.string().datetime().optional().nullable().openapi({ description: 'Last update timestamp' }),
  muscles: z.array(muscleSchema).optional().openapi({ description: 'Muscles involved in the exercise' }),
  equipment: z.array(equipmentSchema).optional().openapi({ description: 'Equipment required for the exercise' }),
});

async function fetchDetailsForExercises(exerciseIds: number[]) {
  if (exerciseIds.length === 0) {
    return {
      musclesMap: new Map<number, any[]>(),
      equipmentMap: new Map<number, any[]>(),
    };
  }

  const musclesResult = await db
    .select({
      exerciseId: exerciseMusclesTable.exerciseId,
      id: musclesTable.id,
      name: musclesTable.name,
      group: musclesTable.group,
      role: exerciseMusclesTable.role,
    })
    .from(exerciseMusclesTable)
    .innerJoin(musclesTable, eq(exerciseMusclesTable.muscleId, musclesTable.id))
    .where(inArray(exerciseMusclesTable.exerciseId, exerciseIds));

  const musclesMap = new Map<number, any[]>();
  for (const m of musclesResult) {
    if (!musclesMap.has(m.exerciseId)) {
      musclesMap.set(m.exerciseId, []);
    }
    musclesMap.get(m.exerciseId)!.push({
      id: m.id,
      name: toFriendlyCase(m.name),
      group: toFriendlyCase(m.group),
      role: m.role,
    });
  }

  const equipmentResult = await db
    .select({
      exerciseId: exerciseEquipmentTable.exerciseId,
      id: equipmentTable.id,
      name: equipmentTable.name,
      category: equipmentTable.category,
    })
    .from(exerciseEquipmentTable)
    .innerJoin(equipmentTable, eq(exerciseEquipmentTable.equipmentId, equipmentTable.id))
    .where(inArray(exerciseEquipmentTable.exerciseId, exerciseIds));

  const equipmentMap = new Map<number, any[]>();
  for (const e of equipmentResult) {
    if (!equipmentMap.has(e.exerciseId)) {
      equipmentMap.set(e.exerciseId, []);
    }
    equipmentMap.get(e.exerciseId)!.push({
      id: e.id,
      name: toFriendlyCase(e.name),
      category: toFriendlyCase(e.category),
    });
  }

  return { musclesMap, equipmentMap };
}

function mapExercise(exercise: any, muscles: any[] = [], equipment: any[] = []) {
  const { search_vector: _sv, searchVector: _sv2, rank: _r, ...rest } = exercise;
  return {
    ...rest,
    name: toFriendlyCase(rest.name),
    muscles,
    equipment,
  };
}

const searchExercisesRoute = createRoute({
  method: 'get',
  path: '/search',
  tags: ['Exercises'],
  summary: 'Search exercises',
  description: 'Search exercises using full-text and fuzzy search with filters',
  request: {
    query: z.object({
      q: z.string().min(1, 'Search query is required'),
      limit: z.string().default('50').transform(Number),
      offset: z.string().default('0').transform(Number),
      muscle: z.string().optional().openapi({ description: 'Filter by muscle name' }),
      equipment: z.string().optional().openapi({ description: 'Filter by equipment name' }),
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

exercises.openapi(searchExercisesRoute, (async (c: any) => {
  const { q, limit, offset, muscle, equipment } = c.req.valid('query');
  const searchQuery = q
    .trim()
    .split(/\s+/)
    .map((term: any) => `${term}:*`)
    .join(' & ');

  const conditions: any[] = [];
  if (muscle) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM exercise_muscles em
      JOIN muscles m ON em."muscleId" = m.id
      WHERE em."exerciseId" = e.id AND m.name ILIKE ${'%' + muscle + '%'}
    )`);
  }
  if (equipment) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM exercise_equipment ee
      JOIN equipment eq_table ON ee."equipmentId" = eq_table.id
      WHERE ee."exerciseId" = e.id AND eq_table.name ILIKE ${'%' + equipment + '%'}
    )`);
  }

  const whereClause = conditions.length > 0 ? sql`AND ${sql.join(conditions, sql` AND `)}` : sql``;

  try {
    const result = await db.execute(sql`
      WITH matches AS (
        (
          SELECT *, ts_rank(search_vector, to_tsquery('english', ${searchQuery})) as rank
          FROM exercises as e
          WHERE e.search_vector @@ to_tsquery('english', ${searchQuery}) ${whereClause}
          LIMIT ${limit + offset + 100}
        )
        UNION ALL
        (
          SELECT *, similarity(name, ${q}) as rank
          FROM exercises as e
          WHERE e.name % ${q} ${whereClause}
          LIMIT ${limit + offset + 100}
        )
      )
      SELECT DISTINCT ON (id) * FROM matches
      ORDER BY id, rank DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const exerciseIds = result.map((e: any) => e.id);
    const { musclesMap, equipmentMap } = await fetchDetailsForExercises(exerciseIds);

    return c.json(
      result.map((e: any) => mapExercise(e, musclesMap.get(e.id) || [], equipmentMap.get(e.id) || [])),
    );
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
}) as any);

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

  const exerciseIds = result.map((e) => e.id);
  const { musclesMap, equipmentMap } = await fetchDetailsForExercises(exerciseIds);

  return c.json(
    result.map((e: any) => mapExercise(e, musclesMap.get(e.id) || [], equipmentMap.get(e.id) || [])),
  );
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

  const { musclesMap, equipmentMap } = await fetchDetailsForExercises([id]);

  return c.json(mapExercise(result[0], musclesMap.get(id) || [], equipmentMap.get(id) || []));
});

export default exercises;
export type ListExercisesRoute = typeof listExercisesRoute;
export type GetExerciseRoute = typeof getExerciseRoute;
export type SearchExercisesRoute = typeof searchExercisesRoute;
