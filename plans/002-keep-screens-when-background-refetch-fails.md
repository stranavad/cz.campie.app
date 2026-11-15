# Plan 002: A failed background refetch never replaces a screen that has data

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report - do not improvise. When done, update the status row for this plan
> in `plans/README.md` - unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a44a934..HEAD -- apps/app/src/features/registration apps/app/src/features/portal/components/edit-page.tsx apps/app/src/features/participants/components apps/app/src/features/camps/components`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a44a934`, 2026-11-11

## Why this matters

TanStack Query sets `isError` to `true` when a background refetch fails, even though the earlier `data` is kept. Several pages branch on `isError` before they look at `data`, so one failed refetch (window focus, a 4 minute interval, an invalidation after a mutation) unmounts a screen the user is working in. The worst case is the public registration form: a guardian submits successfully, the follow-up refetch of the Turnusy fails on a weak connection, and they see "Přihlášku se nepodařilo načíst" instead of the confirmation with the payment details. A reload and resubmit creates a second Registration. The same pattern throws away a guardian's portal edits, an admin's half-typed payment, and the registration form builder's unsaved draft.

After this plan, the full-page error shows only when there is no data to show.

## Current state

All paths are under `apps/app/src/`.

**1. Public registration form**

```ts
// features/registration/components/use-registration-page.hook.ts:96-99
return {
  isLoading: camp.isPending || form.isPending || turnusy.isPending,
  hasNoForm: form.error instanceof HttpError && form.error.status === 404,
  isError: camp.isError || turnusy.isError || (form.isError && !(form.error instanceof HttpError)),
```

```tsx
// features/registration/components/registration-page.tsx:33-53
if (page.hasNoForm || page.isError || page.camp === undefined || page.form === undefined) {
  return (
    <Alert variant={page.hasNoForm ? 'info' : 'danger'} role={page.hasNoForm ? undefined : 'alert'} className="my-8">
      {page.hasNoForm ? t('noForm') : t('error')}
    </Alert>
  );
}

if (page.submitted !== undefined && page.submittedKey !== null && page.turnus !== undefined) {
  return <SubmittedView ... />;
}
```

What triggers refetches here (`features/registration/api/registration.queries.ts`): the form query has `refetchInterval: 4 * 60 * 1000` and `retry: false` (lines 15-21); the submit mutation invalidates the Turnusy query in `onSettled` (line 45).

**2. Guardian portal edit page**

```tsx
// features/portal/components/edit-page.tsx:20-39
if (edit.error instanceof HttpError && edit.error.status === 401) {
  return <Navigate to="/organisation/portal/prihlaseni" replace />;
}

if (edit.isPending) {
  return null;
}

return (
  <PortalColumn className="gap-3">
    <PortalBackHeader title={t('edit.title')} />
    {edit.isError ? (
      <Alert variant="danger" role="alert">
        {t('error')}
      </Alert>
    ) : (
      <EditForm registrationId={registrationId} edit={edit.data} />
    )}
  </PortalColumn>
);
```

`EditForm` keeps its drafts in `useState`, so unmounting it loses them.

**3. Admin Registration detail**

```tsx
// features/participants/components/registration-detail-page.tsx:49
if (page.isError || page.detail === undefined) {
```

with `isError: detail.isError,` at `features/participants/components/use-registration-detail-page.hook.ts:36`.

**4. Admin registration form builder**

```tsx
// features/camps/components/registration-form-section/registration-form-section.tsx:22-30
if (form.isError) {
  return <Alert variant="danger">{t('error')}</Alert>;
}

// Seeded once per Camp: a refetch, as after another admin's publish, never throws away edits.
return <RegistrationFormBuilder organisationId={organisationId} campId={campId} form={form.data} canWrite={canWrite} />;
```

`form` comes from `useRegistrationFormSection` in the same folder (`use-registration-form-section.hook.ts`).

**5. Admin Camps page**

```ts
// features/camps/components/use-camps-page.hook.ts:22
isError: isError || camps.isError,
```

```tsx
// features/camps/components/camps-page.tsx:35
if (page.isError || page.selected === undefined) {
```

Conventions that apply:

- Read `apps/app/docs/error-handling.md` and `apps/app/docs/api.md` before editing; follow their patterns for error UI.
- No `useMemo`/`useCallback` (React Compiler); every `if` has a braced body; no raw user-facing text in JSX, everything through `t()`.
- The frontend has no tests by design. Verification is typecheck, lint and a manual browser check.
- Hyphen "-", never an em-dash, in comments and texts.

## Commands you will need

| Purpose   | Command                         | Expected on success            |
| --------- | ------------------------------- | ------------------------------ |
| Typecheck | `pnpm --filter app check-types` | exit 0                         |
| Lint      | `pnpm --filter app lint`        | exit 0                         |
| Format    | `pnpm format:check`             | exit 0                         |
| Local app | `pnpm docker:up`                | `http://app.localhost` answers |

## Scope

**In scope**:

