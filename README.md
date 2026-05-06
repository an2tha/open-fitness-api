# Open Fitness Data

Open Fitness Data provides a high-performance API for fitness-related information, including global food items, supplements, and exercises. It aggregates and normalizes data from international sources into a unified, searchable interface.

## Quick Start

The fastest way to get started is using the automated setup utility which handles environment config, Docker infrastructure, and database schema.

```sh
bun install
bun setup
```

## Management Commands

Once set up, you can manage the data using these commands:

| Command | Description |
|---------|-------------|
| `bun run build` | Rebuild all Docker containers from scratch |
| `bun run setup` | Run the automated setup utility |
| `bun run start` | Start Docker containers (without rebuild) |
| `bun run start:db` | Start only the PostgreSQL database container |
| `bun run dev` | Start development servers (Next.js & Hono API) |
| `bun run stop` | Stop all Docker containers |
| `bun run delete` | Stop and delete all containers and volumes (Wipe DB) |
| `bun run load` | Load data (e.g. `bun run load all`) |
| `bun run normalize` | Run AI normalization (e.g. `bun run normalize nutrients`) |
| `bun run lint` | Run ESLint and Prettier |
| `bun run test` | Run test suite |

## Architecture

- **Web App**: Next.js (Port 3000)
- **API**: Hono / Bun (Port 3001, proxied via /api/v1)
- **DB**: PostgreSQL with Trigram/Full-text search
- **Documentation**: Swagger UI available at `/docs`

## License

Apache License, Version 2.0.
