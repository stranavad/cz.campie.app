# 02 - Repo scaffold: pnpm + Turborepo, api/app/schema, AGPL, lint, CI

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: 01
Stories: 192

## What to build

Create the new platform repository as a pnpm monorepo orchestrated by Turborepo with three packages: `api` (NestJS), `app` (React frontend) and `schema` (shared validation schemas and types, built before both apps). Add TypeScript in strict mode, linting and formatting, an AGPL-3.0 LICENSE and a README that explains how to run it. Add CI that runs install, typecheck, lint and tests on every push. The repository must contain no secrets and no Domino-specific names or texts from the first commit.

Tooling follows the workspace guides (`AGENTS.md` in the root and in each workspace, written before this issue): Oxlint type-aware in every workspace with shared groups in `packages/oxlint-config` and workspace groups in each `oxlint/` (layer boundaries, `Clock` only, no `process.env` outside config); Prettier for the whole repo with import sorting; Husky `pre-commit` (lint-staged + type check) and `commit-msg` (commitlint, Conventional Commits, see `docs/git.md`); agent guardrails in `.claude/settings.json` (deny rules for force-push, `--no-verify`, reading `.env` files, editing hooks; attribution off) with a hook that blocks reading `.env` files. Port the setup from the Koala42 template (`/Users/davidstranava/programming/com.koala42.monorepo-template`), not its clean-architecture structure, worktree slots or stacked-PR tooling.

## Acceptance criteria

- [x] `pnpm install && pnpm build` succeeds from a clean clone, building `schema` before `api` and `app`
- [x] CI runs typecheck, lint and test and fails on any error
- [x] LICENSE is AGPL-3.0; README states the license and the local start command
- [x] A trivial schema exported from `schema` is imported by both `api` and `app` and type-checks
- [x] A secret scanner or equivalent CI step guards against committed credentials
- [x] A file violating a workspace lint group (e.g. `new Date()` in an API service, a controller importing a repository) fails `pnpm lint`
- [x] A commit with a non-conventional message is rejected by the `commit-msg` hook
- [x] Every workspace has its `AGENTS.md` with `CLAUDE.md` as a symlink

## Notes

- Spec sections: Architecture, Other (public repository)
- Port from Domino: monorepo layout in `pnpm-workspace.yaml`, `turbo.json` (structure only)
- Versions come from ADR-0003 (issue 01); TypeScript 7 means no NestJS CLI and no typescript-eslint
- Prettier: 2 spaces (as in the artspect repositories), 120 columns, single quotes, trailing commas, imports sorted with `@ianvs/prettier-plugin-sort-imports` as in the template

## Comments

2026-10-15 - Scaffold committed. Verified locally on Node 26.12.0 and pnpm 12.11.2:

- A clean `pnpm build` builds `@repo/schema` first, then `api` (`tsc`) and `app` (`tsc -b && vite build`); `pnpm check-types`, `pnpm lint` and `pnpm test` pass.
- `errorResponseSchema` from `@repo/schema/shared` is used by the API's global `HttpErrorFilter`, tested over HTTP with Supertest (an unexpected error becomes a bare 500, an HTTP exception keeps its status and `code`), and by the app's `readErrorResponse`, which the API client of issue 13 will use.
- Lint groups checked with throwaway violating files: `new Date()`, `Date.now()` and `process.env` in a service, a controller importing a repository, a repository importing a service, a missing `curly`; in `schema` a `node:` import and imports bypassing a module's `index.ts`; in `app` a feature importing another feature, `import.meta.env` outside `src/config/env/` and raw JSX text.
- commitlint rejects `added stuff`, an uppercase subject, a free-form body and a `Co-Authored-By` line, and accepts a `Relates: docs/issues/NN-slug.md` body. The env hook blocks env files except the committed, secret-free `.env.example` and `.env.test`.
- CI (format, build, types, lint, test, and gitleaks over the full history) passes on GitHub. The first run failed because `actions/setup-node` tried to cache pnpm before it was installed, which showed a failing step fails the run; fixed in a follow-up commit.
- Left to later issues: app lint exceptions that need issue 13's folders (routes, shadcn), the root Docker scripts (issue 03), config and the API port (issue 06).
- pnpm 12 added `minimumReleaseAgeExclude` entries for the ADR-0003 versions younger than its default release-age gate (React 19.3.1, Vitest 5.0.5).
