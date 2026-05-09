import { createOfdClient } from 'open-fitness-data';
import dotenv from 'dotenv';

dotenv.config();

const client = createOfdClient({
  baseUrl: process.env.OFD_BASE_URL || 'http://localhost:3000/api/v1',
  apiKey: process.env.OFD_API_KEY,
});

const MEAL = [
  { name: 'Oats', quantity: 100 }, // 100g
  { name: 'Blueberries', quantity: 123 }, // 50g
  { name: 'Milk', quantity: 200 }, // 200ml/g
];

async function analyzeMeal() {
  console.log('Analyzing meal nutrition...\n');

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (const item of MEAL) {
    const results = await client.foods.search({ q: item.name, limit: 1 });

    if (results.length > 0) {
      const food = results[0];
      console.log(`Matched "${item.name}" with "${food.name}"`);

      // Values are typically per 100g in the DB
      const factor = item.quantity / 100;

      const calories = food.calories;
      const protein = food.protein;
      const carbs = food.carbohydrates;
      const fat = food.fat;

      totalCalories += calories * factor;
      totalProtein += protein * factor;
      totalCarbs += carbs * factor;
      totalFat += fat * factor;

      console.log(
        `  ${item.quantity}g: ${Math.round(calories * factor)} kcal, ${Math.round(protein * factor)}g P, ${Math.round(carbs * factor)}g C, ${Math.round(fat * factor)}g F`,
      );
    } else {
      console.log(`Could not find food: ${item.name}`);
    }
  }

  console.log('\n' + '='.repeat(30));
  console.log('TOTAL NUTRITION');
  console.log('='.repeat(30));
  console.log(`Calories: ${Math.round(totalCalories)} kcal`);
  console.log(`Protein:  ${Math.round(totalProtein)} g`);
  console.log(`Carbs:    ${Math.round(totalCarbs)} g`);
  console.log(`Fat:      ${Math.round(totalFat)} g`);
  console.log('='.repeat(30));
}

analyzeMeal().catch(console.error);
