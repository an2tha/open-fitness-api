import { createOfdClient, foodSchema, type Food } from '../index.ts';

const client = createOfdClient();

const food = await client.request('/foods/123', foodSchema);
const typedFood = await client.request<Food>('/foods/123');

const foodId: number = food.id;
const foodName: string = typedFood.name;

void foodId;
void foodName;

// @ts-expect-error - q is required
client.foods.search({});

// @ts-expect-error - limit must be a number
client.foods.list({ limit: '10' });

// @ts-expect-error - schema overload requires a Zod schema
client.request('/foods/123', { not: 'a schema' });
