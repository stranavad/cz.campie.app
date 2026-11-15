# Plan 007: The public registration form asks before the guardian leaves with answers filled in

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report - do not improvise. When done, update the status row for this plan
> in `plans/README.md` - unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a44a934..HEAD -- apps/app/src/features/registration apps/app/src/locales/cs/registration.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. Plan 002 is expected to have changed
> the `isError` line of `use-registration-page.hook.ts`; that alone is fine.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (a guard that fires at the wrong moment blocks the confirmation or the card payment redirect)
- **Depends on**: plans/002-keep-screens-when-background-refetch-fails.md
- **Category**: bug
- **Planned at**: commit `a44a934`, 2026-11-11

## Why this matters

The public form is four steps, with health answers per child, and everything typed lives in React state only. A guardian on step 3 who taps the header's back chevron once too often, taps the Organisation's logo, pulls to refresh, or closes the tab loses every answer with no warning; on a phone that is easy to do. The form deliberately does not store answers in the browser (they include health data), so the protection has to be a question before leaving: "you have unsent answers, really leave?".

## Current state

All paths are under `apps/app/src/`.

- `features/registration/components/use-registration-answers.hook.ts:11-15` - the answers, all `useState`:

  ```ts
  const [participants, setParticipants] = useState<Answers[]>([{}]);
  const [registration, setRegistration] = useState<Answers>({});
  const [ticked, setTicked] = useState<readonly string[]>([]);
  ```

- `features/registration/components/use-registration-steps.hook.ts:9-27` - the open step lives in the address as `?krok=2` on the same route (`/organisation/$campSlug/prihlaska`), so the browser's back button goes back a step. The Turnus choice also navigates on this route (`?turnus=`). These in-form navigations must never be blocked.
- `features/registration/components/registration-header.tsx:29-37` - on step 1 the back chevron is a `<Link to="/organisation/$campSlug">`, which leaves the form.
- `core/organisation-shell/components/organisation-header.tsx:27` - the logo is a `<Link to="/organisation">`, also on the form.
- `features/registration/components/use-registration-page.hook.ts` - composes the hooks; `submit.submitted` is the server's answer once the Registration is in (`submitted: submit.submitted`), and after it `registration-page.tsx:41` renders the confirmation instead of the form.
- After a successful submit with card payment chosen, the page redirects the browser to Comgate (a full navigation away). That must not prompt.
- Nothing in `apps/app/src` uses `useBlocker` or `beforeunload` today.
- TanStack Router's blocker, as installed (`@tanstack/react-router` 1.170):

  ```ts
  type UseBlockerOpts = {
    shouldBlockFn: (args: { current; next; action }) => boolean | Promise<boolean>; // current/next have routeId, pathname, params, search
    enableBeforeUnload?: boolean | (() => boolean);
    disabled?: boolean;
    withResolver?: boolean; // true: returns { status: 'blocked' | 'idle', proceed, reset, ... }
  };
  ```

