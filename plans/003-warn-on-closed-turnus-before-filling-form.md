# Plan 003: The public form says at once when its Turnus takes no Registrations

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report - do not improvise. When done, update the status row for this plan
> in `plans/README.md` - unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a44a934..HEAD -- apps/app/src/features/registration/components apps/app/src/locales/cs/registration.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a44a934`, 2026-11-11

## Why this matters

Camps link guardians straight to `/{camp-slug}/prihlaska?turnus={id}`. When that Turnus is full, closed or not yet open (an old link, a bookmark, a tab left open), the form still lets the guardian fill in all four steps, including the children's health answers, and refuses only on submit. Because the link named the Turnus, the Turnus picker is hidden, so there is no way to switch to an open Turnus without leaving the form and losing every answer. After this plan the first step shows why the Turnus is unavailable, offers the picker, and does not let the guardian past step 1 until an open Turnus is chosen.

## Current state

All paths are under `apps/app/src/features/registration/components/` unless noted.

- `use-registration-page.hook.ts` - the form's state. The Turnus is taken from the URL without looking at its availability, and the picker shows only when the link named none:

  ```ts
  // use-registration-page.hook.ts:43-48
  // A link to the form without a Turnus asks for one on the first step; one with it names it in the header.
  const [asksTurnus] = useState(turnusId === undefined);

  const { step } = steps;
  const definition = form.data?.definition;
  const turnus = turnusy.data?.find(({ id }) => id === turnusId);
  ```

  ```ts
  // use-registration-page.hook.ts:76-82
  // The steps something is wrong at, by what this form can tell; the server checks it all again.
  const problemSteps = [
    ...(turnus === undefined ? [stepNumberOf('guardians')] : []),
    ...localErrors.map(({ path }) => stepOfPath(path)),
    ...(outOfAge === -1 ? [] : [stepNumberOf('children')]),
    ...(missingDeclarations.length === 0 ? [] : [stepNumberOf('summary')]),
  ];
  ```

  ```ts
  // use-registration-page.hook.ts:114-117
  turnusy: turnusy.data ?? [],
  turnus,
  asksTurnus: asksTurnus || turnus === undefined,
  isTurnusMissing: steps.isChecked('guardians') && turnus === undefined,
  ```

- `guardians-step.tsx:13-20` - renders `<TurnusSection turnus turnusy onSelect isMissing />` only when `page.asksTurnus`.
- `turnus-section.tsx` - the picker. Options that are not open are disabled (`disabled: option.availability !== 'open'`, line 40) and a `FieldError` shows `t('turnusRequired')` when `isMissing` (line 48), wired with `aria-invalid` and `aria-describedby`.
- `packages/schema/src/camps/turnus/turnus-availability.ts:2` - `TURNUS_AVAILABILITIES = ['not_yet_open', 'open', 'closed_manually', 'closed_by_window', 'full']`. A `PublicTurnus` has `availability` and `remainingPlaces` (`public-turnus.resource.ts:26-27`).
- `apps/app/src/locales/cs/registration.json:100-103` - Czech texts for the server's refusals already exist and say exactly what is needed:

  ```json
  "turnus_not_yet_open": "Přihlašování na tento turnus ještě nezačalo.",
  "turnus_window_closed": "Přihlašování na tento turnus už skončilo.",
  "turnus_closed_manually": "Tábor přihlašování na tento turnus uzavřel.",
  "turnus_full": "Na tomto turnusu už nezbývá dost volných míst.",
  ```

  They are read as `t('refused.<key>')` in the `registration` namespace.

Conventions that apply:

- Every UI string goes through `t()`; texts are Czech, in `apps/app/src/locales/cs/`. Reuse the keys above; add none unless needed.
- No `useMemo`/`useCallback`; braces on every `if`; glossary terms (Turnus, Registration, guardian).
- The server keeps checking availability on submit; this plan only moves the news earlier.
- The frontend has no tests by design.

## Commands you will need

| Purpose   | Command                         | Expected on success |
| --------- | ------------------------------- | ------------------- |
| Typecheck | `pnpm --filter app check-types` | exit 0              |
| Lint      | `pnpm --filter app lint`        | exit 0              |
| Format    | `pnpm format:check`             | exit 0              |

## Scope

**In scope**:

- `apps/app/src/features/registration/components/use-registration-page.hook.ts`
- `apps/app/src/features/registration/components/turnus-section.tsx`
- `apps/app/src/features/registration/components/guardians-step.tsx`

**Out of scope**:

- The API and the contracts.
- Comparing `remainingPlaces` with the number of children (the server's `turnus_full` covers a Turnus with too few places; a live check as children are added is a possible follow-up).
- The Camp page's list of Turnusy.
- Locale files, unless a text is truly missing.

## Git workflow

- Branch: `fix/closed-turnus-notice-on-form`
- Conventional Commits, lowercase imperative subject, at most 72 characters, no body, no AI attribution.
- Suggested subject: `fix: tell on the first step when the Turnus takes no Registrations`
- Do NOT push or open a PR unless instructed. Never `--no-verify`.

## Steps

### Step 1: Derive why the Turnus is closed

In `use-registration-page.hook.ts`, after the `turnus` constant (line 48), add a map from availability to the existing refusal key and the derived reason:

```ts
// Why the Turnus the address names takes no Registrations now, in the words of the server's refusal.
const CLOSED_TURNUS_KEYS = {
  not_yet_open: 'turnus_not_yet_open',
  closed_by_window: 'turnus_window_closed',
  closed_manually: 'turnus_closed_manually',
  full: 'turnus_full',
} as const;
```

Put the constant at module level (above `useRegistrationPage`), and inside the hook:

```ts
const closedTurnus =
  turnus === undefined || turnus.availability === 'open' ? null : CLOSED_TURNUS_KEYS[turnus.availability];
