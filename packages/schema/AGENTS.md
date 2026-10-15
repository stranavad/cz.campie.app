# Schema

`@repo/schema`: what `apps/api` and `apps/app` must agree on, written once. Why contracts shape every response: ADR-0005.

1. **Contracts**: the API's wire format and the endpoints that use it. The API routes by them, validates requests and shapes responses; the app calls them and validates responses.
2. **Pure domain modules** both sides must compute identically: pricing (issue 26) and the form engine (issue 28). The public form shows the same price the API stores.

Nothing else. Anything one side alone cares about stays in that app (form-only checks in the app, storage and business rules in the API); otherwise this package becomes a shared dumping ground.

## Scripts

In `packages/schema`, or from the root `pnpm --filter @repo/schema <script>`.

| Script             | Purpose                              |
| ------------------ | ------------------------------------ |
| `pnpm build`       | `tsc` into `dist/`                   |
| `pnpm dev`         | watch (runs with root `pnpm dev`)    |
| `pnpm check-types` | TypeScript                           |
| `pnpm lint`        | Oxlint, module API rules             |
| `pnpm test`        | Vitest once: the pure modules' tests |

Apps import `dist/`; one `exports` entry per module in `package.json`. Turborepo builds this package before the apps; after changing it, running an app script alone needs a build first.

## Approach

- **Runs anywhere.** Plain Zod and TypeScript, loaded in Node and the browser. Lint blocks Node, Nest, React and Drizzle imports.
- **Pure means pure.** Pure modules take everything as arguments, `now` included: no I/O, no clock, no env, no framework. Their tests are the spec's second seam.
- **Schema and type together.** Each schema exports its inferred type, so both apps share it without redeclaring it.
- **Modules mirror the API.** `src/<domain>/` matches `apps/api/src/modules/<domain>/`, so a change in one points at the other.
- **A change here is a change in both apps.** Run the root checks, which cover every workspace. There is no versioning in v1: a shape change updates the API and the app in the same change.

## Layout

Every file sits at `src/<module>/<topic>/<name>.<kind>.ts`, so nothing moves as a module grows.

```
src/
├── shared/                                 building blocks, no domain
│   ├── index.ts                            → @repo/schema/shared
│   ├── endpoint/endpoint.schema.ts         defineEndpoint, Endpoint* types, path helpers
│   ├── errors/error-response.schema.ts     non-2xx body with a stable code
│   ├── pagination/pagination.schema.ts     page query, paged(item)
│   └── primitives/primitives.schema.ts     czk, calendarDate, instant, uuidv7
├── camps/                                  = apps/api/src/modules/camps
│   ├── index.ts                            → @repo/schema/camps
│   ├── camp/camp.resource.ts               the Camp resource
│   ├── camp/create-camp.contract.ts
│   └── turnus/turnus.resource.ts
├── pricing/                                pure module
│   ├── index.ts                            → @repo/schema/pricing
│   └── ...                                 code with *.test.ts beside it
└── form-engine/                            pure module
```

- **Topic**: the resource for `.resource.ts`, the operation's entity for `.contract.ts`. A growing topic splits into siblings, never nests deeper.
- **`<resource>.resource.ts`**: the response shape of one resource, reused by its endpoints, plus its enums as const tuples.
- **`<operation>.contract.ts`**: one endpoint: its `defineEndpoint` plus the shapes it takes (`Params`, `Body`, `Query`) and its own `Response` when it isn't a plain resource. Every endpoint has one.
- **New module**: folder, `index.ts`, an `exports` entry in `package.json` (copy one).

## Naming

- Schema `<name>Schema`, type `<Name>`, always as a pair.
- Resource: a bare noun from `CONTEXT.md`, `campSchema` / `Camp`, `turnusSchema` / `Turnus`.
- Operation parts end in their role: `createCampBodySchema` / `CreateCampBody`, `listTurnusyQuerySchema` / `ListTurnusyQuery`, `...ResponseSchema` / `...Response`.
- Endpoint: `<operation>Endpoint`, `createCampEndpoint`.
- Paginated list: `campPageSchema = paged(campSchema)` in the resource, with `CampPage`; the query extends `pageQuerySchema`.
- Names are unique within a module; across modules they may repeat.

## Endpoints

One `defineEndpoint({ method, path, params?, query?, body?, response?, status? })` per route. The API routes by it (`@Endpoint`), the app calls it (`apiClient.request`).

- **`path`** is relative to `/api`, in Express syntax (`/camps/:campId`). A path with `:params` must declare `params` covering them, a path without them takes none; the compiler enforces both.
- **REST**: plural paths (`/camps`, `/camps/:campId/turnusy`); `GET` list, `GET /:id` one, `POST` create, `PATCH /:id` update, `DELETE /:id` remove. Actions that aren't CRUD are a `POST` on a named sub-path (`/registrations/:registrationId/cancel`).
- **`response`** omitted means no body. **`status`** defaults to 204 without a response, 201 for `POST`, 200 otherwise.
- **Types** come from the endpoint: `EndpointParams/Query/Body/Response<typeof e>` (parsed, the handler side), `EndpointRequest<typeof e>` (input, the client side). Named schema types (`CreateCampBody`) stay for forms and handlers.

## Wire rules

- Instants are ISO strings, `z.iso.datetime()`. Calendar dates are `z.iso.date()` in the Prague calendar. Money is whole CZK, `z.number().int()`. Ids are UUIDv7.
- Fixed value sets are const tuples, one source for `z.enum(...)` here and `pgEnum(...)` in the API.
- Error texts are i18n keys plus params, never Czech literals (the form engine's field errors included); the app translates them.
- A response schema lists only what the client may see: anything left out is stripped by the API before it leaves the server.

## Module API

- **Import by module**: `@repo/schema/<module>` and `@repo/schema/shared`. There is no root entry, and deeper paths aren't exported.
- **`index.ts` is the public API.** A module reaches another only through its `index.ts`; inside a module, import files directly. `shared/` imports no module. No cycles. Lint-enforced.
