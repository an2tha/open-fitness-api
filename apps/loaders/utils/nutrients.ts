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

const MAX_TEXT_LENGTH = 2056;
const NUTRIENT_BATCH_SIZE = 250;
const LINK_BATCH_SIZE = 500;

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

export const syncNutrientMeta = async (sql: SqlClient, items: NutrientMeta[]) => {
  if (!items.length) return new Map<string, number>();

  const unique = Array.from(new Map(items.map((i) => [`${i.name}|${i.unit}`, i])).values());

  for (const batch of chunk(unique, NUTRIENT_BATCH_SIZE)) {
    const values = batch.map((i) => `(${literal(text(i.name))}, ${literal(text(i.unit))})`).join(',');
    await sql.unsafe(`insert into "nutrients" (name, unit) values ${values} on conflict do nothing`);
  }

  const rows = await sql.unsafe<{ id: number; name: string; unit: string }>(`select id, name, unit from "nutrients"`);

  return new Map(rows.map((r) => [`${r.name}|${r.unit}`, r.id]));
};

export const insertFoodNutrientLinks = async (sql: SqlClient, links: FoodNutrientLink[]) => {
  if (!links.length) return;

  for (const batch of chunk(links, LINK_BATCH_SIZE)) {
    const values = batch.map((l) => `(${l.foodId}, ${l.nutrientId}, ${literal(text(l.value))})`).join(',');
    await sql.unsafe(
      `insert into "food_nutrients" ("foodId", "nutrientId", value) values ${values} on conflict do nothing`,
    );
  }
};
