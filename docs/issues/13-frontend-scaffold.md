# 13 - Frontend scaffold: hostname mode, i18n, /api proxy

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 02
Stories: 76, 193

## What to build

Create the single React frontend with the latest Vite, React Compiler, Tailwind, TanStack Router and TanStack Query. On start it decides by hostname what it is: on an Organisation subdomain it is the public registration pages and the guardian portal; on the main host it is signup, admin and the platform console. The platform domain comes from configuration. All interface strings go through a translation layer with Czech as the only language. The app calls the API only through a same-origin `/api/*` path, proxied in development and rewritten on Vercel, per ADR-0001. Layout is mobile-first, light theme only.

## Acceptance criteria

- [ ] `domino.localhost` renders the public shell and `app.localhost` renders the admin shell
- [ ] No hard-coded user-facing string exists outside translation files (lint rule or check)
- [ ] API calls go to `/api/...` on the same origin in dev and in the Vercel configuration
- [ ] The platform domain and product name come from configuration (production defaults: Campie, `campie.cz`)

## Notes

- Spec sections: Architecture, Other (translation layer)
- ADR-0001 for the proxy
