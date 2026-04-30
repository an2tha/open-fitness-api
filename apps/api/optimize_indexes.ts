
import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log("Replacing GIST with GIN for better performance...");
    
    const targets = ['foods', 'exercises', 'nutrients', 'supplements'];
    
    for (const table of targets) {
      console.log(`Optimizing ${table}...`);
      try {
        await db.execute(sql.raw(`DROP INDEX IF EXISTS ${table}_name_trgm_idx`));
        await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS ${table}_name_trgm_idx ON ${table} USING GIN (name gin_trgm_ops)`));
      } catch (e) {
        console.error(`Failed to optimize ${table}:`, e);
      }
    }
    
    console.log("Optimization complete!");
  } catch (e) {
    console.error("Migration failed:", e);
  }
}

main();