```

Then:

- in `problemSteps`, change the first entry to `...(turnus === undefined || closedTurnus !== null ? [stepNumberOf('guardians')] : []),`
- in the returned object, change `asksTurnus` to `asksTurnus: asksTurnus || turnus === undefined || closedTurnus !== null,`
- add to the returned object: `turnusClosedMessage: closedTurnus === null ? null : t(\`refused.${closedTurnus}\`),`

**Verify**: `pnpm --filter app check-types` -> exit 0.

### Step 2: Show it at the picker

In `turnus-section.tsx` add a prop `closedMessage: string | null` (comment: `// Why the chosen Turnus takes no Registrations now.`). Render it as a `FieldError` with the existing `errorId` when it is not null; the "required" error keeps priority only when no Turnus is chosen (the two cannot both apply: one needs no Turnus, the other a closed one). Set `aria-invalid={isMissing || closedMessage !== null}` and `aria-describedby` to `errorId` in either case.

In `guardians-step.tsx` pass `closedMessage={page.turnusClosedMessage}`.

**Verify**: `pnpm --filter app check-types` -> exit 0.

### Step 3: Gates

**Verify**: `pnpm --filter app lint` -> exit 0; `pnpm format:check` -> exit 0.

## Test plan

Manual, in the running app (`pnpm docker:up`, an Organisation subdomain on `*.localhost`):

1. As an admin close a Turnus manually (or set its capacity to the number registered). Open `/{camp-slug}/prihlaska?turnus=<that id>`. Expected: step 1 shows the picker with the closed reason under it; "next" stays on step 1 and focuses the picker.
2. Pick an open Turnus. Expected: the message goes, "next" advances.
3. Open the form for an open Turnus by link. Expected: no picker, as before.
4. Open the form with no `turnus`. Expected: picker with no message, as before.

If you cannot run a browser, say so in your report; a human must do this check before merge.

## Done criteria

- [ ] `pnpm --filter app check-types`, `pnpm --filter app lint`, `pnpm format:check` exit 0
- [ ] `grep -n "turnusClosedMessage" apps/app/src/features/registration/components/*.ts*` shows the hook and `guardians-step.tsx`
- [ ] `git status` shows only the three in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The excerpts do not match the live code.
- `t(\`refused.${closedTurnus}\`)` does not typecheck against the locale keys and the fix would need new keys or a cast: report instead.
- `showProblems` or `focusFirstProblem` does not focus the picker when step 1 is blocked by a closed Turnus and fixing that needs changes outside the in-scope files.

## Maintenance notes

- The mapping duplicates knowledge the API has in `REFUSED_AVAILABILITY` (`apps/api/src/modules/registrations/registration/services/registration.service.ts`). If a new availability is added, TypeScript flags the `CLOSED_TURNUS_KEYS` lookup.
- Reviewer: check the Turnusy refetch after a successful submit cannot flip the confirmation view (it renders before the form, see `registration-page.tsx:41`).
