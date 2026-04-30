
import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    const result = await db.execute(sql`SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'`);
    console.log("Extensions:", result);
    
    if (result.length === 0) {
      console.log("pg_trgm extension is MISSING.");
    } else {
      console.log("pg_trgm extension is INSTALLED.");
    }
  } catch (e) {
    console.error("Error checking extensions:", e);
  }
}

main();
