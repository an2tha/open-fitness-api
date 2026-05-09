# Open Fitness Data Examples

This directory contains example applications using the `@packages/open-fitness-data` library.

## Getting Started

1. Ensure you have the library built:

   ```bash
   bun run build --filter open-fitness-data
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up environment variables (optional if using default base URL and no API key):
   Create a `.env` file in the root or in the example directory:
   ```env
   OFD_API_KEY=your_api_key
   OFD_BASE_URL=http://localhost:3000/api/v1
   ```

## Examples

### 1. CLI Food Search

Search for nutritional information of any food from the command line.

```bash
cd examples/cli-food-search
bun start "apple" --limit 5
```

### 2. Nutrition Analyzer

A script that calculates total nutrition for a predefined meal.

```bash
cd examples/nutrition-analyzer
bun start
```

### 3. Exercise Finder

Find exercises targeting specific muscle groups.

```bash
cd examples/exercise-finder
bun start "chest" --limit 5
```

### 4. Single File Demo

A comprehensive demo of all resources in a single file.

```bash
OFD_API_KEY=your_key bun examples/single-file-example.ts
```
