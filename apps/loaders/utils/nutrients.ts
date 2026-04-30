type SqlClient = {
  unsafe: <T = any>(query: string) => Promise<T[]>;
};

export type NutrientMeta = {
  name: string;
  unit: string;
};

export type FoodNutrientLink = {
  foodId: number;
  nutrientId: number;
  value: string;
};

const literal = (value: unknown) => {
  if (value === undefined || value === null) return 'null';
  return `'${String(value).replace(/'/g, "''")}'`;
};

export const syncNutrientMeta = async (sql: SqlClient, items: NutrientMeta[]) => {
  if (!items.length) return new Map<string, number>();

  const unique = Array.from(new Map(items.map((i) => [`${i.name}|${i.unit}`, i])).values());

  const values = unique.map((i) => `(${literal(i.name)}, ${literal(i.unit)})`).join(',');

  // Insert missing and get all IDs
  await sql.unsafe(`insert into nutrients (name, unit) values ${values} on conflict do nothing`);

  const rows = await sql.unsafe<{ id: number; name: string; unit: string }>(`select id, name, unit from nutrients`);

  return new Map(rows.map((r) => [`${r.name}|${r.unit}`, r.id]));
};

export const insertFoodNutrientLinks = async (sql: SqlClient, links: FoodNutrientLink[]) => {
  if (!links.length) return;

  const values = links.map((l) => `(${l.foodId}, ${l.nutrientId}, ${literal(l.value)})`).join(',');

  return sql.unsafe(
    `insert into food_nutrients ("foodId", "nutrientId", value) values ${values} on conflict do nothing`,
  );
};
