# Open Fitness Data

Open Fitness Data provides a high-performance API for fitness-related information, including global food items, supplements, and exercises. It aggregates and normalizes data from international sources into a unified, searchable interface.

## Quick Start

The fastest way to get started is using the automated setup utility which handles environment config, Docker infrastructure, and database schema. Docker Compose reads the root `.env`, so keep it in sync with `.env.example`.

```sh
bun install
bun setup
```

## Management Commands

Once set up, you can manage the data using these commands:

> Note: run `bun run build` first so Docker can mount the generated Next.js artifacts.

| Command                | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| `bun run build`        | Build the workspace and Next production artifacts         |
| `bun run docker:build` | Build the workspace and Next production artifacts         |
| `bun run setup`        | Run the automated setup utility                           |
| `bun run start`        | Start Docker containers (without rebuild)                 |
| `bun run start:db`     | Start only the PostgreSQL database container              |
| `bun run dev`          | Start the Next.js web app with embedded API routes        |
| `bun run stop`         | Stop all Docker containers                                |
| `bun run delete`       | Stop and delete all containers and volumes (Wipe DB)      |
| `bun run load`         | Load data (e.g. `bun run load all`)                       |
| `bun run normalize`    | Run AI normalization (e.g. `bun run normalize nutrients`) |
| `bun run lint`         | Run ESLint and Prettier                                   |
| `bun run test`         | Run test suite                                            |

## Architecture

- **Web App**: Next.js (Port 3000)
- **API**: Hono / Bun embedded in the web app via `/api/v1`
- **DB**: PostgreSQL with Trigram/Full-text search
- **Documentation**: Swagger UI available at `/docs`

## Type-Safe Client SDK

The project includes a first-class TypeScript SDK (`@packages/open-fitness-data`) for easy integration:

- **Full Type Safety**: Auto-generated types for all API resources.
- **Automatic Parsing**: Nutritional values are automatically parsed from strings to numbers.
- **Built-in Validation**: Powered by Zod for runtime data integrity.
- **Isomorphic**: Works in Node.js, Bun, and the browser.

```ts
import { createOfdClient } from 'open-fitness-data';

const client = createOfdClient();
const foods = await client.foods.search({ q: 'kale' });
console.log(foods[0].calories); // Already a number!
```

## Examples

Check out the [examples](./examples) directory for sample applications using the `@packages/open-fitness-data` library:

- [CLI Food Search](./examples/cli-food-search): Simple command-line tool to search for foods.
- [Nutrition Analyzer](./examples/nutrition-analyzer): Calculate total nutrition for a meal.
- [Exercise Finder](./examples/exercise-finder): Find exercises for specific muscles.

## License

Apache License, Version 2.0.
