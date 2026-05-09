# Exercises

## `client.exercises.list(input?)`

GET `/exercises`

### Input

- `limit?: number`
- `offset?: number`

## `client.exercises.search(input)`

GET `/exercises/search`

### Required

- `q: string`

### Optional filters

- `limit?: number`
- `offset?: number`
- `muscle?: string`
- `equipment?: string`

## `client.exercises.get(id)`

GET `/exercises/:id`
