# Testing

Vitest 5 with Supertest against the real app and a real PostgreSQL 18 (Testcontainers, needs Docker). The spec allows two seams and no others:

| Seam          | Files                                           | What runs                                                  |
| ------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| API over HTTP | `*.integration.test.ts`, next to the controller | the real `AppModule`, real PostgreSQL with RLS, port fakes |
| Pure modules  | `*.test.ts`, next to the code                   | plain functions, no app, no database, no env               |

The pure domain modules both apps share (pricing, form engine) live in `packages/schema` and are tested there. In the API, `*.test.ts` covers only pure helpers (placement rules, checklist status) that need no database.

Run one kind: `pnpm exec vitest --project integration` or `--project unit`.

## Approach

- **Integration = real app + real infrastructure.** `useTestApp()` boots `AppModule` through `app.setup.ts` exactly like `main.ts`, for every test, and tears it down after. Tests assert on HTTP responses and on what the fakes captured, so they survive refactors. Never on query shapes, private functions or mocked call sequences.
- **RLS is active.** The app connects with the application role, which cannot bypass RLS and owns no tables; migrations run as the owner. A test that passes only because RLS is off proves nothing.
- **Own database per test.** PostgreSQL starts once per run, migrations go into a template database, and each test gets `CREATE DATABASE ... TEMPLATE` (milliseconds, data on tmpfs). Tests never share rows.
- **Hermetic.** Every variable `.env.test` sets is cleared from the shell's env; config is `APP_ENV=test` through the real loader (`.env.test`, no secrets) plus the test services' values. Any TCP connection beyond this machine and the test services is refused and fails the test (`src/testing/network-guard.ts`).
- **Time is controlled.** Code reads time only from the `Clock` port; `useTestApp().clock()` is a fake clock, frozen until the test moves it. Prague-calendar rules are tested near midnight UTC.
- **Jobs run when the test says so.** The queue is real Redis, but nothing runs on its own (`JOB_WORKER=manual`): `jobs().drain()` runs every queued job through the app's runner, one at a time and in order, including jobs they enqueue, and returns each attempt; a retry runs at once and reports the backoff it skipped. `jobs().failed()` lists what ended failed.
- **Fakes at every port, inspectable**: `mail().sent`, `files().objects`, `payments().created`, `pdfs().rendered`, and a fixed test key. A fake records; it never reimplements the service.
- **Fixtures create the world through the app's own seams** (`src/testing/fixtures.ts`): Organisations, signed-in admins (`createAdmin(app, { memberOf, owner, permissions })`, whose `headers(organisationId)` carry host, cookie, Organisation and CSRF headers) guardian sessions (`createGuardianSession(app, organisationId, email)`), a session for an existing admin (`signIn(app, adminId)`) and the Platform operator with TOTP set up (`createOperator(testApp)` in `src/testing/operator.ts`, through the operator command line and the TOTP endpoints); Camps and Turnusy join as their features land. Data is obviously fake; never a real person, rodné číslo or health record.
- **Migrations stay in sync.** A test fails with the missing SQL when the schema changed without `pnpm db:generate`.
- `.only` and `.skip` are lint errors.

## Every endpoint proves

- **Its behaviour**, as a camp admin, guardian or operator would observe it.
- **Tenant isolation.** `useTestApp().expectIsolated(() => request)` sends a request with Organisation B's session and Organisation A's identifiers: the answer must be not-found or forbidden, and no row of any table may change.
- **Permissions.** Each area at none, read and write; no health data without Health read, exports included. `useTestApp().expectPermission(['registrations', 'read'], organisationId, (headers) => request)`, with the route's `@Requires` in the same words, sends the request as members at none, read and write in that area (every other area at write) and as an Owner, and asserts that those below are refused with `permission_denied`, changing nothing, and the rest admitted. `['owner']` tells an Owner from a member with write everywhere.
- **Audit.** A change produces its entry with actor, action, target and diff; a rolled-back change leaves none.

## Writing one

```ts
describe('camps', () => {
  const { app, http, mail, expectIsolated } = useTestApp();

  it('...', async () => {
    const organisation = await createOrganisation(app());
    const response = await http().post('/api/...').send({ ... });
    expect(mail().sent).toEqual([...]);
  });
});
```

`useTestApp({ env, controllers, providers })` takes env over the test configuration, test-only controllers and test-only providers (job handlers). `database()` gives the test's database as its owner (arranging and inspecting past RLS) and as the application role.

## Infrastructure

| Kind                           | Examples                     | How                                                                      |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------------------ |
| external service, once per run | PostgreSQL, Redis            | a test service in `src/testing/services/` with `start()` and `isolate()` |
| outside world, faked           | mail, storage, payments, PDF | the port's fake adapter, selected by the test config                     |

A test service starts once per run and returns env values; `isolate()` runs per test and returns env overrides plus cleanup (PostgreSQL: `DATABASE_URL` as the application role, `MIGRATION_DATABASE_URL` as the owner; Redis: `REDIS_URL` with the test's own logical database). Isolation is part of the type, so no service can skip it. Register a new one in `src/testing/services/test-services.ts`.
