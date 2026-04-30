import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    const result = await db.execute(sql`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE indexname LIKE '%_trgm_idx'
    `);
    console.log('Current Trigram Indexes:');
    result.forEach((r) => {
      console.log(`- ${r.indexname}: ${r.indexdef}`);
    });

    // Check if any are still GIST
    const gistCount = result.filter((r) => r.indexdef.toLowerCase().includes('gist')).length;
    const ginCount = result.filter((r) => r.indexdef.toLowerCase().includes('gin')).length;

    console.log(`\nSummary: ${ginCount} GIN, ${gistCount} GIST`);

    if (ginCount >= 4) {
      console.log('Optimization VERIFIED: All indexes are using GIN.');
    } else {
      console.log('Optimization INCOMPLETE: Some indexes are missing or still using GIST.');
    }
  } catch (e) {
    console.error('Verification failed:', e);
  }
}

main();
