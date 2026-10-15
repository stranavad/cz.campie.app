# Config and environments

The app reads everything through one typed `config` object (`@/config`), built from Zod-validated env. A bad value fails at startup instead of surfacing as a runtime bug.

| File                           | Holds                                |
| ------------------------------ | ------------------------------------ |
| `src/config/index.ts`          | builds `config`                      |
| `src/config/env/env.schema.ts` | env variable schema                  |
| `src/config/env/index.ts`      | the only reader of `import.meta.env` |

Lint bans `env` property access elsewhere (destructuring included), keeping raw env out of the app.

## What config holds

- **Product name and platform domain**: production defaults Campie and `campie.cz`, configurable for self-hosters. Host mode resolution uses the platform domain ([routing.md](routing.md)).
- Feature flags and public settings only. Env files are committed and hold no secrets: everything ends up in the bundle.
- Values are baked in at build time, so a change needs a rebuild.

## Local hosts

Locally the platform runs on `*.localhost` (Docker Compose): the main host is `app.localhost`, an Organisation's pages are `<subdomain>.localhost`. Browsers resolve `*.localhost` without `/etc/hosts` entries, and host-only cookies keep each subdomain's sessions apart, as in production.

The dev server proxies `/api` to the API (`vite.config.ts`), forwarding the original host so the API can resolve the Organisation (ADR-0001). Personal overrides go in `apps/app/.env.local` (gitignored).

New variable: add it to the schema, set it in the env files that need it, expose it through `config`.
