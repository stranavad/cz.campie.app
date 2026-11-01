# 05 - Spike: Neon WebSocket driver with SET LOCAL in transactions

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: 02
Stories: 191

## What to build

Prove that the Neon serverless driver in WebSocket mode supports interactive transactions in which `SET LOCAL` (or `set_config(..., true)`) sets the current Organisation and row-level security policies read it, with no leakage between concurrent transactions on pooled connections. Run the same scenario against standard PostgreSQL with the `pg` driver. Record the result and the chosen driver configuration under `## Comments`; if Neon falls short, describe the fallback.

## Acceptance criteria

- [x] Against a Neon branch, two concurrent transactions setting different Organisations each see only their own rows through an RLS policy
- [x] A query outside any transaction that sets the Organisation returns no rows
- [x] The same test passes against local PostgreSQL with `pg`
- [x] Result and configuration are recorded under `## Comments`

## Notes

- Spec sections: Ports and adapters, Tenancy, Further Notes - To verify at project setup
- Needs a Neon project; use a throwaway branch, never production data

## Comments

2026-11-01 - **Works on both drivers.** The Neon serverless driver in WebSocket mode supports the interactive transactions RLS relies on; no fallback needed.

`apps/api/spikes/rls-transactions.ts` runs one scenario on either driver: `node spikes/rls-transactions.ts pg` (Compose PostgreSQL) or `node spikes/rls-transactions.ts neon` with `SPIKE_DATABASE_URL` (a throwaway Neon branch) from the environment or the API's `.env` (`@neondatabase/serverless` 1.2.0 `Pool`, WebSocket, Node's built-in `WebSocket`, so no `ws` package). The URL's role creates a `spike_rls` schema and a fresh non-owner `spike_app_<random>` role, the queries run as that role (the table owner and superusers bypass RLS), and everything is dropped afterwards, also when a check fails.

- 40 concurrent transactions, alternating two Organisations, on a pool of 2 connections: each sets `set_config('app.organisation_id', $1, true)`, yields so the others interleave, then sees only its own Organisation's rows; a write for the other Organisation is rejected by the policy. Half commit, half roll back.
- Afterwards, outside any transaction, on every pooled connection: no rows, and a write is rejected.
- `pg` 8.23.1 against PostgreSQL 18.6: **passes**.
- `@neondatabase/serverless` 1.2.0 against a throwaway Neon branch: **passes**, on the pooled endpoint (`-pooler` host, Neon's PgBouncer in transaction mode) and on the direct one.
- Proven sharp by two mutations, both caught: `set_config(..., false)` (session-wide) leaks the Organisation to the next query on the connection; a policy without `nullif` fails with `invalid input syntax for type uuid: ""`.

Finding for issue 07's policy helper: a setting that was never set reads as NULL, but once a transaction set it locally, the connection reads it as `''` after commit or rollback. The policy must treat both as "no Organisation": `organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid`. `set_config` is used rather than `SET LOCAL` because it takes a bound parameter; `SET LOCAL` would need the id interpolated into SQL.

Chosen configuration for issue 07: `drizzle-orm/neon-serverless` over the `@neondatabase/serverless` `Pool` (WebSocket, Node's built-in `WebSocket`) in production, `pg` `Pool` locally and in tests. Every unit of work is `BEGIN`, `set_config('app.organisation_id', $1, true)`, the work, then `COMMIT` or `ROLLBACK`, on one checked-out connection, as a non-owner, non-superuser application role. Both Neon endpoints work; the pooled one is the default, since transaction-mode pooling keeps a transaction on one server connection, which is all transaction-local settings need. The HTTP mode (`neon()`) is not used: it has no interactive transactions.

Pooler caveat, found when the spike still reused one role name: Neon's pooler keeps idle server connections logged in as a role after that role is dropped, so a role recreated under the same name gets `permission denied` through the pooled endpoint until those connections recycle. Grants changed on a living role apply at once; only dropping and recreating a role is affected. The application role is created once by migration and never recreated, so this only matters for scripts and test setups, which use a fresh role name.
