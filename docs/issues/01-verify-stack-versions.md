# 01 - Verify stack versions, record as ADR

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: -
Stories: -

## What to build

Before any code exists, confirm that the stack named in the spec is released and usable: NestJS 12, Drizzle v1, the latest Vite with React Compiler, TanStack Router and Query, Tailwind, BullMQ, Resend and Gotenberg. Where a named version is not released or not stable, pick the latest stable instead. Record the chosen versions and any fallback as ADR-0003 in `docs/adr/`. A person has to make the final call, because a fallback changes how agents write code across the whole repository.

## Acceptance criteria

- [x] ADR-0003 lists the exact version of every framework and library named in the spec Architecture section
- [x] Every fallback from a named version states why
- [x] The ADR says whether Drizzle's RLS helpers (policies in schema) are used or plain SQL migrations

## Notes

- Spec sections: Architecture, Further Notes - To verify at project setup
- Needs: the developer's decision on fallbacks; agents can gather the facts but not choose

## Comments

2026-10-15 - ADR-0003 written (`docs/adr/0003-stack-versions.md`). Facts come from the npm registry and from probes in a scratch project. Developer decisions:

- Drizzle 1.0.0-rc.4, pinned exactly, over the 0.45.4 stable fallback.
- RLS policies declared with Drizzle helpers (`pgTable.withRLS`, a shared policy helper, `pgRole().existing()`).
- Node 26 over Node 24 LTS.
- TypeScript 7.0.2 after a compatibility check. NestJS DI, decorator metadata, Vitest through Oxc, Drizzle and the frontend all work. The NestJS CLI and typescript-eslint do not, so `tsc` + `node --watch` and oxlint replace them.
- Validation through NestJS 12's built-in `StandardSchemaValidationPipe` with Zod 4, so no `nestjs-zod`.
