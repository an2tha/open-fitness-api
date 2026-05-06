FROM oven/bun:1.3.12 AS base
WORKDIR /usr/src/app

# Install dependencies
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/loaders/package.json ./apps/loaders/
COPY apps/normalizers/package.json ./apps/normalizers/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js app
WORKDIR /usr/src/app/apps/web
ENV NODE_ENV=production
RUN bun run build

# Run the app
EXPOSE 3000
CMD ["bun", "run", "start"]
