# 07 - DB core: Drizzle, RLS, non-bypass role, unit of work

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 05, 06
Stories: 90

## What to build

Set up Drizzle with migrations, UUIDv7 identifiers and the convention that every Organisation-owned table carries `organisation_id`. Every such table gets a PostgreSQL row-level security policy that admits only rows of the current Organisation, read from a transaction-local setting. The application connects with a role that cannot bypass RLS; migrations run with a separate owner role. Provide a unit of work that opens a transaction, sets the current Organisation and hands out the scoped database handle; all Organisation data access must go through it. Provide both the Neon WebSocket adapter and the standard `pg` adapter, chosen by configuration, using the result of issue 05. Platform-level tables (Organisations themselves, global admin identities) have their own narrow access rules.

## Acceptance criteria

- [ ] A query on an Organisation table outside a unit of work returns no rows and an insert fails
- [ ] Inside a unit of work for Organisation A, rows of Organisation B are invisible and cannot be updated, even by explicit id
- [ ] The application role has no BYPASSRLS and does not own the tables (checked by a test)
- [ ] A migration adding a table without `organisation_id` and a policy fails a CI check, unless the table is on an explicit platform-level allow list
- [ ] The same tests pass on the `pg` adapter; the Neon adapter is covered by the issue 05 setup

## Notes

- Spec sections: Tenancy, Ports and adapters
- Port from Domino: `apps/api/src/db/schema.ts` conventions (UUIDv7, soft-delete) - but Domino has no RLS
