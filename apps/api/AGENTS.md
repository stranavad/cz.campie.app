# API

NestJS 12 (ES modules, Express) + Drizzle 1.0 RC + PostgreSQL 18 with row-level security per Organisation. Wire shapes and endpoints come from [`@repo/schema`](../../packages/schema/AGENTS.md). Versions and toolchain rules: ADR-0003; layering: ADR-0004; contracts and response shaping: ADR-0005. Single source of truth for humans and agents working in this app; `apps/app` is out of scope here.

| Doc                                | Read when you...                                    |
| ---------------------------------- | --------------------------------------------------- |
| [docs/testing.md](docs/testing.md) | write or change a test, add a fake, check isolation |

## Scripts

In `apps/api`, or from the root `pnpm --filter api <script>`.

| Script             | Purpose                                            |
| ------------------ | -------------------------------------------------- |
| `pnpm dev`         | `tsc --watch` + `node --watch dist/main.js`        |
| `pnpm build`       | `tsc` into `dist/`                                 |
| `pnpm start`       | run the last build                                 |
| `pnpm check-types` | TypeScript                                         |
| `pnpm lint`        | Oxlint, type-aware, warnings fail, layer rules     |
| `pnpm test`        | Vitest once                                        |
| `pnpm test:watch`  | Vitest watch                                       |
| `pnpm db:generate` | migration from the schema: `--name <what-changed>` |
| `pnpm db:migrate`  | apply migrations                                   |
| `pnpm db:studio`   | Drizzle Studio                                     |

First run: root `pnpm docker:up` starts the whole stack, migrations and this API included (`http://app.localhost/api/health`). To run the API on the host instead: `cp .env.example .env`, `pnpm db:migrate`, `pnpm dev`; it reaches the Compose services on their published ports.

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

- **All Organisation data access runs inside a unit of work.** `UnitOfWork.run(organisationId, work)` opens a transaction, sets the current Organisation in it (`set_config('app.organisation_id', ..., true)`), commits when `work` resolves and rolls back when it throws. Inside, `unitOfWork.db` is the transaction and `unitOfWork.organisationId` the Organisation; outside, both throw. Units of work do not nest. Repositories inject `UnitOfWork` and use only `db` and `organisationId`.
- Outside a unit of work, RLS returns no rows and rejects writes. `UnitOfWork.runForPlatform(work)` is a transaction without an Organisation, for platform tables: every Organisation-owned table looks empty there. `unitOfWork.enter(organisationId)` turns the current platform unit of work into that Organisation's for the rest of its transaction; only signup uses it, so the new Organisation's own records commit with it.
- The `Database` port (`DATABASE_ADAPTER=neon|pg`) holds the pool; only the unit of work and the health check use it.
- The unit of work is opened by request infrastructure (see Access and sessions) or by a job from its payload, never by a controller or repository.
- **The Organisation never comes from client input.** Inserts take `organisationId` from the unit of work; a body or query carrying it is a bug.
- **RLS is the second line, not the first.** Services still check permissions; RLS stops whatever a missed check lets through. A row of another Organisation is invisible, so lookups by its id end as not-found.
- Platform-level tables (Organisations themselves, admin identities, operator records) are listed in `db/platform-tables.ts` and have no policy: every unit of work reaches them, so their services decide who may read or change what. A platform table the API must not change in some way revokes that privilege in a custom migration.
- Views over Organisation tables are declared `security_invoker`, or they read as their owner, past RLS; the tenancy check rejects any other view and every materialized view.

## Access and sessions

`core/access/` resolves every request before its route runs; `core/sessions/` (`SessionsModule`, global) issues and reads the sessions and their cookies.

