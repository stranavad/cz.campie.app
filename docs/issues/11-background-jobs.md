# 11 - Background jobs with Organisation context

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 08
Stories: -

## What to build

Set up the Redis-backed job queue. Every job payload carries the Organisation it belongs to, and the worker re-enters the unit of work for that Organisation before touching data, so jobs are subject to the same RLS as requests. Platform-level jobs (for example notifying the operator) are explicitly marked as such. Provide retries with backoff and a way for tests to run queued jobs synchronously. Mail sending, PDF generation and exports will all run as jobs.

## Acceptance criteria

- [ ] A job enqueued for Organisation A cannot read Organisation B's rows
- [ ] A job without an Organisation fails unless it is declared platform-level
- [ ] Failing jobs retry with backoff and end in a visible failed state
- [ ] Tests can drain the queue deterministically

## Notes

- Spec sections: Emails (background jobs), Tenancy
- Port from Domino: BullMQ setup in `apps/api/src/app.module.ts` and `apps/api/src/registration/registration.module.ts`
