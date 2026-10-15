# 02 - Repo scaffold: pnpm + Turborepo, api/app/schema, AGPL, lint, CI

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 01
Stories: 192

## What to build

Create the new platform repository as a pnpm monorepo orchestrated by Turborepo with three packages: `api` (NestJS), `app` (React frontend) and `schema` (shared validation schemas and types, built before both apps). Add TypeScript in strict mode, linting and formatting, an AGPL-3.0 LICENSE and a README that explains how to run it. Add CI that runs install, typecheck, lint and tests on every push. The repository must contain no secrets and no Domino-specific names or texts from the first commit.

Tooling follows the workspace guides (`AGENTS.md` in the root and in each workspace, written before this issue): Oxlint type-aware in every workspace with shared groups in `packages/oxlint-config` and workspace groups in each `oxlint/` (layer boundaries, `Clock` only, no `process.env` outside config); Prettier for the whole repo with import sorting; Husky `pre-commit` (lint-staged + type check) and `commit-msg` (commitlint, Conventional Commits, see `docs/git.md`); agent guardrails in `.claude/settings.json` (deny rules for force-push, `--no-verify`, reading `.env` files, editing hooks; attribution off) with a hook that blocks reading `.env` files. Port the setup from the Koala42 template (`/Users/davidstranava/programming/com.koala42.monorepo-template`), not its clean-architecture structure, worktree slots or stacked-PR tooling.

## Acceptance criteria

- [ ] `pnpm install && pnpm build` succeeds from a clean clone, building `schema` before `api` and `app`
- [ ] CI runs typecheck, lint and test and fails on any error
- [ ] LICENSE is AGPL-3.0; README states the license and the local start command
- [ ] A trivial schema exported from `schema` is imported by both `api` and `app` and type-checks
- [ ] A secret scanner or equivalent CI step guards against committed credentials
- [ ] A file violating a workspace lint group (e.g. `new Date()` in an API service, a controller importing a repository) fails `pnpm lint`
- [ ] A commit with a non-conventional message is rejected by the `commit-msg` hook
- [ ] Every workspace has its `AGENTS.md` with `CLAUDE.md` as a symlink

## Notes

- Spec sections: Architecture, Other (public repository)
- Port from Domino: monorepo layout in `pnpm-workspace.yaml`, `turbo.json` (structure only)
- Versions come from ADR-0003 (issue 01); TypeScript 7 means no NestJS CLI and no typescript-eslint
- Prettier config from the template (`.prettierrc.json`: 4 spaces, 120 columns, single quotes, trailing commas, `@ianvs/prettier-plugin-sort-imports`)
