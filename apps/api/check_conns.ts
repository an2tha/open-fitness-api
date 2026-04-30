import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    const result = await db.execute(sql`SELECT count(*) FROM pg_stat_activity`);
    console.log('Current active connections:', result[0].count);

    const max = await db.execute(sql`SHOW max_connections`);
    console.log('Max connections allowed:', max[0].max_connections);
  } catch (e) {
    console.error('Failed to check connections:', e);
  }
}

main();
