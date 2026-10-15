# API

NestJS 12 (ES modules, Express) + Drizzle 1.0 RC + PostgreSQL 18 with row-level security per Organisation. Wire shapes and endpoints come from [`@repo/schema`](../../packages/schema/AGENTS.md). Versions and toolchain rules: ADR-0003. Single source of truth for humans and agents working in this app; `apps/app` is out of scope here.

| Doc                                  | Read when you...                                     |
| ------------------------------------ | ---------------------------------------------------- |
| [docs/testing.md](docs/testing.md)   | write or change a test, add a fake, check isolation  |

## Scripts

In `apps/api`, or from the root `pnpm --filter api <script>`.

| Script             | Purpose                                                   |
| ------------------ | --------------------------------------------------------- |
| `pnpm dev`         | `tsc --watch` + `node --watch dist/main.js`               |
| `pnpm build`       | `tsc` into `dist/`                                        |
| `pnpm start`       | run the last build                                        |
| `pnpm check-types` | TypeScript                                                |
| `pnpm lint`        | Oxlint, type-aware, warnings fail, layer rules            |
| `pnpm test`        | Vitest once                                               |
| `pnpm test:watch`  | Vitest watch                                              |
| `pnpm db:generate` | migration from the schema: `--name <what-changed>`        |
| `pnpm db:migrate`  | apply migrations                                          |
| `pnpm db:studio`   | Drizzle Studio                                            |

First run: root `pnpm docker:up`, `cp .env.example .env`, `pnpm db:migrate`, `pnpm dev`.

## Architectural layering

Strict, one-way flow:

```
Controller → Service → Repository → Database (unit of work)
                ↓
              Ports (Clock, MailSender, FileStorage, PdfRenderer, PaymentGateway, KeyProvider)
```

- **Controllers inject only services.** Never repositories, the database or ports.
- **Repositories inject only the unit of work's database handle** and pure helpers. Not services, not other repositories, not config, not ports.
- **Services inject repositories, other services and ports.** A service may use the database handle directly for reads that span entities (joins, aggregations, exports) and wouldn't earn a repository method. Plain CRUD always goes through the repository.
- **Services always exist** between controller and repository. Even a thin passthrough stays: it is the seam where permissions, audit, business rules and cross-entity validation land.
- **Every external service is a port.** An abstract class injected into services, with a production and a local or test adapter chosen by configuration (issue 06). A service never imports an SDK (Resend, AWS, Comgate) directly.
- **No `forwardRef` between feature modules.** If you reach for it, the dependency direction is wrong; fix the structure.

The layer rules are lint-enforced (`oxlint/boundaries.ts`): controllers import no repositories, database or Drizzle; repositories import no services or ports; `db/` imports nothing from `modules/` or `repositories/`.

## Tenancy and the unit of work

- **All Organisation data access runs inside a unit of work** (issue 07). It opens a transaction, sets the current Organisation, and is the only source of the database handle repositories use. Outside a unit of work, RLS returns no rows and rejects writes.
- The unit of work is opened by request infrastructure (issue 14: host, admin header, gateway path) or by a job from its payload, never by a controller or repository.
- **The Organisation never comes from client input.** Inserts take `organisationId` from the unit of work; a body or query carrying it is a bug.
- **RLS is the second line, not the first.** Services still check permissions; RLS stops whatever a missed check lets through. A row of another Organisation is invisible, so lookups by its id end as not-found.
- Platform-level tables (Organisations themselves, admin identities, operator records) have their own narrow access, listed on the platform allow list (issue 07).

## Folder layout

```
apps/api/src/
  core/                              infrastructure, no domain logic
    config/                          env schema + loader, validated before Nest starts
    database/                        Drizzle setup, pg and Neon adapters, unit of work
    ports/<port>/                    <port>.port.ts, <technology>-<port>.adapter.ts, <port>.module.ts
    http/                            global pipe, @Endpoint decorators, exception filters
    health/
  db/                                Drizzle schema
    <domain>/<table>.ts              one file per table, no `.entity.` suffix
    <domain>/relations.ts            defineRelationsPart for this domain
    helpers/                         ids, timestamps, the organisation policy helper
    schema.ts                        barrel: re-exports all tables
    relations.ts                     composes all defineRelationsPart
  repositories/                      @Global RepositoriesModule
    <domain>/<entity>/
      <entity>.entity.ts             XxxEntity
      <entity>.repository.ts         XxxRepository
    repositories.module.ts
  modules/                           NestJS feature modules
    <domain>/
      <entity>/
        services/<entity>.service.ts
        <entity>.controller.ts
        <entity>.integration.test.ts
      <domain>.module.ts             controllers + services of this domain
  testing/                           harness, fakes, fixtures (not built)
  app.module.ts
  app.setup.ts                       setup shared by main.ts and tests
  main.ts
```

