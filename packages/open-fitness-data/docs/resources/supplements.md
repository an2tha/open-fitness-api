# Supplements

## `client.supplements.list(input?)`

GET `/supplements`

### Input

- `limit?: number`
- `offset?: number`

## `client.supplements.search(input)`

GET `/supplements/search`

### Required

- `q: string`

### Optional filters

- `limit?: number`
- `offset?: number`

## `client.supplements.get(id)`

GET `/supplements/:id`
