# Client configuration

## createOfdClient(config)

```ts
createOfdClient({
  baseUrl: 'https://api.ofdata.dev/v1',
  apiKey: 'ofd_xxx',
  apiKeyHeader: 'Authorization',
  headers: { 'X-Client': 'my-app' },
  fetch: customFetch,
});
```

### Options

- `baseUrl`: API root, defaults to `https://api.ofdata.dev/v1`
- `apiKey`: sent on every request
- `apiKeyHeader`: choose `Authorization` (Bearer token) or `X-API-Key`
- `headers`: merged into every request
- `fetch`: custom fetch implementation for tests or non-browser runtimes

## request(path, schema?, options?)

- With a schema, the response is parsed and typed from Zod
- Without a schema, the response is returned as `T`

```ts
const food = await client.request('/foods/123', foodSchema);
```
