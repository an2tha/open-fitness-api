import { db } from './lib/db';
import { foodsTable, foodNutrientsTable } from '@repo/db/src/schema';
import { inArray } from 'drizzle-orm';

async function main() {
  console.log('Fetching some foods...');
  const foods = await db.select().from(foodsTable).limit(5);
  console.log('Foods:', foods.length);

  if (foods.length === 0) {
    console.log('No foods found');
    return;
  }

  const foodIds = foods.map((f) => f.id);
  console.log('Food IDs:', foodIds);

  const nutrients = await db
    .select({
      foodId: foodNutrientsTable.foodId,
      nutrientId: foodNutrientsTable.nutrientId,
      value: foodNutrientsTable.value,
    })
    .from(foodNutrientsTable)
    .where(inArray(foodNutrientsTable.foodId, foodIds));

  console.log('Nutrients found:', nutrients.length);
  if (nutrients.length > 0) {
    console.log('Sample nutrient:', nutrients[0]);
  } else {
    console.log('No nutrients found for these foods');
  }
}

main();
