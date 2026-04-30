import { type NewFood } from '@repo/db';

type SqlClient = {
  unsafe: <T = any>(query: string) => Promise<T[]>;
};

const literal = (value: unknown) => {
  if (value === undefined || value === null) return 'null';
  return `'${String(value).replace(/'/g, "''")}'`;
};

export const insertFoodChunk = async (sql: SqlClient, foods: NewFood[]) => {
  if (!foods.length) return [];

  const values = foods
    .map((food) => {
      return `(${[
        literal(food.externalId),
        literal(food.dataSource),
        literal(food.name),
        literal(food.brand),
        literal(food.category),
        literal(food.servingSize),
        literal(food.servingUnit),
        literal(food.calories),
        literal(food.protein),
        literal(food.fat),
        literal(food.carbohydrates),
        literal(food.fiber),
        literal(food.sugar),
        literal(food.sodium),
      ].join(',')})`;
    })
    .join(',');

  return sql.unsafe<{ id: number; externalId: string }>(
    `insert into foods ("externalId","dataSource","name","brand","category","servingSize","servingUnit","calories","protein","fat","carbohydrates","fiber","sugar","sodium") 
     values ${values} 
     returning id, "externalId"`,
  );
};
