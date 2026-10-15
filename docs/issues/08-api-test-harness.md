# 08 - API test harness with real PostgreSQL and port fakes

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 07
Stories: -

## What to build

Build the main test seam: tests that boot the real NestJS application over HTTP against a real PostgreSQL with RLS active, with fakes at every port (mail captures messages, file storage in memory or RustFS, payment gateway, PDF renderer, key provider, controllable clock). Provide fixtures that create Organisations, Camps, Turnusy, admins with given permissions and guardian sessions, and a helper that asserts tenant isolation for an endpoint: called with Organisation B's session and Organisation A's identifiers it must return not-found or forbidden and change nothing. Each test runs in isolation (fresh schema or transaction rollback) and the suite runs in CI.

## Acceptance criteria

- [ ] `pnpm test` in `api` boots the app against PostgreSQL from Docker or CI services and runs HTTP tests
- [ ] Captured mail, stored files and gateway calls are inspectable from tests
- [ ] An isolation helper exists and is demonstrated on a sample endpoint
- [ ] Tests never assert on query shapes or mocked call sequences
- [ ] The suite runs in CI on every push

## Notes

- Spec sections: Testing Decisions
- Domino's service tests mock the database; that approach is deliberately not carried over
- Approach and layout: `apps/api/docs/testing.md` (database per test from a template database, hermetic env, fake clock, migration drift test), modelled on the Koala42 template's `apps/api` harness
