# Config and environments

The app reads everything through one typed `config` object (`@/config`), built from Zod-validated env. A bad value fails at startup instead of surfacing as a runtime bug.

| File                           | Holds                                |
| ------------------------------ | ------------------------------------ |
| `src/config/index.ts`          | builds `config`                      |
| `src/config/env/env.schema.ts` | env variable schema                  |
| `src/config/env/index.ts`      | the only reader of `import.meta.env` |

Lint bans `env` property access elsewhere (destructuring included), keeping raw env out of the app.

## What config holds

- **Product name and platform domain** (`VITE_PRODUCT_NAME`, `VITE_PLATFORM_DOMAIN`): the schema defaults are production's, Campie and `campie.cz`; the dev server defaults the domain to `localhost`. Self-hosters set them at build time. Host mode resolution uses the platform domain ([routing.md](routing.md)).
- Feature flags and public settings only, never secrets: everything ends up in the bundle. Defaults live in the schema, so there are no committed env files.
- Values are baked in at build time, so a change needs a rebuild.

## Local hosts

Locally the platform runs on `*.localhost` (Docker Compose): the main host is `app.localhost`, an Organisation's pages are `<subdomain>.localhost`. Browsers resolve `*.localhost` without `/etc/hosts` entries, and host-only cookies keep each subdomain's sessions apart, as in production.

The dev server proxies `/api` to the API (`vite.config.ts`), forwarding the original host so the API can resolve the Organisation (ADR-0001). It targets `http://localhost:3000` unless `API_PROXY_TARGET` says otherwise, as Docker Compose does. Personal overrides go in `apps/app/.env.local` (gitignored).

New variable: add it to the schema with its production default, expose it through `config`.

## Vercel

`vercel.json` rewrites `/api/*` to the API host (`api.campie.cz`, a reserved subdomain) and every other path to `index.html`. The dev proxy keeps `Host` and adds `X-Forwarded-Host`, as Vercel's external rewrites are expected to. The API reads `X-Forwarded-Host` first and falls back to `Host`; that Vercel sends `X-Forwarded-Host` on an external rewrite is still to be checked on the first deployment.