- Domains and entities are named with `CONTEXT.md` terms, Czech ones included: `camps/turnus/`, `TurnusRepository`, table `turnusy`.
- Cross-cutting infrastructure (sessions, audit, jobs) goes in `core/` once it exists, in the same shape.
- Not every module needs every folder; add one when the module has that concern.

## Naming

### Files

kebab-case throughout: `camp.entity.ts`, `camp.repository.ts`, `camp.service.ts`, `camp.controller.ts`, `camps.module.ts`. Table files `db/<domain>/<table>.ts` have no `.entity.` suffix: tables are not entities, classes are.

### Classes

| Concept    | Name                                                                   |
| ---------- | ---------------------------------------------------------------------- |
| Entity     | `XxxEntity`                                                            |
| Repository | `XxxRepository`                                                        |
| Service    | `XxxService`                                                           |
| Controller | `XxxController`                                                        |
| Port       | the capability: `Clock`, `MailSender`, `FileStorage`                   |
| Adapter    | technology + port: `ResendMailSender`, `LogMailSender`, `FakeMailSender` |

Request, response and endpoint names come from `@repo/schema` (`Camp`, `CreateCampBody`, `createCampEndpoint`); no DTO classes.

### Drizzle-inferred types

- `XxxSelectModel = InferSelectModel<typeof xxxTable>`, `XxxInsertModel = InferInsertModel<typeof xxxTable>`.
- Declare only when consumed. No preemptive aliases.

## Entities

- Class `XxxEntity` in `repositories/<domain>/<entity>/<entity>.entity.ts`; the constructor takes `XxxSelectModel`.
- Fields are `readonly`, copied from the row in the constructor.
- `.toDto(): Xxx` (the resource type from `@repo/schema`) is **the single place where a row becomes wire data**.
- Instants become ISO strings via `.toISOString()`. Calendar dates (Early bird date, start of a Turnus) stay `YYYY-MM-DD` strings in the Prague calendar. Money stays whole CZK integers.
- No business logic beyond data shaping. Rules live in services or, when both apps need them, in a pure module of `@repo/schema` (pricing, form engine).

## Repositories

Canonical method set, extended with entity-specific reads as needed:

```ts
public list(): Promise<XxxEntity[]>
public getById(id: string): Promise<XxxEntity | null>
public getByIdOrThrow(id: string): Promise<XxxEntity>       // throws NotFoundException
public create(input: CreateXxx): Promise<XxxEntity>
public update(id: string, input: UpdateXxx): Promise<XxxEntity> // throws NotFoundException
public remove(id: string): Promise<void>                    // throws NotFoundException
```

- `getById` returns `null`; `getByIdOrThrow` throws. Offer both when callers need the choice.
- `update` and `remove` throw on a miss: they are writes, a missing target is a 404.
- Entity-specific reads have intent-revealing names: `getBySlug`, `listByTurnus`, `getByVariableSymbol`. No generic `findWhere`.
- All repositories are registered in `repositories/repositories.module.ts`, which is `@Global`; feature modules don't import it.
- **No base repository class.** Each repository is hand-written for its entity.

## Services

- Mirror repository method names for thin passthroughs (`list`, `getByIdOrThrow`, `create`, `update`, `remove`).
- Intent-named methods for orchestration: `submitRegistration`, `moveToTurnus`, `cancelParticipant`.
- Services own permission checks, audit entries (issue 10, written in the same unit of work as the change) and calls to ports.
- Time comes from the `Clock` port; pure modules get `now` as an argument.
- A domain's services are registered in its feature module and exported so other modules can import them.

## Controllers and endpoints

