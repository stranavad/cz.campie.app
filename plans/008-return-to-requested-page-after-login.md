# Plan 008: After signing in, admins and guardians land on the page they asked for

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report - do not improvise. When done, update the status row for this plan
> in `plans/README.md` - unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a44a934..HEAD -- apps/app/src/features/login apps/app/src/routes/platform/prihlaseni.tsx apps/app/src/features/portal/components apps/app/src/core/account`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED (touches both login flows; a return target must never become an open redirect)
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a44a934`, 2026-11-11

## Why this matters

An admin who opens a link to a Registration (from a colleague, a bookmark, or after the 12 hour session ran out) is sent to the login and afterwards always to the admin home; the Registration has to be found again. A guardian who follows a link to their documents lands on the portal's home after signing in. Both redirects also use `replace`, so the browser's back button cannot recover the address. After this plan the login remembers where the person was going and takes them there.

## Current state

All paths are under `apps/app/src/`.

**Host modes and paths (read `apps/app/docs/routing.md` first).** One build serves the main host (`app.<platform>`, mode `platform`) and every Organisation subdomain (mode `organisation`). Route files live under `routes/platform/` and `routes/organisation/`; `core/host/host-rewrite.helper.ts` prefixes every URL with the mode on the way in and strips it on the way out:

```ts
// core/host/host-rewrite.helper.ts:11-21
input: ({ url }) => {
  url.pathname = `${prefix}${url.pathname}`;
  return url;
},
output: ({ url }) => {
  if (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)) {
    url.pathname = url.pathname.slice(prefix.length) || '/';
  }
  return url;
},
```

So the browser shows `/prihlasky/<id>` while the router's own location is `/platform/prihlasky/<id>`. Links are written with the prefixed route path (`to="/platform/prihlaseni"`).

**Admin side**

- Eleven pages redirect a signed-out visitor the same way, for example `features/participants/components/registration-detail-page.tsx:38`:

  ```tsx
  return <Navigate to="/platform/prihlaseni" replace />;
  ```

  The full list (`grep -rn '<Navigate to="/platform/prihlaseni" replace />' apps/app/src`): `organisation-settings/components/audit-log-page.tsx`, `organisation-settings/components/organisation-settings-page.tsx`, `camps/components/camp-preview-page.tsx`, `camps/components/camps-page.tsx`, `participants/components/participants-page.tsx`, `participants/components/registration-detail-page.tsx`, `participants/components/create/create-registration-page.tsx`, `account-settings/components/account-settings-page.tsx`, `admin-home/components/admin-home-page.tsx`, `console/components/console-page.tsx`, `members/components/members-page.tsx` (all under `features/`).

- `routes/platform/prihlaseni.tsx` - the login route, no search validation:

  ```ts
  export const Route = createFileRoute('/platform/prihlaseni')({ component: LoginPage });
  ```

- `features/login/components/login-form/use-login-form.hook.ts:30-32` - always goes home:

  ```ts
  await logIn.mutateAsync(loginFormSchema.parse(value));
  await navigate({ to: '/platform' });
  ```

