# 11 - Background jobs with Organisation context

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: 08
Stories: -

## What to build

Set up the Redis-backed job queue. Every job payload carries the Organisation it belongs to, and the worker re-enters the unit of work for that Organisation before touching data, so jobs are subject to the same RLS as requests. Platform-level jobs (for example notifying the operator) are explicitly marked as such. Provide retries with backoff and a way for tests to run queued jobs synchronously. Mail sending, PDF generation and exports will all run as jobs.

## Acceptance criteria

- [x] A job enqueued for Organisation A cannot read Organisation B's rows
- [x] A job without an Organisation fails unless it is declared platform-level
- [x] Failing jobs retry with backoff and end in a visible failed state
- [x] Tests can drain the queue deterministically

## Notes

- Spec sections: Emails (background jobs), Tenancy
- Port from Domino: BullMQ setup in `apps/api/src/app.module.ts` and `apps/api/src/registration/registration.module.ts`

## Comments

2026-11-01 - **Done.** `apps/api/src/core/jobs/`: one BullMQ queue (`jobs`) on Redis, used directly without `@nestjs/bullmq` (ADR-0003 notes it).

- A job is `defineJob({ name, scope, payload })` with a Zod payload; a provider extending `JobHandler<typeof job>` handles it, found at startup through Nest's `DiscoveryService`. `scope: 'platform'` declares a platform job.
- `JobQueue.enqueue(job, payload)` takes the Organisation from the current unit of work (an Organisation job throws outside an Organisation unit of work) and sends the job through the new `UnitOfWork.afterCommit`, so a rolled-back change enqueues nothing and a job never runs before its change is visible. A send that fails, or waits longer than 2 s while Redis is unreachable, is logged and does not fail the committed unit of work; the add keeps trying in the background while the process lives.
- `JobRunner` re-enters `UnitOfWork.run(organisationId)` (or `runForPlatform`) from the job's envelope, so the handler is under RLS like a request. A job without an Organisation, a platform job carrying one and a malformed payload fail at once (`UnrecoverableError`); an unknown job name retries, since another app version may know it.
- 8 attempts, exponential backoff from 30 s (about an hour in all); the failed set keeps jobs 30 days. `JobWorker` runs jobs in the API process when `JOB_WORKER=auto` (production requires it), logs retries as warnings and the final failure as an error, and closes by force when no job is running, since a graceful BullMQ close never returns while Redis is down.
- Tests: Redis is a real test service; each test gets its own logical database, recycled after. `JOB_WORKER=manual` in tests; `jobs().drain()` runs queued jobs one at a time through the app's runner, retries brought forward and reported with their backoff; `jobs().failed()` reads the failed set. `useTestApp` takes test-only `providers` for handlers.
- For issue 16 and later: a handler runs inside one unit of work, so a throw rolls its database work back, but effects outside the database (a sent mail) repeat on a retry; make them safe to repeat. Payloads are ids only: Redis is outside encryption and erasure.
- Open: no outbox. If the process dies while Redis is unreachable, a committed change's job is lost (logged). A transactional outbox in PostgreSQL would close that gap if it matters in practice.
