# 13 - Frontend scaffold: hostname mode, i18n, /api proxy

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: 02
Stories: 76, 193

## What to build

Create the single React frontend with the latest Vite, React Compiler, Tailwind, TanStack Router and TanStack Query. On start it decides by hostname what it is: on an Organisation subdomain it is the public registration pages and the guardian portal; on the main host it is signup, admin and the platform console. The platform domain comes from configuration. All interface strings go through a translation layer with Czech as the only language. The app calls the API only through a same-origin `/api/*` path, proxied in development and rewritten on Vercel, per ADR-0001. Layout is mobile-first, light theme only.

## Acceptance criteria

- [x] `domino.localhost` renders the public shell and `app.localhost` renders the admin shell
- [x] No hard-coded user-facing string exists outside translation files (lint rule or check)
- [x] API calls go to `/api/...` on the same origin in dev and in the Vercel configuration
- [x] The platform domain and product name come from configuration (production defaults: Campie, `campie.cz`)

## Notes

- Spec sections: Architecture, Other (translation layer)
- ADR-0001 for the proxy

## Comments

2026-11-01 - **Done.** Vite 8 with the React Compiler (Babel preset through `@rolldown/plugin-babel`), Tailwind 4, TanStack Router (file-based, code-split) and Query, i18next with Czech only, Zod-validated config.

- Host modes: `core/host` resolves the mode once from the hostname and `config.platformDomain`. `app.<platform>` is the main host (`app` is reserved), `<subdomain>.<platform>` an Organisation, anything else (the bare domain, nested subdomains, foreign hosts) unknown. Each mode is a branch of the route tree (`routes/organisation/`, `routes/platform/`, `routes/unknown/`); the router's `rewrite` prefixes every URL with the mode and strips it from links and history, so both modes own `/` and neither can reach the other's routes. Verified in headless Chrome on the Docker stack: `domino.localhost` renders the public shell, `app.localhost` the platform shell, `localhost` and `a.b.localhost` the unknown-host page; `/organisation` on the main host and an unknown path on a subdomain render the not-found page inside the shell; the address bar never shows the prefix.
- Translations: `src/locales/cs/common.json`, typed keys, `{{productName}}` and `{{platformDomain}}` filled in by default, Zod messages in Czech. Lint: `react/jsx-no-literals` with `noStrings` (text children, also in braces or template literals) plus `translations/no-literal-text-props` (`oxlint/translations.plugin.ts`) for `placeholder`, `aria-label`, `title`, `alt` and similar props; a probe file with one literal of each kind failed on all seven. Strings outside JSX aren't checked.
- Config: `VITE_PRODUCT_NAME` and `VITE_PLATFORM_DOMAIN` with the production defaults (Campie, `campie.cz`) in the env schema; the dev server defaults the domain to `localhost`. This replaces the planned committed env files (they couldn't be written in this environment, and defaults in the schema need none); `config-and-env.md` updated. The page title is set from `config.productName`.
- `/api`: the Vite proxy now keeps `Host` and adds `X-Forwarded-Host` (`xfwd`), checked with an echo server; `/api/health` answers 200 through `domino.localhost` on the Docker stack. `vercel.json` rewrites `/api/*` to `https://api.campie.cz/api/*` and everything else to `index.html`.
- Not done, on purpose: no `apiClient`, request hooks or `ApiError` yet, since there is no `defineEndpoint` contract to type them against; the first issue that adds a contract adds the client (`docs/api.md`). No shadcn, TanStack Form, dayjs or devtools until first use. No frontend tests (no frontend seam in v1).
- Open for later: the API host in `vercel.json` assumes `api.campie.cz`, while backend hosting is still undecided; change it with that decision, and self-hosters edit it. Issue 14 should confirm Vercel's external rewrite sends `X-Forwarded-Host`. The bare `campie.cz` shows the unknown-host page; redirect it to `app.campie.cz` in Vercel when the domain is set up. Reserved subdomains other than `app` (`www`, `api`, ...) resolve as Organisations and are rejected by the API as unknown (issue 14). i18next 26.5.12 and react-i18next 17.1.9 instead of the newest patch, which was inside pnpm's minimum release age.
