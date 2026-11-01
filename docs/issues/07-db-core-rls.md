# 07 - DB core: Drizzle, RLS, non-bypass role, unit of work

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: 05, 06
Stories: 90

## What to build

Set up Drizzle with migrations, UUIDv7 identifiers and the convention that every Organisation-owned table carries `organisation_id`. Every such table gets a PostgreSQL row-level security policy that admits only rows of the current Organisation, read from a transaction-local setting. The application connects with a role that cannot bypass RLS; migrations run with a separate owner role. Provide a unit of work that opens a transaction, sets the current Organisation and hands out the scoped database handle; all Organisation data access must go through it. Provide both the Neon WebSocket adapter and the standard `pg` adapter, chosen by configuration, using the result of issue 05. Platform-level tables (Organisations themselves, global admin identities) have their own narrow access rules.

## Acceptance criteria

- [x] A query on an Organisation table outside a unit of work returns no rows and an insert fails
- [x] Inside a unit of work for Organisation A, rows of Organisation B are invisible and cannot be updated, even by explicit id
- [x] The application role has no BYPASSRLS and does not own the tables (checked by a test)
- [x] A migration adding a table without `organisation_id` and a policy fails a CI check, unless the table is on an explicit platform-level allow list
- [x] The same tests pass on the `pg` adapter; the Neon adapter is covered by the issue 05 setup

## Notes

- Spec sections: Tenancy, Ports and adapters
- Port from Domino: `apps/api/src/db/schema.ts` conventions (UUIDv7, soft-delete) - but Domino has no RLS

## Comments

2026-11-01 - **Done.** Drizzle 1.0.0-rc.4 with drizzle-kit, the `campie_app` role, the organisation policy helper, a `Database` port with Neon and `pg` adapters, and `UnitOfWork` in `apps/api/src/core/database/`.

- Schema: tables are `p.snakeCase.table(...)`; ids are `id()`, a UUIDv7 from PostgreSQL 18's `uuidv7()`; Organisation-owned tables add `organisationId()`, `withRLS` and `organisationPolicy()`, which is `organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid` in `using` and `withCheck`, for all commands, to `campie_app` (the `nullif` is issue 05's finding; ADR-0003's wording is updated to match).
- `organisations` is the first table, with only `id`: the anchor for `organisation_id` foreign keys and the only entry of the platform list (`db/platform-tables.ts`). Its columns come with issue 17.
- Roles: the first, custom migration creates `campie_app` NOLOGIN, NOBYPASSRLS, not superuser, and grants DML by default privileges on every table the migrating role creates. Its login and password are provisioning: `ALTER ROLE campie_app LOGIN PASSWORD '...'` once per environment, as the owner. On Neon the role must come from the migration, not the console, which would make it a member of `neon_superuser`. Migrations run as the owner from `MIGRATION_DATABASE_URL`, read only by `drizzle.config.ts`; the app's `DATABASE_URL` is the application role.
- Unit of work: `run(organisationId, work)` is one transaction with `set_config('app.organisation_id', $1, true)`; `runForPlatform(work)` is one without an Organisation, for platform tables. `db` and `organisationId` come from an `AsyncLocalStorage` scope and throw outside one; units of work do not nest. `DATABASE_ADAPTER=neon|pg`, production requires `neon`. The health check now pings through the `Database` port instead of its own `pg` client.
- CI check: `src/testing/tenancy-check.ts` reads `pg_class` and `pg_policies` of the migrated database and names every table without a NOT NULL uuid `organisation_id`, RLS on and exactly one permissive policy matching the helper's; every view not declared `security_invoker` (it would read as its owner, past RLS); every materialized view; and stale platform list entries. Proven by hand: a table without RLS added to the schema and migrated failed the check.
- Tests (`unit-of-work.integration.test.ts`, `db/tenancy.integration.test.ts`): against PostgreSQL 18.6 from Testcontainers, started once per run in a Vitest global setup, migrated into a template database, one database per test. A fixture Organisation table is built with the real helpers and created from drizzle-kit's generated DDL (`src/testing/tenant-table.ts`), since no domain table exists yet. They use `app.get(UnitOfWork)` rather than HTTP, as no endpoint exists yet. Two mutations were caught: replacing the `AsyncLocalStorage` scope with a shared field, and a policy of `true`.
- Neon: the adapter is `drizzle-orm/neon-serverless` over the serverless `Pool`, as issue 05 chose; it has no automated test, and issue 05's spike remains its proof.
- Local stack: a Compose `migrate` service applies migrations before the API, and `docker/postgres/create-app-role.sql` gives `campie_app` its local password when the PostgreSQL volume is first created. An older volume needs that statement run once, or the volume recreated.
- Not done, on purpose: no soft-delete convention (the spec erases and anonymises instead, ADR-0002); no narrowed grants on `organisations` yet, since signup, approval and rejection need all of DML; the drift test and the broader harness (`isolate()` returning env, fakes, fixtures) stay with issue 08.
- `pnpm-workspace.yaml` declines the install scripts of esbuild (drizzle-kit) and cpu-features, ssh2 and protobufjs (Testcontainers): none is needed, and pnpm 12 refuses to install with them undecided.