- `apps/app/src/features/registration/components/use-registration-page.hook.ts`
- `apps/app/src/features/portal/components/edit-page.tsx`
- `apps/app/src/features/participants/components/registration-detail-page.tsx`
- `apps/app/src/features/participants/components/use-registration-detail-page.hook.ts`
- `apps/app/src/features/camps/components/registration-form-section/registration-form-section.tsx`
- `apps/app/src/features/camps/components/registration-form-section/use-registration-form-section.hook.ts` (only if needed to expose `data`)
- `apps/app/src/features/camps/components/use-camps-page.hook.ts`

**Out of scope**:

- Query options (`retry`, `refetchInterval`, `refetchOnWindowFocus`). The refetches are wanted; only the reaction to their failure is wrong.
- Adding a "data may be stale" banner. Not asked for; the next successful refetch heals the screen.
- The 401 redirect in `edit-page.tsx`: an expired session must still send the guardian to the login.
- `hasNoForm` on the registration page: a form that answers 404 on refetch was unpublished and must still replace the page.
- Any other page not listed above.

## Git workflow

- Branch: `fix/keep-screens-on-failed-refetch`
- Conventional Commits, lowercase imperative subject, at most 72 characters, no body, no AI attribution. One commit is fine.
- Suggested subject: `fix: keep a loaded screen when a background refetch fails`
- Do NOT push or open a PR unless instructed. Never `--no-verify`.

## Steps

The rule for every step: an error counts as a page error only while the query has no data.

### Step 1: Public registration form

In `use-registration-page.hook.ts`, change the `isError` line to:

```ts
isError:
  (camp.isError && camp.data === undefined) ||
  (turnusy.isError && turnusy.data === undefined) ||
  (form.isError && form.data === undefined && !(form.error instanceof HttpError)),
```

Leave `hasNoForm` and `registration-page.tsx` as they are: with data present `isError` is now false, so the submitted branch at line 41 is reached.

**Verify**: `pnpm --filter app check-types` -> exit 0.

### Step 2: Portal edit page

In `edit-page.tsx`, replace the condition `edit.isError ?` with `edit.data === undefined ?`. Keep the 401 redirect and the `isPending` branch above it unchanged.

**Verify**: `pnpm --filter app check-types` -> exit 0 (TypeScript must still accept `edit={edit.data}` in the other branch).

### Step 3: Admin Registration detail

In `registration-detail-page.tsx:49` change `if (page.isError || page.detail === undefined) {` to `if (page.detail === undefined) {`. Then run `grep -rn "\.isError" apps/app/src/features/participants/components/registration-detail-page.tsx`; if nothing else reads `page.isError`, delete the `isError: detail.isError,` line from `use-registration-detail-page.hook.ts`.

**Verify**: `pnpm --filter app check-types` -> exit 0.

### Step 4: Registration form builder

In `registration-form-section.tsx` change `if (form.isError) {` to `if (form.data === undefined) {`. If the hook does not expose `data` in a way TypeScript narrows, open `use-registration-form-section.hook.ts` and adjust only what the narrowing needs.

**Verify**: `pnpm --filter app check-types` -> exit 0.

### Step 5: Camps page

In `use-camps-page.hook.ts:22` change to:

```ts
isError: isError || (camps.isError && camps.data === undefined),
```

**Verify**: `pnpm --filter app check-types` -> exit 0.

### Step 6: Gates

**Verify**: `pnpm --filter app lint` -> exit 0; `pnpm format:check` -> exit 0.

## Test plan

No automated frontend tests exist by design. Manual check in the running app (`pnpm docker:up`), using the browser's devtools to block requests:

1. Open a Camp's public form, fill step 1, then block the `/api/...` request for the form in devtools and wait for the 4 minute refetch (or trigger one by toggling the network offline and refocusing the tab). Expected: the form and the typed answers stay.
2. Submit a Registration with the Turnusy request blocked right after the submit. Expected: the confirmation with payment details shows.
3. In the guardian portal, type into the edit form, go offline, switch tabs and back. Expected: the form and the draft stay.
4. With no network from the start, open each page. Expected: the error alert shows as before.

If you cannot run a browser, say so in your report; a human must do this check before merge.

## Done criteria

- [ ] `pnpm --filter app check-types`, `pnpm --filter app lint`, `pnpm format:check` exit 0
- [ ] `grep -n "edit.isError" apps/app/src/features/portal/components/edit-page.tsx` returns no match
- [ ] `grep -n "page.isError ||" apps/app/src/features/participants/components/registration-detail-page.tsx` returns no match
- [ ] `grep -n "form.isError" apps/app/src/features/camps/components/registration-form-section/registration-form-section.tsx` returns no match
- [ ] `git status` shows only in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- An excerpt in "Current state" does not match the live code.
- A page turns out to rely on `isError` with data present for something intended (for example a documented stale notice in `docs/error-handling.md`).
- Typecheck cannot be satisfied without touching an out-of-scope file.

## Maintenance notes

- New pages should branch on `data === undefined`, not `isError`, for the full-page error. If this recurs, add an Oxlint rule in `apps/app/oxlint/` rather than a doc sentence.
- Plan 007 (leave guard on the public form) touches `use-registration-page.hook.ts` too; land this plan first.
- Deferred: an inline "could not refresh" notice when a refetch fails with data present.
