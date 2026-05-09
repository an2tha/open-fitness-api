# Open Fitness Data

Open Fitness Data provides a high-performance API for fitness-related information, including global food items, supplements, and exercises. It aggregates and normalizes data from international sources into a unified, searchable interface.

## Setup

Follow these steps to get the project running locally:

### 1. Environment Configuration

Copy the example environment file and generate a master key for API management:

```bash
cp .env.example .env
```

Open `.env` and add a `MASTER_KEY` (a long random string). This key is used to manage API keys.
NOTE: API Keys are still WIP, the package should run fine without the API Keys (for now)

### 2. Infrastructure

Build the project and start the Docker containers (PostgreSQL):

```bash
bun install
bun run build
docker compose up -d
```

### 3. Load Data

Load the fitness data into your database. You can load all sources at once:

```bash
bun run load all
```

*Individual sources can also be loaded, e.g., `bun run load foods usda`.*

### 4. Start Development Server

Run the Next.js application with embedded API routes:

```bash
bun run dev
```

The app will be available at `http://localhost:3000` and API documentation at `http://localhost:3000/docs`.

## Management Commands

Once set up, you can manage the data using these commands:

> Note: run `bun run build` first so Docker can mount the generated Next.js artifacts.

| Command                | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| `bun run build`        | Build the workspace and Next production artifacts         |
| `bun run docker:build` | Build the workspace and Next production artifacts         |
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
