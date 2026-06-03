# Use the official Bun image
FROM oven/bun:1.3.12 AS base
WORKDIR /usr/src/app

# Install system dependencies used by loaders and health checks.
RUN apt-get update && apt-get install -y unzip curl && rm -rf /var/lib/apt/lists/*

# Install dependencies first for better Docker layer caching.
COPY package.json bun.lock turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/loaders/package.json ./apps/loaders/
COPY apps/normalizers/package.json ./apps/normalizers/
COPY apps/web/package.json ./apps/web/
COPY examples/cli-food-search/package.json ./examples/cli-food-search/
COPY examples/exercise-finder/package.json ./examples/exercise-finder/
COPY examples/nutrition-analyzer/package.json ./examples/nutrition-analyzer/
COPY packages/db/package.json ./packages/db/
COPY packages/env-manager/package.json ./packages/env-manager/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/open-fitness-data/package.json ./packages/open-fitness-data/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN bun install --frozen-lockfile

# Copy source code.
COPY . .

ENV NODE_ENV=production
ENV API_PORT=3000
ENV API_PREFIX=/api/v1

# Expose the API port.
EXPOSE 3000/tcp

# Run the API from source.
CMD ["bun", "apps/api/src/index.ts"]
