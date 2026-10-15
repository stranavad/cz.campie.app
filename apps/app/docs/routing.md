# Routing

[TanStack Router](https://tanstack.com/router) ([LLM index](https://tanstack.com/router/latest/llms.txt)), file-based: each file in `src/routes/` is a route. For router APIs, use its docs.

## How it's wired

The router plugin in `vite.config.ts` generates `src/routeTree.gen.ts` and code-splits every route. The tree is generated code ([generated-code.md](generated-code.md)), so run `pnpm dev` or `pnpm build` after changing route files, before `pnpm check-types`. `src/main.tsx` creates the router and registers its type, which is what makes links, params and search typed.

## Host modes

One build serves two kinds of host; `core/host` resolves the mode from the hostname and the configured platform domain (issue 13):

| Host                     | Mode         | Serves                                                                                                    |
| ------------------------ | ------------ | --------------------------------------------------------------------------------------------------------- |
| `<subdomain>.<platform>` | Organisation | `/` landing, `/{camp-slug}` Turnusy, `/{camp-slug}/prihlaska?turnus={id}` form, `/portal` guardian portal |
| `<platform>` (main host) | Platform     | signup, admin interface, operator console                                                                 |

- Routes of one mode are unreachable in the other; the route tree guards it in one place.
- Features never read the hostname; they get the mode and the current Organisation from `core/host`.
- Public paths are part of the product (camps link to them from their websites); changing one is a breaking change.

## Designing routes

Routes are thin: a route file maps a URL to a feature's page component (exported from the feature's `index.ts`) plus router config such as loaders, search validation and redirects. Page logic stays in the feature, so it doesn't depend on where it's mounted.

- Pages that replace each other (list, detail) share a folder: `routes/.../turnusy/index.tsx` + `routes/.../turnusy/$turnusId.tsx`.
- Search params that a reload or a shared link should keep (filters, selected Turnus, paging) are validated with a Zod schema in the route.
- `__root.tsx` only renders `Application` from `@/core/application` (providers, devtools, outlet); app-wide wrappers belong in `core/application`.
- Features never import `src/routes/` (lint-enforced); they read params through router hooks with a `from` path, which keeps them typed without the dependency.
