import { type NewFood } from '@repo/db';

type SqlClient = {
  unsafe: <T = any>(query: string) => Promise<T[]>;
};

const MAX_TEXT_LENGTH = 2056;
const BATCH_SIZE = 250;

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

const literal = (value: unknown) => {
  if (value === undefined || value === null) return 'null';
  return `'${String(value).replace(/'/g, "''")}'`;
};

const text = (value: unknown) => {
  if (value === undefined || value === null) return null;
  return String(value).slice(0, MAX_TEXT_LENGTH);
};

export const insertFoodChunk = async (sql: SqlClient, foods: NewFood[]) => {
  if (!foods.length) return [];

  const results: Array<{ id: number; externalId: string }> = [];

  for (const batch of chunk(foods, BATCH_SIZE)) {
    const values = batch
      .map((food) => {
        return `(${[
          literal(text(food.externalId)),
          literal(text(food.dataSource)),
          literal(text(food.name)),
          literal(text(food.brand)),
          literal(text(food.category)),
          literal(text(food.servingSize)),
          literal(text(food.servingUnit)),
          literal(text(food.calories)),
          literal(text(food.protein)),
          literal(text(food.fat)),
          literal(text(food.carbohydrates)),
          literal(text(food.fiber)),
          literal(text(food.sugar)),
          literal(text(food.sodium)),
        ].join(',')})`;
      })
      .join(',');

    const rows = await sql.unsafe<{ id: number; externalId: string }>(
      `insert into "foods" ("externalId","dataSource","name","brand","category","servingSize","servingUnit","calories","protein","fat","carbohydrates","fiber","sugar","sodium")
       values ${values}
       returning id, "externalId"`,
    );
    results.push(...rows);
  }

  return results;
};
