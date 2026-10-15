# 05 - Spike: Neon WebSocket driver with SET LOCAL in transactions

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 02
Stories: 191

## What to build

Prove that the Neon serverless driver in WebSocket mode supports interactive transactions in which `SET LOCAL` (or `set_config(..., true)`) sets the current Organisation and row-level security policies read it, with no leakage between concurrent transactions on pooled connections. Run the same scenario against standard PostgreSQL with the `pg` driver. Record the result and the chosen driver configuration under `## Comments`; if Neon falls short, describe the fallback.

## Acceptance criteria

- [ ] Against a Neon branch, two concurrent transactions setting different Organisations each see only their own rows through an RLS policy
- [ ] A query outside any transaction that sets the Organisation returns no rows
- [ ] The same test passes against local PostgreSQL with `pg`
- [ ] Result and configuration are recorded under `## Comments`

## Notes

- Spec sections: Ports and adapters, Tenancy, Further Notes - To verify at project setup
- Needs a Neon project; use a throwaway branch, never production data
