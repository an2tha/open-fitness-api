import { createOfdClient } from '@an2tha/open-fitness-data';
import dotenv from 'dotenv';

dotenv.config();

const client = createOfdClient({
  baseUrl: process.env.OFD_BASE_URL || 'http://localhost:3000/api/v1',
  apiKey: process.env.OFD_API_KEY,
});

async function main() {
  const args = process.argv.slice(2);
  let limit = 10;
  const muscleParts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else {
      muscleParts.push(args[i]);
    }
  }

  const muscle = muscleParts.join(' ');

  if (!muscle) {
    console.log('Usage: bun start <muscle-name> [--limit <number>]');
    console.log('Example: bun start chest --limit 5');
    process.exit(1);
  }

  console.log(`Finding exercises for muscle: "${muscle}" (limit: ${limit})...`);

  try {
    const exercises = await client.exercises.search({ muscle, limit });

    if (exercises.length === 0) {
      console.log('No exercises found for this muscle.');
      return;
    }

    console.log(`\nFound ${exercises.length} exercises:\n`);

    exercises.forEach((ex) => {
      console.log(`- ${ex.name}`);
      console.log(`  Equipment: ${ex.equipment?.map((e) => e.name).join(', ') || 'None'}`);
      console.log(`  Muscles: ${ex.muscles?.map((m) => m.name).join(', ')}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error searching for exercises:', error);
  }
}

main();