- **`@Access(kind)` on every controller** says who may call it and where its Organisation comes from: `public` (an Organisation's subdomain), `guardian` (a guardian session of the subdomain's Organisation), `admin` (an admin session on the main host, the Organisation named in the `x-organisation-id` header and checked against the admin's memberships), `account` (an admin session on the main host outside any Organisation: the admin's own account and memberships), `platform` (the main host, outside any Organisation: signup, login), `gateway` (the Organisation in the `:organisationId` path parameter; the route checks the gateway's signature) and `unscoped` (the route opens its own unit of work: health, download links). A controller with mixed access splits in two.
- The host is the one the frontend's proxy forwarded (`X-Forwarded-Host`, last entry, since a proxy appends to what the client sent), else `Host`. `app.<PLATFORM_DOMAIN>` is the main host, `<subdomain>.<PLATFORM_DOMAIN>` an Organisation. A public or guardian request on any other host, or on a subdomain no Organisation has, answers 404 `organisation_unknown`; an admin or platform request off the main host a plain 404.
- The global `AccessGuard` refuses a mutating request (not GET, HEAD, OPTIONS) without the `x-csrf-protection` header with 403 `csrf_header_missing`, except `gateway`. A missing or expired session is 401; an admin naming an Organisation they are no member of, or none, is 403. Header names and error codes are in `@repo/schema/shared` (`ACCESS_HEADERS`, `ACCESS_ERROR_CODES`).
- The global `UnitOfWorkInterceptor` then runs the route in the resolved Organisation's unit of work (a platform one for `platform` and `account`), so the route commits or rolls back as one. Route interceptors run inside it, an upload's parsing included.
- `@RequestActor()` gives the admin (identity: admin id) or guardian (identity: email) making the request, for permission checks and audit; `@RequestAdminId()` the admin's id on an admin or account request.
- Sessions live in the database; the cookie carries a random token and only its SHA-256 is stored. `SessionService.startAdmin(adminId)` / `startGuardian(email)` (in the guardian's Organisation's unit of work) return the token, and `writeSessionCookie(response, kind, session)` sets it: `__Host-admin_session` / `__Host-guardian_session`, httpOnly, Secure, SameSite=Lax, Path=/, no Domain, so it stays on the exact host. Admin sessions last 12 hours, guardian sessions 7 days, not extended by use.
- Guardian sessions are an Organisation table, looked up in the host's Organisation, so another Organisation's session is invisible; the guard also compares the session's Organisation with the host's. Admins, memberships and admin sessions are platform tables: an admin identity is global, and the membership decides the Organisation before one is current.

## Encryption

- Each Organisation's data key is created with it (`OrganisationService.create`) and stored in `organisation_keys`, wrapped by the `KeyProvider` master key and bound to the Organisation. The API may delete that row, which destroys every encrypted value of the Organisation, but never update it.
- `EncryptionService.cipher()` returns an `OrganisationCipher` for the current unit of work's Organisation. Get it once per unit of work, not per value; it holds the key in memory, so a stream keeps working after the unit of work ends.
- Encrypted columns are `encrypted()` from `db/helpers/encrypted.ts`, typed `Encrypted`, which only `cipher.encrypt()` produces. Never filter, sort or index them.
- Files go through `cipher.encryptStream()` and `cipher.decryptStream()`: authenticated segments, so a download only ever emits verified plaintext. Every stored value starts with its scheme version.

## Audit

- Every change, every view of health data and every export with sensitive columns calls `AuditService.record(actor, { action, target, change })` inside the unit of work of the change, so the entry commits or rolls back with it. Pass `change: { before, after }` with the rows (`null` for a created or removed one); a view or an export has none.
- The entry keeps old and new values of plain fields and only the names of encrypted ones: any byte value is treated as encrypted, and counts as changed whenever its ciphertext differs, so re-encrypt only values that changed.
- `audit_entries` is append-only: the application role may insert and read but not update, delete or truncate. Actor identity, IP address and changes are nullable so erasure can scrub an entry without removing it.
- The `Actor` (kind, identity, IP address; `system` has neither) is passed explicitly by the caller; services need it for permission checks anyway.

## Jobs

- Mail, PDFs and exports run as jobs from the Redis queue (BullMQ), so a request never waits for them. BullMQ is used directly in `core/jobs/`, not behind a port: Redis runs for real in every environment, tests included. Declare one with `defineJob({ name, scope, payload })` next to the code that enqueues it, and handle it with an `@Injectable()` provider extending `JobHandler<typeof job>`, registered in its feature module; the runner finds every handler when the app starts.
- `JobQueue.enqueue(job, payload)` is called inside a unit of work and sends the job once it commits (`unitOfWork.afterCommit`); a rollback sends nothing. An Organisation job takes the unit of work's Organisation and throws outside one; a job with `scope: 'platform'` (notifying the Platform operator) carries none. A send that fails or waits for Redis longer than 2 s is logged, never thrown: the change is committed by then.
- The runner re-enters a unit of work from the job: its Organisation's, or a platform one. A job without an Organisation and a malformed payload fail at once, without retries; a job no handler knows is retried, since another version of the app may know it.
- The handler runs inside that unit of work and commits with it; a throw rolls back and retries: 8 attempts, the delay doubling from 30 s. The last failure stays in the queue's failed set for 30 days and is logged as an error, earlier ones as warnings. Effects outside the database (a sent mail) repeat on a retry, so make them safe to repeat.
- Payloads are ids in JSON, never personal data: Redis is outside the encryption and erasure.
- `JOB_WORKER=auto` runs jobs in the API process (production requires it); `manual` leaves them queued for a test to drain.

## Files

- Every file goes through `FileService` (`core/files/`), inside the unit of work of the record that owns it. A feature keeps the file id on its own record and does its own permission check and audit entry; the file service checks neither.
- Uploads: `@UseInterceptors(FileUploadInterceptor)` and `@UploadedFile() upload: FileUpload` on the route (one multipart field `file`, at most `MAX_FILE_BYTES`), then `files.store(upload)`. The content decides the type (PDF, JPG, PNG) and the name's extension must agree; rejections carry a `FileErrorCode`.
- Storage holds ciphertext under `<organisation id>/<file id>`; the file's name is an encrypted column. A store whose unit of work rolls back deletes its object (`UnitOfWork.afterRollback`).
- Downloads: `files.link(fileId)` returns a `FileLink` to `/api/downloads/<token>`, valid 5 minutes, signed with a key derived from the master key. The download route opens the token's Organisation's unit of work, decrypts and streams the file inline, and aborts the response if decryption fails. Never expose a storage key or hand out storage URLs.
- `files.remove(fileId)` deletes the record; a job deletes the object once that commits. Delete a file through it, never by cascade from its owner's row, or the object stays in storage.

## Generated documents

- One pipeline (`core/documents/`): a React template, rendered to static markup, sent to the `PdfRenderer` port. A template is a `DocumentTemplate<Props>`: a component that wraps its content in `DocumentLayout` and receives the `letterhead` (display name, accent colour, logo, legal name, IČO, address) from `DocumentService`, which loads it from the current Organisation. A template never names an Organisation, address or logo itself.
- `documents.store(template, props, name)` renders and stores the PDF through `FileService` and returns the file id for the owning record; `documents.render(template, props)` returns the bytes. Call either from a job declared by the feature, never from a request.
- Wording is fixed by the platform and Czech. Camp data follows a label (`<Fact label="Tábor">`), never sits inside a sentence, so it needs no declension.
- Paper and margins are the layout's `@page` rule; the logo is inlined as a data URL, since the renderer fetches nothing. Tests read the HTML from `pdfs().rendered`; `src/testing/sample-document.tsx` is the sample template.

## Emails

- One pipeline (`core/emails/`): a React template, rendered with React Email, sent through the `MailSender` port. A template is `defineEmail({ stream, subject, render })`; `render` wraps its content in `EmailLayout` and receives the `brand` (sender name, contact, the Organisation's accent colour) from `EmailService`. A template never names a Camp or address itself.
- `emails.send(template, props, { to, sender, attachments })` sends one message from the current Organisation's unit of work: `sender` is the Camp's name and contact (the From display name and Reply-To), `attachments` file ids read through `FileService`. Call it from a job declared by the feature, never from a request; one job sends one message, so a retry never repeats a mail that went out.
- The template's `stream` picks the From address: `auth` (login links, email verification, invitations) or `notification` (everything else), `MAIL_AUTH_FROM` and `MAIL_NOTIFICATION_FROM`, on different domains. A suspended Organisation's mail is skipped, not failed, so the job completes without retrying.
- Admin-edited texts go through `EmailText`, which fills placeholders (`{{name}}`, from `@repo/schema/emails`) as escaped text and keeps paragraphs and line breaks. Unknown placeholders are rejected when a text is saved, with `unknownPlaceholders`. Functional parts are fixed: `EmailAction` for the button, the layout's `payment` slot for the payment block.
- The platform's own mail (to the Platform operator) goes through `emails.sendForPlatform(template, props, { to })`, from any unit of work: `PRODUCT_NAME` is the sender name, and the layout has no reply contact.
- Tests read `mail().sent`; `src/testing/sample-emails.tsx` holds a sample template per stream.

## Folder layout

```
apps/api/src/
  core/                              infrastructure, no domain logic
    access/                          @Access, host and session resolution, the request's unit of work
    config/                          env schema + loader, validated before Nest starts
    database/                        Drizzle setup, pg and Neon adapters, unit of work
    documents/                       generated documents: layout, letterhead, React to PDF
    emails/                          emails: layout, brand, React to the mail port, two streams
    encryption/                      Organisation data keys, field and file encryption
    files/                           encrypted file storage, uploads, download links
    jobs/                            job queue, runner and worker; jobs and handlers live with their feature
    passwords/                       admin password hashes (Argon2id, PHC strings)
    rate-limits/                     attempt limits counted in Redis by the Clock (login failures)
    sessions/                        admin and guardian sessions, their cookies
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

| Concept    | Name                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| Entity     | `XxxEntity`                                                              |
| Repository | `XxxRepository`                                                          |
| Service    | `XxxService`                                                             |
| Controller | `XxxController`                                                          |
| Port       | the capability: `Clock`, `MailSender`, `FileStorage`                     |
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
- Access is declared on every controller with `@Access(kind)` (see Access and sessions); the app refuses to boot with a controller that has none.
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

- `appConfigModule()` (`core/config/`) validates the env with Zod (`env.schema.ts`) while Nest loads `AppModule`, before any module initialises, so a misconfigured app never boots half-working. The schema is the single source of truth for what the app needs.
- `APP_ENV` (`local` | `test` | `production`) selects the source: `local` reads `.env` (gitignored, from `.env.example`), `test` reads `.env.test` (committed, secret-free), `production` reads deployment env vars. Real env vars always win over a file.
- Code depends on typed `ConfigService<Env, true>`, never `process.env` (lint-enforced outside config and tooling files).
- Each port's adapter is chosen by one `<PORT>_ADAPTER` variable (`MAIL_ADAPTER=resend|log`, ...); only the chosen adapter's variables are required. The parsed config is nested per port, so `config.get('mail')` is typed by the adapter it holds. `APP_ENV=production` refuses any local or test adapter.
- `AppModule.forRoot()` reads the configuration when the app starts, not when the file is imported, so tests boot it with different environments in one process.
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

The one exception is `LogMailSender`, which logs whole messages so local mail can be read; production refuses it.

## Database

### Schema

- One Drizzle table per file under `db/<domain>/<table>.ts`, re-exported from `db/schema.ts`. pg-core is imported as a namespace: `import * as p from 'drizzle-orm/pg-core'`.
- Tables are declared with `p.snakeCase.table(...)`, so columns are named by their camelCase keys and land in snake_case.
- **Every Organisation-owned table** has `organisationId: organisationId()`, is created with `p.snakeCase.table.withRLS(...)` and gets `organisationPolicy()` from `db/helpers/organisation.ts`. After migrating, a test checks every table in the database (`src/testing/tenancy-check.ts`): one without them fails CI unless it is on the platform list.
- Ids are `id()` from `db/helpers/ids.ts`: UUIDv7 generated by PostgreSQL (`uuidv7()`). Money is integer CZK. Instants are `timestamptz`.
- camelCase in TypeScript, snake_case in PostgreSQL.
- Composite primary keys are named `<table>_pkey`; composite foreign keys target the parent's composite key and are named `<table>_<parent>_fkey`.
- Foreign keys cascade down the chain, never skipping a level.
- `.notNull()` is declared in TypeScript even where drizzle-kit drops it from the SQL for primary key columns.
- Const tuples from `@repo/schema` are the single source for both `z.enum(...)` and `p.pgEnum(...)`.
- **Table comments are minimal**, none by default. Keep one only for what the DDL can't express and no other document covers (a deliberately missing foreign key, a non-obvious default). Domain meaning belongs in `CONTEXT.md`, rationale in ADRs; never cite an ADR from a schema file.

### Relations

Per-domain `defineRelationsPart` in `db/<domain>/relations.ts`, composed in `db/relations.ts` and passed to `drizzle({ client, relations })`.

### Roles

- The API connects as `campie_app` (`DATABASE_URL`): no superuser, no BYPASSRLS, owns no table, so RLS always applies. A test checks it.
- Migrations run as the role that owns the tables (`MIGRATION_DATABASE_URL`, read only by `drizzle.config.ts`); on Neon, the database owner.
- The first migration creates `campie_app` without a login and grants it DML on every table the owner creates. Its login and password are provisioning, once per environment, as the owner: `ALTER ROLE campie_app LOGIN PASSWORD '<secret>';`. Leave its creation to the migration: a role made in the Neon console joins `neon_superuser` and could act with its privileges. Locally `docker/postgres/create-app-role.sql` gives it the password `campie_app` when the Compose PostgreSQL first creates its data; the test harness does the same in its container.

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
