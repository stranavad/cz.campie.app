# Oxlint config

Rule groups shared by every workspace's `oxlint.config.ts`: one file per concern in `src/`, imported by subpath (`@repo/oxlint-config/<group>`) and combined through `extends`. Oxlint runs type-aware (`--type-aware`, tsgolint on TypeScript 7; ADR-0003) and warnings fail.

## Scripts

| Script             | Purpose    |
| ------------------ | ---------- |
| `pnpm check-types` | TypeScript |
| `pnpm lint`        | Oxlint     |

No build: Oxlint loads the TypeScript source through Node's type stripping, so only erasable syntax.

## Groups

| Group        | What                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| `base`       | every workspace: `eqeqeq`, `curly`, no `console`, no `any`, no import cycles or duplicates |
| `type-aware` | floating and misused promises, exhaustive switches, no unsafe `any` flow, no deprecated    |
| `node`       | Node plugin and globals                                                                    |
| `react`      | React, hooks, Fast Refresh exports                                                         |
| `a11y`       | jsx-a11y                                                                                   |
| `vitest`     | Vitest plugin, no `.only` or `.skip`                                                       |
| `time`       | `time/no-current-time` (JS plugin in `src/plugins/`), configured per app                   |

## Workspace groups

Rules tied to one app's folders or messages live in that workspace's `oxlint/`, not here.

| Workspace         | Groups                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `apps/api`        | layer boundaries, `Clock` only (`time/no-current-time` outside the clock adapters and tests), `process.env` only in config |
| `apps/app`        | feature boundaries, `import.meta.env` only in `src/config/env/`, no raw JSX text, only `*.service.ts` imports `apiClient`  |
| `packages/schema` | no Node, Nest, React or Drizzle imports; module API through `index.ts`                                                     |

## Approach

- **Shared means stack, not app.** A group holds rules any workspace on that stack wants.
- **Extended configs pass only `rules`, `plugins`, `jsPlugins` and `overrides`.** `env`, `globals`, `settings` and `ignorePatterns` from a group are dropped; put them in an override on `**` or in the workspace's root config.
- **Custom rules are JS plugins** in `src/plugins/`, loaded by a group via `jsPlugins`; the workspace sets the rule and its options.
- **`--print-config` hides options of extended rules.** Check a rule by linting a violating file.
- **A lint rule beats a doc bullet.** A correction that keeps coming up in review becomes a rule here or in a workspace's `oxlint/`.
