import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { db } from '@repo/db';
import { foodsTable, foodNutrientsTable, nutrientsTable } from '@repo/db/src/schema';
import { eq, sql, desc, inArray, or } from 'drizzle-orm';
import { NotFoundError } from '../lib/error';
import { toFriendlyCase } from '../lib/utils';

const nutrientInfoSchema = z.object({
  id: z.number(),
  name: z.string(),
  unit: z.string(),
  value: z.string(),
});

const foodSchema = z.object({
  id: z.number().openapi({ description: 'Food ID' }),
  externalId: z.string().optional().openapi({ description: 'External ID from data source' }),
  dataSource: z.string().openapi({ description: 'Data source identifier' }),
  name: z.string().openapi({ description: 'Food name' }),
  brand: z.string().optional().openapi({ description: 'Brand name' }),
  category: z.string().optional().openapi({ description: 'Food category' }),
  servingSize: z.string().optional().openapi({ description: 'Serving size' }),
  servingUnit: z.string().optional().openapi({ description: 'Serving unit' }),
  updatedAt: z.string().datetime().optional().openapi({ description: 'Last update timestamp' }),
  calories: z.string().optional().openapi({ description: 'Calories per serving' }),
  protein: z.string().optional().openapi({ description: 'Protein per serving' }),
  fat: z.string().optional().openapi({ description: 'Fat per serving' }),
  carbohydrates: z.string().optional().openapi({ description: 'Carbohydrates per serving' }),
  fiber: z.string().optional().openapi({ description: 'Fiber per serving' }),
  sugar: z.string().optional().openapi({ description: 'Sugar per serving' }),
  sodium: z.string().optional().openapi({ description: 'Sodium per serving' }),
  other_nutrients: z.array(nutrientInfoSchema).optional().openapi({ description: 'Other detailed nutrients for this food' }),
});

const foods = new OpenAPIHono();

async function fetchNutrientsForFoods(foodIds: number[]) {
  if (foodIds.length === 0) return new Map<number, any[]>();

  const nutrientsResult = await db
    .select({
      foodId: foodNutrientsTable.foodId,
      id: nutrientsTable.id,
      name: nutrientsTable.name,
      unit: nutrientsTable.unit,
      value: foodNutrientsTable.value,
    })
    .from(foodNutrientsTable)
    .innerJoin(nutrientsTable, eq(foodNutrientsTable.nutrientId, nutrientsTable.id))
    .where(inArray(foodNutrientsTable.foodId, foodIds));

  const nutrientsMap = new Map<number, any[]>();
  for (const n of nutrientsResult) {
    if (!nutrientsMap.has(n.foodId)) {
      nutrientsMap.set(n.foodId, []);
    }
    nutrientsMap.get(n.foodId)!.push({
      id: n.id,
      name: n.name,
      unit: n.unit,
      value: n.value,
    });
  }
  return nutrientsMap;
}

const listFoodsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Foods'],
  summary: 'List all foods',
  description: 'Retrieve a list of all foods with pagination',
  request: {
    query: z.object({
      limit: z.string().default('50').transform(Number),
      offset: z.string().default('0').transform(Number),
    }),
  },
  responses: {
    200: {
      description: 'List of foods',
      content: {
        'application/json': {
          schema: z.array(foodSchema),
        },
      },
    },
  },
});

function mapFood(food: any, other_nutrients: any[] = []) {
  const { 
    search_vector, searchVector, rank, ...rest 
  } = food;
  
  return {
    ...rest,
    name: toFriendlyCase(rest.name),
    brand: toFriendlyCase(rest.brand),
    category: toFriendlyCase(rest.category),
    other_nutrients,
  };
}

foods.openapi(listFoodsRoute, async (c) => {
  const { limit, offset } = c.req.valid('query');
  const foodsResult = await db.select().from(foodsTable).limit(limit).offset(offset);
  
  const nutrientsMap = await fetchNutrientsForFoods(foodsResult.map(f => f.id));

  const result = foodsResult.map(food => mapFood(food, nutrientsMap.get(food.id) || []));

  return c.json(result);
});

const getFoodRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Foods'],
  summary: 'Get a food by ID',
  description: 'Retrieve a single food by its ID with its nutrients',
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
  },
  responses: {
    200: {
      description: 'Food details',
      content: {
        'application/json': {
          schema: foodSchema,
        },
      },
    },
    404: {
      description: 'Food not found',
    },
  },
});

