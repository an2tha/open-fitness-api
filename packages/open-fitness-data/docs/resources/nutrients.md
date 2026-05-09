# Nutrients

## `client.nutrients.list(input?)`

GET `/nutrients`

### Input

- `limit?: number`
- `offset?: number`

## `client.nutrients.search(input)`

GET `/nutrients/search`

### Required

- `q: string`

### Optional filters

- `limit?: number`
- `offset?: number`

## `client.nutrients.get(id)`

GET `/nutrients/:id`
