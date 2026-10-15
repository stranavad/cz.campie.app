# Testing

Vitest 5 with Supertest against the real app and a real PostgreSQL 18 (Testcontainers, needs Docker). The spec allows two seams and no others:

| Seam            | Files                                                      | What runs                                                   |
| --------------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| API over HTTP   | `*.integration.test.ts`, next to the controller            | the real `AppModule`, real PostgreSQL with RLS, port fakes |
| Pure modules    | `*.test.ts`, next to the code                              | plain functions, no app, no database, no env               |

The pure domain modules both apps share (pricing, form engine) live in `packages/schema` and are tested there. In the API, `*.test.ts` covers only pure helpers (placement rules, checklist status) that need no database.

Run one kind: `pnpm exec vitest --project integration` or `--project unit`.

## Approach

- **Integration = real app + real infrastructure.** `useTestApp()` boots `AppModule` through `app.setup.ts` exactly like `main.ts`, for every test, and tears it down after. Tests assert on HTTP responses and on what the fakes captured, so they survive refactors. Never on query shapes, private functions or mocked call sequences.
- **RLS is active.** The app connects with the application role, which cannot bypass RLS and owns no tables; migrations run as the owner. A test that passes only because RLS is off proves nothing.
- **Own database per test.** PostgreSQL starts once per run, migrations go into a template database, and each test gets `CREATE DATABASE ... TEMPLATE` (milliseconds, data on tmpfs). Tests never share rows.
- **Hermetic.** Ambient env vars are cleared; config is `APP_ENV=test` through the real loader (`.env.test`, no secrets) plus the test services' values. Any outbound HTTP outside localhost fails the test.
- **Time is controlled.** Code reads time only from the `Clock` port; `useTestApp().clock()` is a fake clock, frozen until the test moves it. Prague-calendar rules are tested near midnight UTC.
- **Fakes at every port, inspectable** (issue 08): captured mail, stored files, payment gateway calls, rendered PDFs, a fixed test key. A fake records; it never reimplements the service.
- **Fixtures create the world through the app's own seams**: Organisations, Camps, Turnusy, admins with given permissions, guardian sessions. Data is obviously fake; never a real person, rodné číslo or health record.
- **Migrations stay in sync.** A test fails with the missing SQL when the schema changed without `pnpm db:generate`.
- `.only` and `.skip` are lint errors.

## Every endpoint proves

- **Its behaviour**, as a camp admin, guardian or operator would observe it.
- **Tenant isolation.** The isolation helper calls it with Organisation B's session and Organisation A's identifiers: the answer is not-found or forbidden, and nothing changed.
- **Permissions.** Each area at none, read and write; no health data without Health read, exports included.
- **Audit.** A change produces its entry with actor, action, target and diff; a rolled-back change leaves none.

## Infrastructure

| Kind                           | Examples                         | How                                                          |
| ------------------------------ | -------------------------------- | ------------------------------------------------------------ |
| external service, once per run | PostgreSQL, Redis                | a test service in `src/testing/services/` with `start()` and `isolate()` |
| outside world, faked           | mail, storage, payments, PDF     | the port's fake adapter, selected by the test config         |

A test service starts once per run and returns env values (`DATABASE_URL`); `isolate()` runs per test and returns env overrides plus cleanup. Isolation is part of the type, so no service can skip it.
