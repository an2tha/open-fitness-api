import { createOfdClient } from 'open-fitness-data';
import dotenv from 'dotenv';

dotenv.config();

const client = createOfdClient({
  baseUrl: process.env.OFD_BASE_URL || 'https://api.openfitnessdata.org/v1',
  apiKey: process.env.OFD_API_KEY,
});

async function main() {
  const args = process.argv.slice(2);
  let limit = 10;
  const queryParts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else {
      queryParts.push(args[i]);
    }
  }

  const query = queryParts.join(' ');

  if (!query) {
    console.log('Usage: bun start <food-name> [--limit <number>]');
    process.exit(1);
  }

  console.log(`Searching for "${query}" (limit: ${limit})...`);

  try {
    const results = await client.foods.search({ q: query, limit });

    if (results.length === 0) {
      console.log('No results found.');
      return;
    }

    console.log(`\nFound ${results.length} results:\n`);

    results.forEach((food) => {
      console.log(`- ${food.name} (${food.brand || 'Generic'})`);

      const calories = food.calories;
      const protein = food.protein;

      if (calories) console.log(`  Calories: ${calories} kcal`);
      if (protein) console.log(`  Protein: ${protein} g`);

      console.log(`  ID: ${food.id}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error searching for food:', error);
  }
}

main();
