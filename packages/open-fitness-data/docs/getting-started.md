# Getting started

## Install

```bash
npm i open-fitness-data
```

## Create a client

```ts
import { createOfdClient } from 'open-fitness-data';

const client = createOfdClient({
  apiKey: process.env.OFD_API_KEY,
});
```

## Make requests

```ts
const foods = await client.foods.search({ q: 'kale' });
const food = await client.foods.get(123);
```

## Type-safe schema requests

```ts
import { foodSchema } from 'open-fitness-data';

const food = await client.request('/foods/123', foodSchema);
```
