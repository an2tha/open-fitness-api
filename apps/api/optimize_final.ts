import postgres from 'postgres';
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(import.meta.dirname, '../../../.env') });

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    console.log('Starting optimization with a single connection...');

    await sql.begin(async (sql) => {
      console.log('Optimizing foods...');
      await sql`DROP INDEX IF EXISTS foods_name_trgm_idx`;
      await sql`CREATE INDEX IF NOT EXISTS foods_name_trgm_idx ON foods USING GIN (name gin_trgm_ops)`;

      console.log('Optimizing exercises...');
      await sql`DROP INDEX IF EXISTS exercises_name_trgm_idx`;
      await sql`CREATE INDEX IF NOT EXISTS exercises_name_trgm_idx ON exercises USING GIN (name gin_trgm_ops)`;

      console.log('Optimizing nutrients...');
      await sql`DROP INDEX IF EXISTS nutrients_name_trgm_idx`;
      await sql`CREATE INDEX IF NOT EXISTS nutrients_name_trgm_idx ON nutrients USING GIN (name gin_trgm_ops)`;

      console.log('Optimizing supplements...');
      await sql`DROP INDEX IF EXISTS supplements_name_trgm_idx`;
      await sql`CREATE INDEX IF NOT EXISTS supplements_name_trgm_idx ON supplements USING GIN (name gin_trgm_ops)`;
    });

    console.log('Optimization successful!');
  } catch (e) {
    console.error('Optimization failed:', e);
  } finally {
    await sql.end();
  }
}

main();
