
import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log("Applying additives...");
    
    // Extensions
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    
    // Foods
    await db.execute(sql`CREATE INDEX IF NOT EXISTS foods_name_trgm_idx ON foods USING gist (name gist_trgm_ops)`);
    
    // Exercises
    await db.execute(sql`CREATE INDEX IF NOT EXISTS exercises_name_trgm_idx ON exercises USING gist (name gist_trgm_ops)`);
    
    // Nutrients
    await db.execute(sql`CREATE INDEX IF NOT EXISTS nutrients_name_trgm_idx ON nutrients USING gist (name gist_trgm_ops)`);
    
    // Supplements
    try {
      await db.execute(sql`ALTER TABLE supplements ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', name || ' ' || COALESCE(brand, ''))) STORED`);
    } catch(e) { console.log("search_vector might already exist or failed"); }
    
    await db.execute(sql`CREATE INDEX IF NOT EXISTS supplements_search_idx ON supplements USING gin (search_vector)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS supplements_name_trgm_idx ON supplements USING gist (name gist_trgm_ops)`);
    
    console.log("Done!");
  } catch (e) {
    console.error("Migration failed:", e);
  }
}

main();
