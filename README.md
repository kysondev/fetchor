# fetchor

Lightweight TypeScript library for calling HTTP APIs. It wraps the Fetch API with a small set of helpers for grouping routes, handling params and query strings, and plugging in hooks.

## Features
- Group routes and define endpoints in one place
- Path params (`:id`) and query string helpers
- Global headers or a header function that runs per request
- Custom response parsing (default is `res.json()`)
- Hooks: `onRequest`, `onResponse`, `onError`
- Typed helpers for GET/DELETE and POST/PUT/PATCH bodies
- Works in browsers and Node.js (Node 18+)

## Install

```
npm install fetchor
# or
pnpm add fetchor
# or
yarn add fetchor
```

Requires Node.js 18+ (for built‑in `fetch`) or any modern browser. For older Node versions, use a fetch polyfill.

## Quick start

```ts
import { createFetchor } from "fetchor";

// Configure once for your app
const api = createFetchor({
  baseURL: "https://jsonplaceholder.typicode.com",
  headers: () => ({
    "Content-Type": "application/json",
    // Optionally attach auth tokens here
    // Authorization: `Bearer ${token}`,
  }),
});

// Group related endpoints
const users = api.group("/users");

// Define endpoints
const getAllUsers = users.get("/");
const getUser = users.get<{ id: number }, any>("/:id");
const createUser = users.post<{ name: string; username: string; email: string }, any>("/");

// Call them
const all = await getAllUsers();
const user = await getUser({ params: { id: 2 } });
const created = await createUser({ body: { name: "New", username: "newuser", email: "n@u.com" } });
```

See also: `examples/test.ts`, `examples/test.js`.

## Concepts

- Client: `createFetchor(config)` creates a client bound to a `baseURL`, headers, and hooks.
- Grouping: `client.group(base)` creates a builder for routes that share a base path.
- Endpoints: `group.get/post/put/patch/delete(path, { parse? })` returns a function you call later.
- Calls: Pass `params`, `query`, `body`, and `headers` when invoking the endpoint function.

## API Reference

### createFetchor(config?: FetchorConfig): FetchorClient

Config options:
- `baseURL?: string` - prefix applied to all requests.
- `headers?: Record<string,string> | () => Record<string,string>` - global headers. If a function is provided it runs at request time.
- `onRequest?(ctx)` - runs before `fetch` with `{ endpoint, url, options, payload }`.
- `onResponse?(ctx)` - runs after `fetch` with `{ endpoint, url, options, response }`.
- `onError?(error, ctx)` - runs for HTTP errors and unexpected errors with `{ endpoint, url, options }`.

Returns a `FetchorClient` with:
- `group(base: string): GroupBuilder` - create a namespaced route builder.

### GroupBuilder

Builders create endpoint call functions. By default responses parse as JSON. Provide `opts.parse` to override.

- `get<P = any, R = any>(path, opts?) => (args?: { params?: P; query?: Query; headers?: Record<string,string> }) => Promise<R>`
- `delete<P = any, R = any>(path, opts?) => (args?: { params?: P; query?: Query; headers?: Record<string,string> }) => Promise<R>`
- `post<B = any, R = any>(path, opts?) => (args?: { body?: B; params?: Record<string,string|number>; query?: Query; headers?: Record<string,string> }) => Promise<R>`
- `put<B = any, R = any>(...)`
- `patch<B = any, R = any>(...)`

Path parameters are declared as `:param` within `path`, for example `"/:id"`. They are URL encoded when substituted.

`Query` type: `Record<string, string | number | boolean | undefined>` (undefined values are skipped).

### Errors

Non 2xx responses throw `FetchorError` with fields:
- `name: "FetchorError"`
- `status: number`
- `body: any` — parsed JSON if available, otherwise text

`onError` is called for both HTTP errors and unexpected runtime errors.

## Usage Patterns

### Path params and query

```ts
const posts = api.group("/posts");
const list = posts.get<never, any[]>("/");
const byUser = posts.get<{ id: number }, any[]>("/");

await list({ query: { _limit: 10, _page: 1 } });
await byUser({ query: { userId: 2 } });

const getPost = posts.get<{ id: number }, any>("/:id");
await getPost({ params: { id: 5 } });
```

### Custom response parsing

```ts
const textClient = api.group("/text");
const getRaw = textClient.get("/raw", { parse: (res) => res.text() });
const blobClient = api.group("/files");
const getBlob = blobClient.get("/asset", { parse: (res) => res.blob() });
```

### Per request headers

```ts
const secure = api.group("/secure");
const getProfile = secure.get("/me");
await getProfile({ headers: { Authorization: "Bearer token" } });
```

### Hooks

```ts
const apiWithHooks = createFetchor({
  baseURL: "https://api.example.com",
  onRequest: ({ endpoint, url, options }) => {
    console.debug("→", endpoint, url, options);
  },
  onResponse: ({ endpoint, response }) => {
    console.debug("←", endpoint, response.status);
  },
  onError: (err, { endpoint }) => {
    console.error("✖", endpoint, err);
  },
});
```

## TypeScript

Endpoint builders are generic so you can type parameters, bodies, and return shapes:

```ts
type User = { id: number; name: string; username: string; email: string };
const users = api.group("/users");
const getUser = users.get<{ id: number }, User>("/:id");
const createUser = users.post<Pick<User, "name" | "username" | "email">, User>("/");
```

## Environment

- Node.js: 18+ required (built in `fetch`). ESM and CJS outputs are provided.
- Browsers: Any modern browser with Fetch API support.

## FAQ

- How do I send form data? Provide your own `headers` and `body` (for example `FormData`) and pass a custom `parse` if not JSON.
- How do I cancel requests? Use an `AbortController`. As an advanced option you can set `options.signal` inside `onRequest`.
- Does it retry automatically? No. Keep behavior explicit. Add retries outside or via hooks.

## Roadmap

The following items are planned but not yet implemented:
- Caching helpers
- Retry helpers
- A React hook: `useFetchor`
- Middlewares

## Contributing

Issues and PRs are welcome. See `examples/` to quickly test changes locally.

## License

Licensed under the MIT License. See [LICENSE](LICENSE) for details.
