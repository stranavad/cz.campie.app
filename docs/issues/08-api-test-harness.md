# 08 - API test harness with real PostgreSQL and port fakes

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: 07
Stories: -

## What to build

Build the main test seam: tests that boot the real NestJS application over HTTP against a real PostgreSQL with RLS active, with fakes at every port (mail captures messages, file storage in memory or RustFS, payment gateway, PDF renderer, key provider, controllable clock). Provide fixtures that create Organisations, Camps, Turnusy, admins with given permissions and guardian sessions, and a helper that asserts tenant isolation for an endpoint: called with Organisation B's session and Organisation A's identifiers it must return not-found or forbidden and change nothing. Each test runs in isolation (fresh schema or transaction rollback) and the suite runs in CI.

## Acceptance criteria

- [x] `pnpm test` in `api` boots the app against PostgreSQL from Docker or CI services and runs HTTP tests
- [x] Captured mail, stored files and gateway calls are inspectable from tests
- [x] An isolation helper exists and is demonstrated on a sample endpoint
- [x] Tests never assert on query shapes or mocked call sequences
- [x] The suite runs in CI on every push

## Notes

- Spec sections: Testing Decisions
- Domino's service tests mock the database; that approach is deliberately not carried over
- Approach and layout: `apps/api/docs/testing.md` (database per test from a template database, hermetic env, fake clock, migration drift test), modelled on the Koala42 template's `apps/api` harness

## Comments

2026-11-01 - **Done.** `useTestApp()` in `apps/api/src/testing/test-app.ts` boots the real `AppModule` per test on the test's own database and hands out `http()`, `app()`, `database()` (owner and application role URLs), the fakes and `expectIsolated()`.

- Test services: `TestService` with `start()` and `isolate()`, both returning env and `cleanup`, registered in `src/testing/services/test-services.ts`. PostgreSQL 18.6 from Testcontainers starts once per run with a migrated template; each test gets `CREATE DATABASE ... TEMPLATE` and the env `DATABASE_URL` (as `campie_app`) and `MIGRATION_DATABASE_URL` (as the owner).
- Fakes, chosen by `.env.test`: new `MAIL_ADAPTER=fake` (`FakeMailSender.sent`) and `FILE_STORAGE_ADAPTER=memory` (`MemoryFileStorage.objects`, refusing a body of another length than declared, as S3 does); `FakePaymentGateway.created` and `FakePdfRenderer.rendered` now record. Production refuses both new adapters through the existing check. The accessors (`mail()`, `files()`, `payments()`, `pdfs()`, `clock()`) throw when a test configured another adapter.
- Isolation helper: `expectIsolated(() => request)` snapshots every row of every table as the owner, sends the request, and requires 403 or 404 and an unchanged snapshot. Demonstrated in `tenant-isolation.integration.test.ts` on a test-only endpoint over the fixture notes table, with an `x-test-organisation` header standing in for a session until issue 14: the scoped routes pass, an Organisation taken from the path fails with "answered 200", and a delete that answers 404 anyway fails with "changed". Removing the snapshot assertion was caught.
- Fixtures: only `createOrganisation(app)`, through the unit of work. Camps, Turnusy, admins with permissions and guardian sessions arrive with the issues that build them (14, 18, 19, 24, 25, 39).
- Hermetic: an integration setup file clears from the shell every variable `.env.test` sets (proven by running the suite with `MAIL_ADAPTER=resend` and `FILE_STORAGE_ADAPTER=s3` in the shell), and `.env.test` points the database and Redis at port 1, so a test without its own service never reaches the local stack. A guard on `net.Socket.prototype.connect` refuses every TCP connection beyond this machine and the test services' hosts and fails the test listing them; it covers fetch, the AWS SDK and raw sockets alike, without a new dependency.
- Migration drift: `src/db/migrations.test.ts` (unit project) compares the last snapshot with the schema and fails with the missing SQL; proven by adding a column without a migration.
- Existing tests moved to `useTestApp` (`unit-of-work`, `tenancy`); `bootApp` now takes `{ env, logger, controllers }`.
- CI: `ci.yml` already runs `pnpm test` on every push, and `ubuntu-latest` has Docker for Testcontainers. Not yet seen on GitHub: the commits since issue 02 are unpushed.
- Not done, on purpose: `getPaymentStatus` calls are not recorded and status cannot be set (card payments, issue 48/49, will say what they need); no Redis test service until jobs (issue 11).