- One controller per entity at `modules/<domain>/<entity>/<entity>.controller.ts`, injecting only services.
- **Route by the contract.** The controller has no path (`@Controller()`); each route is `@Endpoint(createCampEndpoint)` with the endpoint from `@repo/schema`, which sets method, path, status and response shaping. Inputs come through `@EndpointParams(e)`, `@EndpointQuery(e)` and `@EndpointBody(e)`. Never `@Get`, `@Post` or `@HttpCode` by hand for a contract route.
- **Return types are checked.** `@Endpoint` only compiles on a method returning `Promise<EndpointResponse<typeof e>>` (`Promise<void>` without a response).
- **Return `entity.toDto()`.** The endpoint then passes the response through its schema, which drops unknown keys, so a field nobody declared can't leak (health data, rodná čísla). A response that doesn't match its schema is a server bug and fails as 500.
- Access is declared on every controller (admin, guardian, operator, public; issue 14), with the permission area where it applies. No route is reachable by accident.
- No JSDoc on controller methods; the contract documents the route.

## Validation

- **Every body, query and param has a schema.** The global `StandardSchemaValidationPipe` validates it and hands over the parsed value (unknown keys stripped, defaults applied). Unvalidated input is a bug waiting.
- **Validation is not business logic.** Schemas check the wire format for a clear 400; business rules live in services and pure modules and apply to every caller.
- No DTO classes, no `nestjs-zod`, no class-validator.

## Errors

- Repositories throw `NotFoundException` from `getByIdOrThrow`, `update` and `remove` on a miss; services throw Nest HTTP exceptions (`ForbiddenException`, `ConflictException`, ...).
- Error bodies follow `ErrorResponse` from `@repo/schema/shared`. Errors the frontend must tell apart carry a stable `code`; the frontend translates the code and never shows `message` to users.
- A global filter maps everything else to 500 without leaking internals.
- No per-endpoint try/catch for common failure modes. Let exceptions bubble.

## Config

- `main.ts` validates the env with Zod (`core/config/env.schema.ts`) before importing `AppModule`, so a misconfigured app never boots half-working. The schema is the single source of truth for what the app needs.
- `APP_ENV` (`local` | `test` | `production`) selects the source: `local` reads `.env` (gitignored, from `.env.example`), `test` reads `.env.test` (committed, secret-free), `production` reads deployment env vars. Real env vars always win over a file.
- Code depends on typed `ConfigService<Env, true>`, never `process.env` (lint-enforced outside config and tooling files).
- Port adapters are chosen by configuration; an invalid or mixed combination refuses to boot (issue 06).
- A new variable is a schema change first, then a value in `.env.example`, `.env.test` and the deployment.

## Code conventions

### Visibility modifiers

Every method on controllers, services and repositories carries an explicit `public` or `private`. Constructors and entity methods are exempt.

### Control flow - always brace

Every `if` / `else` / `for` / `while` has a block body, even for one statement:

```ts
// no
if (!turnus) throw new NotFoundException();

// yes
if (!turnus) {
    throw new NotFoundException();
}
```

### Spacing

Separate the logical steps inside a method with blank lines: resolve and validate, do the work, return.

### Comments

- Comments explain **why**, not what. Delete any comment that restates the code.
- **No ADR or issue pointers in code comments.** The rationale lives in the ADR; a comment that earns its place states the reason directly.
- No class-level JSDoc that only lists the methods below it.
- Keep genuine caveats: non-obvious ordering, best-effort or failure semantics, known performance trade-offs.

### JSDoc - services and repositories only

Required on every service and repository method:

```ts
/**
 * Get a Turnus by id, or throw if missing.
 * @param id Turnus id
 * @throws {NotFoundException} when no Turnus has this id in the current Organisation
 */
```

- The title is short and starts with a verb.
- One `@param` per parameter, minimal description.
- `@throws` only in the file where the `throw` physically lives; passthroughs don't restate it.
- **No `@returns`** unless the type alone is ambiguous (opaque string, unlabeled tuple, sentinel); then one line about meaning, not type.
- No multi-paragraph descriptions.

### TypeScript and ESM (ADR-0003)

- Relative imports end in `.ts`; `tsc` rewrites them.
- Injected classes are value imports: `import type` breaks dependency injection at runtime. Non-class dependencies are injected via `@Inject(TOKEN)`.
- API code runs only through `tsc` and Vitest; tsx, ts-node and esbuild drop decorator metadata.
- No `any`; prefer inferred types.

### Logging

Nest's `Logger`, in controllers, services and infrastructure. Log ids, never personal data: no names, emails, rodná čísla, health data or document contents. Requests are logged by infrastructure.

