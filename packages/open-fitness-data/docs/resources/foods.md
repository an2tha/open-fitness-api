# Foods

## `client.foods.list(input?)`

GET `/foods`

### Input

- `limit?: number`
- `offset?: number`

## `client.foods.search(input)`

GET `/foods/search`

### Required

- `q: string`

### Optional filters

- `limit?: number`
- `offset?: number`
- `brand?: string`
- `dataSource?: string`
- `category?: string`
- `minProtein?: string | number | boolean`
- `maxProtein?: string | number | boolean`
- `minCalories?: string | number | boolean`
- `maxCalories?: string | number | boolean`
- `nutrientName?: string`
- `minNutrientValue?: string | number | boolean`

## `client.foods.get(id)`

GET `/foods/:id`
