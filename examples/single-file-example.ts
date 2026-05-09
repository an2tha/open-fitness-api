/**
 * Single file example showing the main features of the Open Fitness Data client.
 *
 * To run:
 * 1. bun install
 * 2. bun run build --filter open-fitness-data
 * 3. OFD_API_KEY=your_key bun examples/single-file-example.ts
 */

import { createOfdClient } from 'open-fitness-data';

const client = createOfdClient({
  // baseUrl: 'http://localhost:3000/api/v1', // Optional: defaults to production
  apiKey: process.env.OFD_API_KEY,
});

async function run() {
  console.log('--- Open Fitness Data SDK Demo ---');

  // 1. Search for foods
  console.log('\n1. Searching for "Greek Yogurt"...');
  const foods = await client.foods.search({ q: 'Greek Yogurt', limit: 3 });
  foods.forEach((f) => console.log(`   - ${f.name} (${f.brandOwner || 'Generic'})`));

  // 2. Search for exercises
  console.log('\n2. Searching for "Push up" exercises...');
  const exercises = await client.exercises.search({ q: 'push up', limit: 3 });
  exercises.forEach((e) => console.log(`   - ${e.name} (Target: ${e.muscles?.[0]?.name})`));

  // 3. Search for supplements
  console.log('\n3. Searching for "Creatine" supplements...');
  const supplements = await client.supplements.search({ q: 'creatine', limit: 3 });
  supplements.forEach((s) => console.log(`   - ${s.name} (${s.brandOwner})`));

  // 4. Check API Health
  console.log('\n4. Checking API Health...');
  const health = await client.health.ping();
  console.log(`   Status: ${health.status}, Version: ${health.version}`);

  console.log('\nDone!');
}

run().catch((err) => {
  console.error('\nError running demo:', err.message);
  console.log('Note: This demo requires a running API or internet access to the production API.');
});
