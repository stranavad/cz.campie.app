# API

Server data flows through three layers: `apiClient` (`src/lib/api/`, a thin `fetch` wrapper) → feature services → [TanStack Query](https://tanstack.com/query) hooks ([LLM index](https://tanstack.com/query/latest/llms.txt)). Shapes and endpoints come from `@repo/schema`. Failures: [error-handling.md](error-handling.md).

## Design

- **Same origin only.** Every call goes to `/api/...` on the current host: proxied by Vite locally, rewritten by Vercel in production (ADR-0001). Session cookies are httpOnly; the app never sees or stores a token.
- **Components only see query hooks**, never the client (lint: only `*.service.ts` imports `apiClient`), so caching, loading and invalidation are handled in one place.
- **Every response is validated** against its contract schema, and the client only ever throws `ApiError` subclasses. A backend drift shows up as a clear error at the boundary, not as `undefined` deep in the UI.
- **The contract is the source of truth**: a new or changed endpoint starts in `@repo/schema/<module>`. Frontend-only rules extend it inside the feature rather than redefining it.
- **Concerns of every request** live in `src/lib/api/request-hooks.ts`, not in individual calls: the CSRF header on mutations, the Organisation header on admin requests (ADR-0001), handling of an expired session.
- `apiClient.request(endpoint, { params, query, body, signal })` builds the URL, types the call from the endpoint and validates the response.
- `QueryClient` defaults sit in `src/core/application/query-client.ts`; tune per query only when a case needs it.

## Feature API

A feature's `api/` splits by responsibility:

- `<name>.service.ts`: plain calls, one method per endpoint, each one `apiClient.request(<endpoint>, ...)`.
- `<name>.keys.ts`: query key factory; all keys under the feature's root key, so invalidating a subtree is easy.
- `<name>.queries.ts`: query options and query and mutation hooks.

Mutations invalidate what they change and stay pending until fresh data has loaded, so the UI never shows stale data after a save.
