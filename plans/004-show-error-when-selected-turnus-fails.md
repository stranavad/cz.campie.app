# Plan 004: A failed Selected Turnus request shows an error, not "no Turnusy"

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report - do not improvise. When done, update the status row for this plan
> in `plans/README.md` - unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a44a934..HEAD -- apps/app/src/core/selected-turnus apps/app/src/features/participants/components`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a44a934`, 2026-11-11

## Why this matters

The admin page "Přihlášky" decides what to show from the Selected Turnus query. When that request fails (server error, offline), the hook hands back an empty list of Turnusy and the page shows the empty state "no Turnusy" - during an outage the admin is told the Organisation's Turnusy do not exist. After this plan a failed request shows the page's error state, and the empty state shows only when the request succeeded and returned none.

## Current state

All paths are under `apps/app/src/`.

- `core/selected-turnus/hooks/use-selected-turnus.hook.ts` - wraps the query and drops its error:

  ```ts
  // core/selected-turnus/hooks/use-selected-turnus.hook.ts:6-19
  export function useSelectedTurnus() {
    const { membership } = useCurrentMembership();
    const organisationId = membership?.organisation.id ?? '';
    const canRead = membershipAllows(membership, 'registrations', 'read');
    const selected = useSelectedTurnusQuery(organisationId, canRead);
    const select = useSelectTurnusMutation(organisationId);

    return {
      isPending: canRead && selected.isPending,
      turnusy: selected.data?.turnusy ?? [],
      turnusId: selected.data?.turnusId ?? selected.data?.turnusy[0]?.id ?? null,
      selectTurnus: (turnusId: string) => select.mutate(turnusId),
    };
  }
  ```

- `features/participants/components/use-participants-page.hook.ts` - the page's state:

  ```ts
  // line 39
  const { turnusId, turnusy, isPending: isTurnusPending } = useSelectedTurnus();
  // line 63
  hasNoTurnusy: turnusy.length === 0,
  // line 86
  isError: participants.isError,
  ```

- `features/participants/components/participants-page.tsx:50` - `{page.hasNoTurnusy ? <EmptyState icon={<CalendarXIcon />} title={t('noTurnusy')} /> : null}`. The rest of the page renders only when `page.turnusId !== null` (line 51), and somewhere below it `page.isError` drives the list's existing error UI.
- Other callers of `useSelectedTurnus()`: `core/platform-shell/components/use-admin-nav.hook.ts:20`, `core/selected-turnus/components/turnus-switcher.tsx:11`, `features/admin-home/components/use-admin-home.hook.ts:10`, `features/participants/components/use-registration-detail-page.hook.ts:23`, `features/participants/components/create/use-create-registration-page.hook.ts:40`.

Conventions that apply:

- An error counts as a page error only while the query has no data (a failed background refetch keeps `data`; see `apps/app/docs/error-handling.md`).
- Every UI string through `t()`, Czech; reuse the error text the list already shows.
- No frontend tests by design.

## Commands you will need

| Purpose   | Command                         | Expected on success |
| --------- | ------------------------------- | ------------------- |
| Typecheck | `pnpm --filter app check-types` | exit 0              |
| Lint      | `pnpm --filter app lint`        | exit 0              |
| Format    | `pnpm format:check`             | exit 0              |

## Scope

**In scope**:

- `apps/app/src/core/selected-turnus/hooks/use-selected-turnus.hook.ts`
- `apps/app/src/features/participants/components/use-participants-page.hook.ts`
- `apps/app/src/features/participants/components/participants-page.tsx`
- `apps/app/src/features/participants/components/create/use-create-registration-page.hook.ts` and its page component, only if step 3 finds the same defect there

**Out of scope**:

- The Turnus switcher, the admin nav and the admin home: with no data they show nothing, which is acceptable.
- Query options and retries.
- New translation keys, unless no fitting error text exists.

## Git workflow

- Branch: `fix/selected-turnus-error-state`
- Conventional Commits, lowercase imperative subject, at most 72 characters, no body, no AI attribution.
- Suggested subject: `fix: show an error when the Selected Turnus cannot be loaded`
- Do NOT push or open a PR unless instructed. Never `--no-verify`.

## Steps

### Step 1: Expose the error

In `use-selected-turnus.hook.ts` add to the returned object:

```ts
// Failed with nothing to show; a failed refetch keeps the Turnusy it had.
isError: canRead && selected.isError && selected.data === undefined,
```

**Verify**: `pnpm --filter app check-types` -> exit 0.

### Step 2: Use it on the participants page

In `use-participants-page.hook.ts`:

- line 39: also take `isError: isTurnusError` from `useSelectedTurnus()`;
- line 63: `hasNoTurnusy: !isTurnusError && turnusy.length === 0,`
- add `isTurnusError,` to the returned object.

In `participants-page.tsx`, next to the `hasNoTurnusy` line, render the error when `page.isTurnusError`. Find how the list shows `page.isError` today (`grep -rn "isError" apps/app/src/features/participants/components/participant-list/`) and reuse the same component, variant and translation key, so both failures look alike. If the list's error is an `Alert variant="danger" role="alert"` with a key in the `participants` namespace, render exactly that.

**Verify**: `pnpm --filter app check-types` -> exit 0.

### Step 3: Check the create page

Open `features/participants/components/create/use-create-registration-page.hook.ts` around lines 95-100 and its page component. If it derives an empty or "no Turnusy" state from `selected.turnusy.length === 0`, guard it with `!selected.isError` and show that page's existing error UI when `selected.isError`. If it has no such state, change nothing and say so in your report.

**Verify**: `pnpm --filter app check-types` -> exit 0.

### Step 4: Gates

**Verify**: `pnpm --filter app lint` -> exit 0; `pnpm format:check` -> exit 0.

## Test plan

Manual, in the running app (`pnpm docker:up`, `http://app.localhost`): in devtools block the Selected Turnus request (the first `/api/` request the "Přihlášky" page makes for the Turnusy), reload "Přihlášky". Expected: the error alert, not the "no Turnusy" empty state. Unblock and reload: the list. In an Organisation without any Turnus: the empty state, as before.

If you cannot run a browser, say so in your report; a human must do this check before merge.

## Done criteria

- [ ] `pnpm --filter app check-types`, `pnpm --filter app lint`, `pnpm format:check` exit 0
- [ ] `grep -n "isTurnusError" apps/app/src/features/participants/components/use-participants-page.hook.ts apps/app/src/features/participants/components/participants-page.tsx` shows both files
- [ ] `git status` shows only in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The excerpts do not match the live code.
- The list has no reusable error UI and a new text would be needed: report with a proposed Czech text instead of adding one unreviewed.

## Maintenance notes

- Any new consumer of `useSelectedTurnus` that shows an empty state must check `isError` first.
- If plan 002 has landed, this follows the same rule (error only without data).