- Dialog exemplar: `features/organisation-settings/components/two-step-section/two-step-off-dialog.tsx` (`Dialog`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose` from `@/components/ui/dialog`, a `variant="destructive"` confirm button).

Conventions that apply:

- Read `apps/app/docs/routing.md` and `apps/app/docs/state-management.md` first.
- Every UI string through `t()`; Czech; namespace `registration` in `locales/cs/registration.json`. Hyphen "-", never an em-dash.
- State in `use-*.hook.ts`, presentational components next to them. No `useMemo`/`useCallback`. Braces on every `if`.
- No answers in `localStorage` or `sessionStorage`: they include health data.
- No frontend tests by design.

## Commands you will need

| Purpose   | Command                         | Expected on success             |
| --------- | ------------------------------- | ------------------------------- |
| Typecheck | `pnpm --filter app check-types` | exit 0                          |
| Lint      | `pnpm --filter app lint`        | exit 0                          |
| Format    | `pnpm format`                   | rewrites only files you touched |

## Scope

**In scope**:

- `apps/app/src/features/registration/components/use-registration-page.hook.ts`
- `apps/app/src/features/registration/components/use-leave-guard.hook.ts` (create)
- `apps/app/src/features/registration/components/leave-dialog.tsx` (create)
- `apps/app/src/features/registration/components/registration-page.tsx`
- `apps/app/src/locales/cs/registration.json`

**Out of scope**:

- Persisting answers anywhere.
- The admin's "new Registration" page and the form builder: same weakness, separate plans if wanted.
- `registration-header.tsx` and `organisation-header.tsx`: the router blocker catches their links; do not change the links.
- The guardian portal's edit form.

## Git workflow

- Branch: `feat/registration-form-leave-guard`
- Conventional Commits, lowercase imperative subject, at most 72 characters, no body, no AI attribution.
- Suggested subject: `feat: ask before leaving the registration form with answers filled in`
- Do NOT push or open a PR unless instructed. Never `--no-verify`.

## Steps

### Step 1: The guard hook

Create `use-leave-guard.hook.ts`:

```ts
import { useBlocker } from '@tanstack/react-router';

/**
 * Asks before the guardian leaves the form with answers not sent: a link away from it, the browser's back
 * past its first step, a reload or a closed tab. Moving between the form's own steps is never stopped.
 * @param isActive whether there is something to lose
 */
export function useLeaveGuard(isActive: boolean) {
  return useBlocker({
    // The steps and the Turnus live in the search of the one route, so leaving is a change of the path.
    shouldBlockFn: ({ current, next }) => current.pathname !== next.pathname,
    enableBeforeUnload: isActive,
    disabled: !isActive,
    withResolver: true,
  });
}
```

**Verify**: `pnpm --filter app check-types` -> exit 0.

### Step 2: Decide when there is something to lose

In `use-registration-page.hook.ts`, after `answers` and `submit` exist, compute:

```ts
// Something typed and not yet sent; once the Registration is in, or on its way to the card gateway,
// nothing is lost by leaving.
const hasUnsentAnswers =
  submit.submitted === undefined &&
  !submit.isSending &&
  (Object.keys(answers.registration).length > 0 || answers.participants.some((child) => Object.keys(child).length > 0));
const leave = useLeaveGuard(hasUnsentAnswers);
```

and add `leave` to the returned object.

Check one thing by reading `use-registration-answers.hook.ts` fully: if clearing a field stores an empty string rather than removing the key, `Object.keys(...).length > 0` stays true after the guardian empties the form. That is acceptable (a prompt too many is harmless); do not add emptiness logic.

**Verify**: `pnpm --filter app check-types` -> exit 0.

### Step 3: The dialog

Create `leave-dialog.tsx`, modelled on `two-step-off-dialog.tsx`, with props `open: boolean`, `onStay: () => void`, `onLeave: () => void`. `onOpenChange` closing the dialog calls `onStay`. The stay button is the default (outline, via `DialogClose`), the leave button `variant="destructive"`.

Add to `locales/cs/registration.json` at the top level (next to `"error"`):

```json
"leave": {
  "title": "Odejít z přihlášky?",
  "description": "Vyplněné údaje jsme ještě neodeslali a po odchodu se ztratí.",
  "stay": "Zůstat a pokračovat",
  "confirm": "Odejít"
}
```

In `registration-page.tsx`, in the form branch only (the final `return`, not the loading, error or submitted branches), render:

```tsx
<LeaveDialog
  open={page.leave.status === 'blocked'}
  onStay={() => page.leave.reset?.()}
  onLeave={() => page.leave.proceed?.()}
/>
```

**Verify**: `pnpm --filter app check-types` -> exit 0.

### Step 4: Gates

Run `pnpm format`, then:

**Verify**: `pnpm --filter app lint` -> exit 0; `pnpm format:check` -> exit 0; `git status` lists only in-scope files.

## Test plan

Manual, in the running app (`pnpm docker:up`, an Organisation subdomain on `*.localhost`). All eight must hold:

1. Open the form, type nothing, tap the back chevron: leaves at once, no dialog.
2. Type a guardian name, tap the back chevron on step 1: dialog. "Zůstat a pokračovat": still on the form with the name. Again, "Odejít": on the Camp page.
3. With answers, tap the Organisation's logo: dialog.
4. With answers, go to step 3 and use the browser's back button twice: steps 2 and 1 open, no dialog. Back once more: dialog.
5. With answers, pick another Turnus in the picker: no dialog.
6. With answers, reload the tab: the browser's own "leave site?" prompt.
7. Submit a Registration by bank transfer: confirmation shows; navigating away from it or reloading gives no dialog and no prompt.
8. Submit with card payment (fake gateway locally): the redirect to the gateway happens with no prompt.

If you cannot run a browser, say so in your report and mark the plan `BLOCKED (needs manual check)`; a human must run this list before merge.

## Done criteria

- [ ] `pnpm --filter app check-types`, `pnpm --filter app lint`, `pnpm format:check` exit 0
- [ ] `grep -rn "useBlocker" apps/app/src` matches only `use-leave-guard.hook.ts`
- [ ] `grep -rn "localStorage\|sessionStorage" apps/app/src/features/registration` returns no match
- [ ] The eight manual checks pass (recorded in the report)
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

- `useBlocker` in the installed router does not accept the options shown (check `node_modules/@tanstack/react-router/dist/esm/useBlocker.d.ts`).
- Manual check 4 or 5 shows a dialog: the host rewrite (`core/host/host-rewrite.helper.ts`) makes `pathname` differ between steps. Report what `current.pathname` and `next.pathname` were.
- Manual check 8 prompts and it cannot be fixed with the `isSending`/`submitted` conditions inside the in-scope files.

## Maintenance notes

- The guard relies on steps living in the search of one route. If steps ever become separate paths, `shouldBlockFn` must compare route ids instead.
- Reviewer: the Czech texts were written by the planner; read them.
- Deferred: the same guard for the admin's new Registration page and the form builder.
