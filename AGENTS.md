# Campie

Guidance for agents and humans working in this repository. `CLAUDE.md` is a symlink to this file.

## Project

**Campie** (`campie.cz`) - a hosted, multi-tenant camp registration platform for Czech camp organisations: registration forms, payments, Consents, documents, health records and camp-time records. Open source under AGPL-3.0, public from the first commit. Czech is the only UI language.

Work proceeds issue by issue from `docs/issues/`, starting at issue 01.

## Read before working

- `CONTEXT.md` - the glossary. Use its terms exactly (Organisation, Camp, Turnus, Registration, Participant, ...) in code, tests, issues and commits; never the words listed under _Avoid_.
- `docs/spec.md` - the v1 spec: user stories, implementation decisions, testing decisions, out of scope.
- `docs/plan.md` - episodes, issue numbers, blockers, stage split (1a February 2027, 1b April 2027, 2 May, 3 late June).
- `docs/adr/` - decisions that must not be silently reversed. ADR-0003 fixes the stack versions and toolchain rules, ADR-0004 the backend layering, ADR-0005 the shared endpoint contracts.
- `docs/issues/NN-*.md` - the issue you are working on, including its `Blocked by` line. Do not start a blocked issue.
- The `AGENTS.md` of the workspace you work in (below).

## Workspaces

Each workspace has its own `AGENTS.md` (with `CLAUDE.md` as a symlink); load it when working there. Its `docs/` hold topic guides, read only the one for your task.

| Path                     | What                                                   | Index                                                                  |
| ------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `apps/api`               | backend (NestJS, Drizzle, PostgreSQL with RLS)         | [`apps/api/AGENTS.md`](apps/api/AGENTS.md)                             |
| `apps/app`               | frontend (React, Vite, TanStack)                       | [`apps/app/AGENTS.md`](apps/app/AGENTS.md)                             |
| `packages/schema`        | contracts and pure domain modules, shared by both apps | [`packages/schema/AGENTS.md`](packages/schema/AGENTS.md)               |
| `packages/oxlint-config` | shared Oxlint rule groups                              | [`packages/oxlint-config/AGENTS.md`](packages/oxlint-config/AGENTS.md) |

The workspaces are scaffolded by issue 02; until then their `AGENTS.md` describe the target.

## Reference implementation: Tábor Domino

Campie generalises Tábor Domino, a single-camp system by the same author. Its repository is at:

`/Users/davidstranava/programming/tabor-domino-monorepo`

Every "Port from Domino" path in an issue is relative to that repository. Read it for domain knowledge and code to port. Never modify it from here, and never copy Domino-specific names, texts, legal identity or secrets into this repository. Where Domino and the spec disagree, the spec wins; the spec's "Further Notes" list the deliberate divergences. Ported code is adapted to this repository's guidelines and versions, not kept in Domino's shape.

## Architecture (target, see spec)

- pnpm monorepo with Turborepo: `apps/api` (NestJS), `apps/app` (React + Vite + React Compiler, Tailwind, TanStack Router and Query), `packages/schema` (contracts and pure domain modules).
- Drizzle ORM on PostgreSQL with row-level security per Organisation; every Organisation-scoped access runs inside a unit of work that sets the current Organisation.
- Every external service sits behind a port with a production and a local adapter chosen by configuration: database (Neon / pg), storage (Tigris / RustFS via AWS SDK), mail (Resend / log), payment gateway (Comgate / fake), PDF (Gotenberg / fake), key provider, clock.
- Cookie sessions behind a same-origin `/api` proxy (ADR-0001). One frontend serves the Organisation subdomains (public pages, guardian portal) and the main host (signup, admin, operator console).
- Product name and domain are configuration; locally the platform runs on `*.localhost` via Docker Compose.

## Commands

From the root; Turborepo runs the task in every workspace.

| Command             | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | dev servers                                  |
| `pnpm build`        | production build                             |
| `pnpm check-types`  | TypeScript                                   |
| `pnpm lint`         | Oxlint, type-aware, warnings fail            |
| `pnpm test`         | Vitest once                                  |
| `pnpm format`       | Prettier write                               |
| `pnpm format:check` | Prettier check                               |
| `pnpm docker:up`    | local stack (PostgreSQL, Redis, RustFS, ...) |
| `pnpm docker:down`  | stop the local stack                         |

## Working with agents

Apply these on every task, whichever tool does the work.

- **Keep it simple - YAGNI.** Don't build for a requirement that hasn't arrived. Each workspace's "What we deliberately do not do" list holds the concrete cases; this is the rule behind them.
- **Type safety is not optional - `any` is the enemy.** Lean on inferred types over explicit ones; a system that adapts to a change beats one that needs the change copied everywhere.
- **Bold ideas are welcome.** Propose a genuinely better approach instead of quietly defaulting to the safest option when a bolder one would meaningfully help.
- **A question is not an instruction.** If a message asks rather than instructs ("how hard would it be to...", "what do you think about...", "should we..."), answer it and stop. Don't edit files off the back of a question; offer the change and wait.
- **Match ceremony to the task.** No multi-agent workflow or fleet of subagents for something a single pass finishes cleanly. Delegation earns its cost for genuine breadth or an independent review.
- **Name the blast radius before touching it.** Production, the production Neon branch, real mail and payment credentials and anything holding real personal data are never touched without being asked. If a task is adjacent to one, say what you are about to touch first; the same goes for any other hard-to-reverse action.
- **No real personal data anywhere in the repository.** Tests, fixtures, seeds, examples and logs use obviously fake people. The platform holds children's health data and rodná čísla; treat every example accordingly.
- **A lint rule beats a doc bullet.** When the same correction keeps coming up, add a rule to `packages/oxlint-config` or the workspace's `oxlint/` instead of another sentence here.
- **No compatibility shims for internal code.** When a signature changes, migrate every caller and delete the old version in the same change.
- **No new documentation files** unless the issue or the user asks for one. Issue progress goes under the issue's `## Comments`.

## Testing

Two seams only (spec, Testing Decisions):

1. The API over HTTP against a real PostgreSQL with RLS active, with fakes at the ports.
2. Pure domain modules (pricing, form engine, placement rules, checklist) tested directly.

Do not mock the database. Tenant isolation, permissions and audit entries are part of every relevant issue's acceptance criteria. How: [`apps/api/docs/testing.md`](apps/api/docs/testing.md).

A test proves one real behaviour. Prefer fewer, sharper tests over broad, low-signal coverage; a new test proves itself by failing once when the covered code is broken.

## Conventions

- Every UI string goes through the translation layer; texts are Czech.
- Use a hyphen "-", never an em-dash, in any text, UI or document.
- Money is whole CZK integers; calendar rules use Europe/Prague; identifiers are UUIDv7.
- No secrets in the repository.
- Prettier formats the whole repository and sorts imports; Oxlint lints every workspace type-aware, warnings fail.
- Commits, branches, pull requests and hooks: [`docs/git.md`](docs/git.md). No AI attribution in commits or pull requests.

## Agent skills

### Issue tracker

Issues live as local markdown files in `docs/issues/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five-role vocabulary plus `in-progress` and `done`, recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
