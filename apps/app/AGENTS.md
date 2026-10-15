# App

The single React frontend (Vite SPA), organized by feature on top of shared layers. It decides by hostname what it is: on an Organisation's subdomain the public registration pages and the guardian portal, on the main host signup, the admin interface and the operator console. It talks to `apps/api` only through same-origin `/api` (ADR-0001), with a typed client that validates every response against [`@repo/schema`](../../packages/schema/AGENTS.md). Index: load only the doc for your task.

## Scripts

In `apps/app`, or from the root `pnpm --filter app <script>`.

| Script             | Purpose                                   |
| ------------------ | ----------------------------------------- |
| `pnpm dev`         | dev server on `*.localhost`, `/api` proxy |
| `pnpm build`       | type check + production build             |
| `pnpm preview`     | serve the last build                      |
| `pnpm check-types` | TypeScript                                |
| `pnpm lint`        | Oxlint, type-aware, warnings fail         |

## Stack

Versions: ADR-0003. Rows marked * come from the Koala42 template and are confirmed when issue 13 scaffolds the app.

| Area         | Tech                                                   |
| ------------ | ------------------------------------------------------ |
| UI           | React 19 + React Compiler (Babel)                      |
| Build        | Vite 8, TypeScript 7                                   |
| Routing      | TanStack Router 1, file-based (`src/routes/`)          |
| Server state | TanStack Query 5                                       |
| Forms        | TanStack Form 1 *                                      |
| Validation   | Zod 4                                                  |
| Styling      | Tailwind CSS 4, shadcn/ui on Base UI, Lucide icons *   |
| i18n         | i18next + react-i18next *, Czech only                  |
| Dates        | dayjs *                                                |
| Lint/format  | Oxlint (this app), Prettier (root)                     |

## Documentation

| Doc                                              | Read when you...                                          |
| ------------------------------------------------ | --------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)     | place code: folders, layers, imports, naming, components  |
| [docs/routing.md](docs/routing.md)               | add a page or route, work with host modes                 |
| [docs/api.md](docs/api.md)                       | call the API, add queries and mutations                   |
| [docs/error-handling.md](docs/error-handling.md) | handle failures, retries, error UI                        |
| [docs/forms.md](docs/forms.md)                   | build a form or form field                                |
| [docs/state-management.md](docs/state-management.md) | decide where state lives, add a context               |
| [docs/translations.md](docs/translations.md)     | add texts, namespaces                                     |
| [docs/styling.md](docs/styling.md)               | style, theme tokens, branding, shadcn components          |
| [docs/config-and-env.md](docs/config-and-env.md) | read config, add an env var, local hosts                  |
| [docs/react-compiler.md](docs/react-compiler.md) | memoization questions, odd behaviour after compiling      |
| [docs/generated-code.md](docs/generated-code.md) | route tree, shadcn files, stale output                    |

## Testing

The spec has no frontend seam in v1: no component tests, no browser tests, no mocks of the API. Logic worth a test does not live here: prices and form validation come from the pure modules in `@repo/schema`, tested there; behaviour comes from the API, tested over HTTP. Verify a change by running it in the browser (root `pnpm dev`), not by trusting a passing type check.

## What we deliberately do not do

- **No state library.** Query, Form, the URL and small contexts cover it ([docs/state-management.md](docs/state-management.md)).
- **No `useMemo`, `useCallback` or `React.memo`** without a comment saying which library needs the stable reference.
- **No raw user-facing text in JSX.** Everything goes through `t()`; lint-enforced.
- **No hostname checks in features.** The host mode comes from `core/host`.
- **No `fetch` outside `src/lib/api/`**, and no `apiClient` outside `*.service.ts`.
- **No API data copied into state or context.**
- **No dark mode.** Light theme only, mobile-first.
- **No `any`.**