const searchFoodsRoute = createRoute({
  method: 'get',
  path: '/search',
  tags: ['Foods'],
  summary: 'Search foods',
  description: 'Search foods using full-text and fuzzy search with filters',
  request: {
    query: z.object({
      q: z.string().min(1, 'Search query is required'),
      limit: z.string().default('50').transform(Number),
      offset: z.string().default('0').transform(Number),
      brand: z.string().optional(),
      dataSource: z.string().optional(),
      category: z.string().optional(),
      minProtein: z.string().optional(),
      maxProtein: z.string().optional(),
      minCalories: z.string().optional(),
      maxCalories: z.string().optional(),
      nutrientName: z.string().optional(),
      minNutrientValue: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Search results',
      content: {
        'application/json': {
          schema: z.array(foodSchema),
        },
      },
    },
  },
});

foods.openapi(searchFoodsRoute, async (c) => {
  const { 
    q, limit, offset, brand, dataSource, category, 
    minProtein, maxProtein, minCalories, maxCalories,
    nutrientName, minNutrientValue 
  } = c.req.valid('query');
  
  const searchQuery = q.trim().split(/\s+/).map(term => `${term}:*`).join(' & ');

  // Build dynamic filters
  const conditions: any[] = [];
  if (brand) conditions.push(sql`brand ILIKE ${'%' + brand + '%'}`);
  if (dataSource) conditions.push(sql`f."dataSource" = ${dataSource}`);
  if (category) conditions.push(sql`category ILIKE ${'%' + category + '%'}`);
  
  // Robust numeric parsing for messy data (handles "< 0,3", "..", etc.)
  const robustCast = (col: any) => {
    const cleaned = sql`regexp_replace(replace(${col}, ',', '.'), '[^0-9.]', '', 'g')`;
    return sql`CAST(NULLIF(CASE WHEN ${cleaned} ~ '^[0-9]+(\\.[0-9]+)?$' THEN ${cleaned} ELSE NULL END, '') AS NUMERIC)`;
  };

  if (minProtein) conditions.push(sql`${robustCast(sql`protein`)} >= ${minProtein}`);
  if (maxProtein) conditions.push(sql`${robustCast(sql`protein`)} <= ${maxProtein}`);
  if (minCalories) conditions.push(sql`${robustCast(sql`calories`)} >= ${minCalories}`);
  if (maxCalories) conditions.push(sql`${robustCast(sql`calories`)} <= ${maxCalories}`);
  
  if (nutrientName) {
    const nutrientResults = await db
      .select({ id: nutrientsTable.id })
      .from(nutrientsTable)
      .where(sql`name ILIKE ${'%' + nutrientName + '%'}`);
    
    if (nutrientResults.length > 0) {
      const ids = nutrientResults.map(n => n.id);
      conditions.push(sql`EXISTS (
        SELECT 1 FROM food_nutrients fn 
        WHERE fn."foodId" = f.id 
        AND fn."nutrientId" IN (${sql.join(ids, sql`, `)})
        ${minNutrientValue ? sql`AND ${robustCast(sql`fn.value`)} >= ${minNutrientValue}` : sql``}
      )`);
    } else {
      conditions.push(sql`FALSE`);
    }
  }

  const whereClause = conditions.length > 0 
    ? sql`AND ${sql.join(conditions, sql` AND `)}` 
    : sql``;

  try {
    const foodsResult = await db.execute(sql`
      WITH matches AS (
        (
          SELECT *, ts_rank(search_vector, to_tsquery('english', ${searchQuery})) as rank
          FROM foods as f
          WHERE f.search_vector @@ to_tsquery('english', ${searchQuery}) ${whereClause}
          LIMIT ${limit + offset + 100}
        )
        UNION ALL
        (
          SELECT *, similarity(name, ${q}) as rank
          FROM foods as f
          WHERE f.name % ${q} ${whereClause}
          LIMIT ${limit + offset + 100}
        )
      )
      SELECT DISTINCT ON (id) * FROM matches
      ORDER BY id, rank DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const nutrientsMap = await fetchNutrientsForFoods(foodsResult.map((f: any) => f.id));

    const result = foodsResult.map((food: any) => mapFood(food, nutrientsMap.get(food.id) || []));

    return c.json(result);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

foods.openapi(getFoodRoute, async (c) => {
  const { id } = c.req.valid('param');
  const [food] = await db.select().from(foodsTable).where(eq(foodsTable.id, id));
  
  if (!food) {
    throw new NotFoundError('Food');
  }

  const nutrientsMap = await fetchNutrientsForFoods([id]);

  return c.json(mapFood(food, nutrientsMap.get(id) || []));
});

export default foods;
export type ListFoodsRoute = typeof listFoodsRoute;
export type GetFoodRoute = typeof getFoodRoute;
export type SearchFoodsRoute = typeof searchFoodsRoute;