## Database

### Schema

- One Drizzle table per file under `db/<domain>/<table>.ts`, re-exported from `db/schema.ts`. pg-core is imported as a namespace: `import * as p from 'drizzle-orm/pg-core'`.
- **Every Organisation-owned table** has `organisation_id`, is created with `p.pgTable.withRLS(...)` and gets its policy from the shared helper in `db/helpers/`. A table without them fails CI unless it is on the platform allow list (issue 07).
- Ids are UUIDv7. Money is integer CZK. Instants are `timestamptz`.
- camelCase in TypeScript, snake_case in PostgreSQL.
- Composite primary keys are named `<table>_pkey`; composite foreign keys target the parent's composite key and are named `<table>_<parent>_fkey`.
- Foreign keys cascade down the chain, never skipping a level.
- `.notNull()` is declared in TypeScript even where drizzle-kit drops it from the SQL for primary key columns.
- Const tuples from `@repo/schema` are the single source for both `z.enum(...)` and `p.pgEnum(...)`.
- **Table comments are minimal**, none by default. Keep one only for what the DDL can't express and no other document covers (a deliberately missing foreign key, a non-obvious default). Domain meaning belongs in `CONTEXT.md`, rationale in ADRs; never cite an ADR from a schema file.

### Relations

Per-domain `defineRelationsPart` in `db/<domain>/relations.ts`, composed in `db/relations.ts` and passed to `drizzle({ client, relations })`.

### Migrations

- Generated by `pnpm db:generate --name <what-changed>` (drizzle-kit) into `drizzle/<timestamp>_<name>/`. Read the SQL before committing; commit schema and migration together.
- The only manual edits to a generated migration: prepending `CREATE EXTENSION IF NOT EXISTS <name>;`, and appending clearly commented seed `INSERT`s a feature's invariants depend on. Regenerating drops seeds, so re-append them.
- What drizzle-kit can't express (role grants, audit table privileges) goes in a separate custom migration (`drizzle-kit generate --custom`), not into a generated one.
- **Applied migrations are history.** Once one ran outside your machine, never edit it; add a new one.
- A test fails when the schema changed without a migration ([docs/testing.md](docs/testing.md)).

## What we deliberately do not do

- **No controller → repository shortcuts.** Always through a service, even a bare one.
- **No repository → repository injection.** Compose in services.
- **No services using the database for plain CRUD.** Only for reads that don't earn a repository method.
- **No generic base repository class.**
- **No database access outside a unit of work**, and no raw pool or connection in application code.
- **No Organisation from client input.**
- **No external SDK outside its adapter.** Services see ports.
- **No DTO classes, no `nestjs-zod`, no class-validator.**
- **No OpenAPI or Swagger in v1.** The shared contracts type both sides; docs can be generated from them later.
- **No API versioning in v1.** One frontend; a shape change updates both apps in the same change.
- **No mocked database in tests.** Fakes only at the ports.
- **No `new Date()` or `Date.now()` outside the Clock adapters**, no `process.env` outside config. Both lint-enforced.
- **No NestJS CLI, tsx or ts-node** (ADR-0003).
- **No `@returns` JSDoc by default.**
- **No compatibility shims.** Change a method, migrate every caller, delete the old one.
- **No documentation files (`*.md`) unless asked.**

## Adding an entity - checklist

1. Table at `db/<domain>/<table>.ts` with `withRLS` and the organisation policy (or on the platform allow list); export from `db/schema.ts`.
2. Relations in the domain's `relations.ts`.
3. `pnpm db:generate --name <what-changed>`; read the SQL.
4. Resource and one contract per operation in `packages/schema/src/<domain>/<entity>/`.
5. Entity and repository at `repositories/<domain>/<entity>/`; register in `repositories.module.ts`.
6. Service at `modules/<domain>/<entity>/services/<entity>.service.ts`, with permission checks and audit.
7. Controller with `@Endpoint` routes at `modules/<domain>/<entity>/<entity>.controller.ts`.
8. Controller and service registered in the domain module.
9. Integration tests: behaviour, tenant isolation, permissions, audit entries.
10. `pnpm check-types`, `pnpm lint`, `pnpm test` pass.

The checklist is mechanical; when adding several entities in one sitting, script the scaffolding rather than retyping it.
