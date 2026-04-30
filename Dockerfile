# Use the official Bun image
FROM oven/bun:1.1.7 AS base
WORKDIR /usr/src/app

# Install dependencies
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/loaders/package.json ./apps/loaders/
COPY apps/normalizers/package.json ./apps/normalizers/
COPY packages/db/package.json ./packages/db/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Expose the API port
EXPOSE 3000/tcp

# Run the API from source
CMD [ "bun", "run", "apps/api/src/index.ts" ]