- A route with validated search, as the pattern to follow: `routes/platform/prihlasky.tsx` (`validateSearch: z.object({ platba: z.enum(PAYMENT_TABS).optional().catch(undefined), ... })`, and the component passes `Route.useSearch()` into the feature's page as a prop). Features never import `src/routes/` (lint-enforced).

**Guardian side**

- Four portal pages redirect on a 401: `features/portal/components/documents-page.tsx:28`, `consents-page.tsx:25`, `edit-page.tsx:21`, `portal-page.tsx:18`, each `<Navigate to="/organisation/portal/prihlaseni" replace />`.
- The guardian signs in by an emailed link that opens `/portal/prihlaseni?token=...`, usually in a new tab, so a search param on the first tab's login page cannot carry the target. `features/portal/components/login-page.tsx:38-43`:

  ```tsx
  onClick={() =>
    signIn.mutate(
      { token },
      { onSuccess: () => void navigate({ to: '/organisation/portal', replace: true }) },
    )
  }
  ```

- `lib/theme/theme.ts` shows the house way to use `localStorage`: every read and write in `try/catch`, the app working without it.

Conventions that apply:

- Shared code used by several features lives in `core/`; `core/account` already holds `useCurrentMembership` and is imported by these pages. Features do not import each other.
- Public paths are Czech (`prihlasky`, `prihlaseni`); the return parameter is named `zpet`.
- No hostname checks in features. No `useMemo`/`useCallback`. Braces on every `if`. Every string through `t()` (this plan adds no texts).
- No frontend tests by design.

## Commands you will need

| Purpose                                                     | Command                         | Expected on success             |
| ----------------------------------------------------------- | ------------------------------- | ------------------------------- |
| Build (regenerates the route tree after route file changes) | `pnpm --filter app build`       | exit 0                          |
| Typecheck                                                   | `pnpm --filter app check-types` | exit 0                          |
| Lint                                                        | `pnpm --filter app lint`        | exit 0                          |
| Format                                                      | `pnpm format`                   | rewrites only files you touched |

## Scope

**In scope**:

- `apps/app/src/core/account/` - one new component `login-redirect.tsx` and its export from the folder's `index.ts`
- The eleven admin pages listed above (one line each)
- `apps/app/src/routes/platform/prihlaseni.tsx`
- `apps/app/src/features/login/components/login-page.tsx`, `login-form/login-form.tsx`, `login-form/use-login-form.hook.ts`
- `apps/app/src/features/portal/components/shared/portal-login-redirect.tsx` (create), `shared/portal-return.helper.ts` (create)
- The four portal pages listed above (one line each) and `features/portal/components/login-page.tsx`
- `apps/app/src/routeTree.gen.ts` only as regenerated by the build

**Out of scope**:

- The API, the emailed login link and its contents.
- The two-step (TOTP) screens: whatever the app does between the password and the admin home today must keep working; if the return target is lost across the TOTP step, report it as a follow-up, do not rework that flow.
- Session expiry detection inside mutations (`lib/api/request-hooks.ts`).

## Git workflow

- Branch: `feat/return-after-login`
- Conventional Commits, lowercase imperative subject, at most 72 characters, no body, no AI attribution. Two commits, admin then guardian.
- Suggested subjects: `feat: return admins to the page they asked for after login`, `feat: return guardians to the portal page they asked for after login`
- Do NOT push or open a PR unless instructed. Never `--no-verify`.

## Steps

### Step 1: One redirect component for admins

Create `core/account/login-redirect.tsx`:

- It reads the current location with `useLocation()` and renders `<Navigate to="/platform/prihlaseni" search={{ zpet }} replace />`.
- `zpet` is the address as the browser shows it: the router location's pathname with the leading `/platform` removed (or `/` when nothing is left), plus the search string. When the result is `/`, pass `zpet: undefined`, so the plain login address stays clean.
- One-line comment above it: `// Sends a signed-out admin to the login, which brings them back here.`

Export it from `core/account/index.ts`.

In `routes/platform/prihlaseni.tsx` add `validateSearch: z.object({ zpet: z.string().optional().catch(undefined) })` and pass the value into `LoginPage` as a prop `returnTo`, following `routes/platform/prihlasky.tsx`.

**Verify**: `pnpm --filter app build` -> exit 0; `pnpm --filter app check-types` -> exit 0.

### Step 2: Use it on the eleven pages

Replace each `<Navigate to="/platform/prihlaseni" replace />` in the listed files with `<LoginRedirect />` and fix the imports (drop `Navigate` where it is no longer used).

**Verify**: `grep -rn '<Navigate to="/platform/prihlaseni"' apps/app/src` -> only `core/account/login-redirect.tsx`. `pnpm --filter app check-types` -> exit 0.

### Step 3: Go back after the login

Thread `returnTo` from `LoginPage` through `LoginForm` into `useLoginForm(returnTo)`. After `logIn.mutateAsync(...)`:

- Accept `returnTo` only if it is a same-site path: it starts with a single `/`, does not start with `//` or `/\`, contains no `://`, and is not the login itself (`/prihlaseni`). Put this check in a small pure function in the same file with a comment: `// Only a path of this site: a link must never send a fresh login elsewhere.`
- When accepted, go there with the router's history, which takes the address as the browser shows it: `router.history.push(returnTo)` (`const router = useRouter()` from `@tanstack/react-router`). Otherwise keep `await navigate({ to: '/platform' })`.

**Verify**: `pnpm --filter app check-types` -> exit 0. Then the manual admin checks in the test plan.

### Step 4: Guardian side

Create `features/portal/components/shared/portal-return.helper.ts` with two functions, both wrapped in `try/catch` as `lib/theme/theme.ts` does:

- `rememberPortalReturn(path: string): void` - stores `{ path, at: <now in ms> }` as JSON under the `localStorage` key `portal-return`.
- `takePortalReturn(): string | null` - reads and removes the key; returns the path only if it starts with `/portal/`, does not start with `/portal/prihlaseni`, contains no `://`, and `at` is less than 60 minutes old; else `null`.

The value is a path with a Registration id, no personal data. Say so in a one-line comment.

Create `shared/portal-login-redirect.tsx`: computes the browser-facing path as in step 1 (strip the leading `/organisation`), calls `rememberPortalReturn` in a `useEffect`, and renders `<Navigate to="/organisation/portal/prihlaseni" replace />`. Skip remembering when the path is `/portal`.

Replace the four portal pages' `<Navigate to="/organisation/portal/prihlaseni" replace />` with `<PortalLoginRedirect />`.

In `features/portal/components/login-page.tsx`, change `onSuccess` to: `const back = takePortalReturn();` then `back === null ? navigate({ to: '/organisation/portal', replace: true }) : router.history.replace(back)`.

**Verify**: `grep -rn '<Navigate to="/organisation/portal/prihlaseni"' apps/app/src` -> only `portal-login-redirect.tsx`. `pnpm --filter app check-types` -> exit 0.

### Step 5: Gates

Run `pnpm format`, then:

**Verify**: `pnpm --filter app lint` -> exit 0; `pnpm format:check` -> exit 0; `git status` lists only in-scope files.

## Test plan

Manual, in the running app (`pnpm docker:up`). All must hold:

Admin, on `http://app.localhost`:

1. Signed out, open `/prihlasky/<a real Registration id>`. Expected: the login at `/prihlaseni?zpet=%2Fprihlasky%2F<id>`; after signing in, that Registration's detail.
2. Signed out, open `/prihlasky?platba=overdue`. Expected: after signing in, the list with the overdue tab.
3. Signed out, open `/`. Expected: the login without `zpet`; after signing in, the admin home.
4. Open `/prihlaseni?zpet=https://example.com` and `/prihlaseni?zpet=//example.com`. Expected: after signing in, the admin home, never another site.
5. An admin with TOTP on: do check 1. Expected: lands on the Registration after the code; if it lands on the home instead, record it as a follow-up in your report (out of scope to fix).

Guardian, on an Organisation subdomain:

6. Signed out, open `/portal/<registration id>/dokumenty`. Expected: the portal login. Ask for a link, open it from the local mail log in a NEW tab, click sign in. Expected: the documents page.
7. Sign out, ask for a link from the login page directly, sign in. Expected: the portal home.

If you cannot run a browser, say so and mark the plan `BLOCKED (needs manual check)`; a human must run this list before merge.

## Done criteria

- [ ] `pnpm --filter app build`, `pnpm --filter app check-types`, `pnpm --filter app lint`, `pnpm format:check` exit 0
- [ ] The two greps in steps 2 and 4 return only the new redirect components
- [ ] Manual checks 1-4, 6 and 7 pass; check 5 is recorded either way
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

- `useLocation()` gives the browser-facing path rather than the prefixed one (or the reverse of what step 1 assumes): adjust the stripping, and if `router.history.push` then lands on a "not found" page, stop and report both observed values.
- `router.history.push(returnTo)` reloads the whole page or loses the session state: report; do not fall back to `window.location`.
- The login page is also reached with a session in place by some flow that would now loop (login -> page -> login).
- Manual check 4 ever leaves the site.

## Maintenance notes

- Any new admin page must use `<LoginRedirect />`, and any new portal page `<PortalLoginRedirect />`. If one is missed twice, add an Oxlint rule in `apps/app/oxlint/` forbidding a `Navigate` to either login path outside these two components.
- Reviewer: scrutinise the return-path check in `use-login-form.hook.ts` and `takePortalReturn`; those two functions are the whole defence against an open redirect.
- Deferred: carrying the target through the TOTP step if check 5 shows it is lost.
