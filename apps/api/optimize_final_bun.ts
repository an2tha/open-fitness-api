
import { SQL } from 'bun';
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(import.meta.dirname, '../../../.env') });

async function main() {
  const sql = new SQL(process.env.DATABASE_URL);
  
  try {
    console.log("Optimizing using bun:sql...");
    
    await sql`DROP INDEX IF EXISTS foods_name_trgm_idx`;
    console.log("Foods index dropped");
    await sql`CREATE INDEX IF NOT EXISTS foods_name_trgm_idx ON foods USING GIN (name gin_trgm_ops)`;
    console.log("Foods index created");

    await sql`DROP INDEX IF EXISTS exercises_name_trgm_idx`;
    await sql`CREATE INDEX IF NOT EXISTS exercises_name_trgm_idx ON exercises USING GIN (name gin_trgm_ops)`;
    console.log("Exercises optimized");

    await sql`DROP INDEX IF EXISTS nutrients_name_trgm_idx`;
    await sql`CREATE INDEX IF NOT EXISTS nutrients_name_trgm_idx ON nutrients USING GIN (name gin_trgm_ops)`;
    console.log("Nutrients optimized");

    await sql`DROP INDEX IF EXISTS supplements_name_trgm_idx`;
    await sql`CREATE INDEX IF NOT EXISTS supplements_name_trgm_idx ON supplements USING GIN (name gin_trgm_ops)`;
    console.log("Supplements optimized");

    console.log("Optimization successful!");
  } catch (e) {
    console.error("Optimization failed:", e);
  } finally {
    sql.close();
  }
}

main();
