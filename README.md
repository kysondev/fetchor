# 🪶 fetchor

[![npm version](https://img.shields.io/npm/v/fetchor.svg?color=blue)](https://www.npmjs.com/package/fetchor)
[![bundle size](https://img.shields.io/bundlephobia/minzip/fetchor?color=teal)](https://bundlephobia.com/package/fetchor)
[![license](https://img.shields.io/github/license/kysondev/fetchor.svg)](./LICENSE)

**fetchor** is a lightweight TypeScript library built on top of the Fetch API. It provides a simple way to define and call typed endpoints, group routes, and plug in request and response hooks without adding heavy abstractions.

## Features
- **Type-safe**: full TypeScript support for params, query, and response types.
- **Simple route organization**: group endpoints under shared base paths.
- **Flexible configuration**: global headers, dynamic header functions, and hooks.
- **Composable design**: call endpoints like functions without extra wrappers.
- **Custom response parsing**: use .json(), .text(), .blob(), or any parser.
- **Hooks for lifecycle control**: intercept requests, responses, and errors.
- **Modern compatibility**: works in browsers and Node.js 18+.

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

Builders generate endpoint call functions.  
By default, responses are parsed as JSON. Override with `opts.parse`.

``` ts
group.get<P, R>(path, opts?)  
group.post<B, R>(path, opts?)  
group.put<B, R>(path, opts?)  
group.patch<B, R>(path, opts?)  
group.delete<P, R>(path, opts?)
```

#### Parameters
- path: The route for this endpoint (e.g. "/:id" or "/users").
- opts: Optional settings, such as a custom parse function for handling the response.
- P: Type of the path parameters (for example { id: number }).
- B: Type of the request body (used in POST, PUT, PATCH).
- R: Type of the response data (the value returned by the call).

Path parameters use `:param`, and query parameters automatically skip undefined values.

## Usage Patterns

### Path params and query

```ts
const posts = api.group("/posts");
const list = posts.get<never, any[]>("/");
const byUser = posts.get<{ id: number }, any[]>("/");

await list({ query: { limit: 10, page: 1 } });
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
    console.debug("Request: ", endpoint, url, options);
  },
  onResponse: ({ endpoint, response }) => {
    console.debug("Response: ", endpoint, response.status);
  },
  onError: (err, { endpoint }) => {
    console.error("Error: ", endpoint, err);
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

Contributions are welcome.  
See `examples/` to test locally, and mark beginner-friendly tasks as `good first issue`.

## License

Licensed under the MIT License. See [LICENSE](LICENSE) for details.
