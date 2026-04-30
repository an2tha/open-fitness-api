# Open Fitness Data

Open Fitness Data is a comprehensive open source project that provides a high performance API for fitness related information including food items, supplements, and exercises. The system aggregates and normalizes data from multiple international sources to provide a unified interface for developers and researchers.

## Core Features

The platform utilizes a PostgreSQL backend with specialized indexing for trigram and full text search. This architecture ensures efficient data retrieval and fuzzy matching capabilities.

Integration with Large Language Models allows for the automated normalization of nutrient names and exercise patterns from disparate data sources.

The project is designed for portability and can be deployed in private environments using Docker.

A complete OpenAPI 3.0 specification is provided for automated documentation and client generation.

## Getting Started

### Prerequisites

You must have Bun installed on your system to manage dependencies and execute the application. A PostgreSQL instance is required for data storage.

### Installation

Clone the repository and install the necessary dependencies using the following command.

```sh
bun install
```

### Automatic Setup

The project includes a comprehensive setup utility that manages environment configuration, infrastructure deployment, and database synchronization.

```sh
bun start
```

### Manual Configuration

If you prefer to configure the system manually, copy the example environment file.

```sh
cp .env.example .env
```

Synchronize the database schema using the following command.

```sh
bun run --filter api db:push
```

### Infrastructure

Deploy the database and associated services using Docker Compose.

```sh
docker-compose up -d
```

## Data Loading

The database is initialized without records. You must execute the data loaders to populate the system with information from various sources.

```sh
bun run --filter loaders start all
```

Please note that the initial synchronization process may require significant time and resources depending on your system specifications.

## License

This software is released under the Apache License, Version 2.0. Detailed information regarding usage and distribution can be found in the LICENSE file.
