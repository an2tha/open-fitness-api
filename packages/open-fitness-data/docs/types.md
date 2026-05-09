# Types and schemas

## Exported schemas

- `foodSchema`
- `foodNutrientSchema`
- `exerciseSchema`
- `muscleSchema`
- `equipmentSchema`
- `supplementSchema`
- `nutrientSchema`
- `healthPingSchema`
- `healthDbSchema`
- `healthStatsSchema`

## Exported types

- `Food`
- `FoodNutrient`
- `Exercise`
- `Muscle`
- `Equipment`
- `Supplement`
- `Nutrient`
- `HealthPing`
- `HealthDb`
- `HealthStats`
- `OfdClient`
- `OfdRequest`
- `HealthResource`
- `FoodsResource`
- `ExercisesResource`
- `SupplementsResource`
- `NutrientsResource`
- `FetchLike`
- `OfdClientConfig`
- `OfdRequestOptions`
- `SearchFoodsInput`
- `SearchExercisesInput`
- `SearchSupplementsInput`
- `SearchNutrientsInput`

## Pattern

```ts
const food = await client.request('/foods/123', foodSchema);
// food is inferred as Food
```
