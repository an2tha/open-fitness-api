# open-fitness-data

Type-safe TypeScript client for the Open Fitness Data API.

## Docs

- [Getting started](./docs/getting-started.md)
- [API reference](./docs/README.md)
- [Types](./docs/types.md)

## Install

```bash
npm i open-fitness-data
```

## Quick start

```ts
import { createOfdClient } from 'open-fitness-data';

const client = createOfdClient({
  apiKey: process.env.OFD_API_KEY,
});

const foods = await client.foods.search({ q: 'kale' });
```

## Type-safe requests

```ts
import { createOfdClient, foodSchema } from 'open-fitness-data';

const client = createOfdClient();
const food = await client.request('/foods/123', foodSchema);
```

## Build

```bash
bun run build
```
