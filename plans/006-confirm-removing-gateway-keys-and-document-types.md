# Plan 006: Removing Comgate keys or a Document type asks once more first

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report - do not improvise. When done, update the status row for this plan
> in `plans/README.md` - unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a44a934..HEAD -- apps/app/src/features/organisation-settings/components/payment-gateway-form apps/app/src/features/camps/components/document-types-section apps/app/src/locales/cs`
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

In Organisation settings one click on "Vypnout platby kartou" deletes the Organisation's Comgate keys at once. Card payment then disappears for every guardian until an Owner types the keys in again, and the secret cannot be shown back. In a Camp's Document types, one click on "remove" deletes the type with its description and attached file. Everywhere else the app asks first: cancelling a Participant is two-step, erasure needs a typed word, removing a Turnus asks again. These two are the exceptions, and both sit next to harmless buttons.

## Current state

All paths are under `apps/app/src/`.

**Payment gateway keys**

```tsx
// features/organisation-settings/components/payment-gateway-form/payment-gateway-form.tsx:32-43
{
  isConfigured ? (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="text-danger-foreground"
      disabled={gateway.isRemoving}
      onClick={gateway.removeKeys}
    >
      {t('paymentGateway.remove')}
    </Button>
  ) : null;
}
```

```ts
// features/organisation-settings/components/payment-gateway-form/use-payment-gateway-form.hook.ts:40-47
isRemoving: remove.isPending,
removeKeys: () => {
  setStatus(null);
  remove.mutate(undefined, {
    onSuccess: () => setStatus('removed'),
    onError: () => setStatus('failed'),
  });
},
```

Texts: `locales/cs/organisation-settings.json`, object `paymentGateway` (line 46), used as `t('paymentGateway.<key>')` in namespace `organisationSettings`.

**Document type**

```tsx
// features/camps/components/document-types-section/document-type-form.tsx:86-90
{
  type === null ? null : (
    <Button type="button" variant="outline" onClick={() => form.remove(onDone)}>
      {t('documentTypes.remove')}
    </Button>
  );
}
```

`form.remove` is in `use-document-type-form.hook.ts:47-51` and calls `mutations.remove.mutate(type.id, { onSuccess: onDone })`. Texts: `locales/cs/camps.json`, object `documentTypes`. The API refuses removal with 409 `document_type_in_use` once documents were handed in, so only unused types can go.

**Exemplars to copy**

A dialog confirmation, used for turning off required two-step login in the same settings feature:

```tsx
// features/organisation-settings/components/two-step-section/two-step-off-dialog.tsx:17-30
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogTitle>{t('twoStep.offTitle')}</DialogTitle>
    <DialogDescription>{t('twoStep.offDescription')}</DialogDescription>
    <div className="flex flex-wrap justify-end gap-2">
      <DialogClose render={<Button type="button" variant="outline" />}>{t('twoStep.offCancel')}</DialogClose>
      <Button type="button" variant="destructive" disabled={isSaving} onClick={onConfirm}>
        {t('twoStep.offConfirm')}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

Its open state lives in `two-step-section/use-two-step-section.hook.ts`; read it to see how the dialog is opened, confirmed and closed.

An inline two-step button, used for removing a Turnus (`features/camps/components/turnus-section/turnus-removal.tsx`, whole file is 35 lines): props `isConfirming`, `isRemoving`, `onAsk`, `onConfirm`, `onCancel`; first a ghost button, after a click a destructive "confirm" button and a ghost "keep" button. Its state is in `turnus-section/use-turnus-section.hook.ts`.

Conventions that apply:

- Every UI string through `t()`; texts are Czech, informal-polite, in `locales/cs/<namespace>.json`. Hyphen "-", never an em-dash.
- Components stay presentational; state lives in the `use-*.hook.ts` next to them (`apps/app/docs/architecture.md`).
- No `useMemo`/`useCallback`; braces on every `if`.
- No frontend tests by design.

## Commands you will need

| Purpose   | Command                         | Expected on success             |
| --------- | ------------------------------- | ------------------------------- |
| Typecheck | `pnpm --filter app check-types` | exit 0                          |
| Lint      | `pnpm --filter app lint`        | exit 0                          |
| Format    | `pnpm format`                   | rewrites only files you touched |

## Scope

**In scope**:

- `apps/app/src/features/organisation-settings/components/payment-gateway-form/payment-gateway-form.tsx`
- `apps/app/src/features/organisation-settings/components/payment-gateway-form/use-payment-gateway-form.hook.ts`
- `apps/app/src/features/organisation-settings/components/payment-gateway-form/payment-gateway-removal-dialog.tsx` (create)
- `apps/app/src/features/camps/components/document-types-section/document-type-form.tsx`
- `apps/app/src/features/camps/components/document-types-section/use-document-type-form.hook.ts`
- `apps/app/src/locales/cs/organisation-settings.json`
- `apps/app/src/locales/cs/camps.json`

**Out of scope**:

- Discount codes: only a code nobody used can be removed, and recreating it takes seconds. Deliberately left one-click.
- The API. Nothing changes server-side.
- A shared generic confirm component. Two call sites with different shapes do not earn one.

## Git workflow

- Branch: `fix/confirm-destructive-removals`
- Conventional Commits, lowercase imperative subject, at most 72 characters, no body, no AI attribution.
- Suggested subject: `fix: ask before removing card payment keys or a Document type`
- Do NOT push or open a PR unless instructed. Never `--no-verify`.

## Steps

### Step 1: Dialog before removing the Comgate keys

Create `payment-gateway-removal-dialog.tsx` modelled line for line on `two-step-off-dialog.tsx` (props `open`, `onOpenChange`, `isRemoving`, `onConfirm`; one-line comment above the component saying what it confirms).

Add to `locales/cs/organisation-settings.json` under `paymentGateway`:

```json
"removeTitle": "Vypnout platby kartou?",
"removeDescription": "Klíče účtu Comgate smažeme a rodiče budou moci platit jen převodem. Pro opětovné zapnutí je zadáte znovu.",
"removeConfirm": "Vypnout platby kartou",
"removeCancel": "Ponechat zapnuté"
```

In `use-payment-gateway-form.hook.ts` add `const [isAskingRemoval, setAskingRemoval] = useState(false);`, return `isAskingRemoval` and `setAskingRemoval`, and close the dialog when the removal settles (set it to `false` in both `onSuccess` and `onError` of `removeKeys`, before `setStatus`).

In `payment-gateway-form.tsx` change the button's `onClick` to `() => gateway.setAskingRemoval(true)` and render the dialog with `open={gateway.isAskingRemoval}`, `onOpenChange={gateway.setAskingRemoval}`, `isRemoving={gateway.isRemoving}`, `onConfirm={gateway.removeKeys}`.

**Verify**: `pnpm --filter app check-types` -> exit 0.

### Step 2: Two-step button before removing a Document type

Follow the `turnus-removal.tsx` shape inline in `document-type-form.tsx` (do not import `TurnusRemoval`; its texts are the Turnus's).

In `use-document-type-form.hook.ts` add `const [isConfirmingRemoval, setConfirmingRemoval] = useState(false);` and return `isConfirmingRemoval`, `setConfirmingRemoval`, and `isRemoving: mutations.remove.isPending`.

In `document-type-form.tsx` replace the remove button with: when not confirming, the existing outline button with `onClick={() => form.setConfirmingRemoval(true)}`; when confirming, a `variant="destructive"` button (`disabled={form.isRemoving}`, `onClick={() => form.remove(onDone)}`, text `t('documentTypes.confirmRemove')`) and a `variant="ghost"` button (`onClick={() => form.setConfirmingRemoval(false)}`, text `t('documentTypes.keep')`).

Add to `locales/cs/camps.json` under `documentTypes`:

```json
"confirmRemove": "Opravdu odebrat",
"keep": "Ponechat"
```

Before adding, look at `turnus.confirmRemove` and `turnus.keep` in the same file and match their wording style; if they read differently, mirror them.

**Verify**: `pnpm --filter app check-types` -> exit 0.

### Step 3: Gates

Run `pnpm format`, then:

**Verify**: `pnpm --filter app lint` -> exit 0; `pnpm format:check` -> exit 0; `git status` lists only in-scope files.

## Test plan

Manual, in the running app (`pnpm docker:up`, `http://app.localhost`, as an Owner):

1. Organisation settings, with Comgate keys saved: click "Vypnout platby kartou". Expected: a dialog; "Ponechat zapnuté" closes it and the keys stay; confirm removes them and shows "Platby kartou jsou vypnuté."
2. A Camp's Document types, open an unused type: click remove. Expected: the button becomes "Opravdu odebrat" and "Ponechat"; the second restores the first state; the first removes the type.
3. Both with keyboard only: focus moves into the dialog and Escape closes it.

If you cannot run a browser, say so in your report; a human must do this check before merge.

## Done criteria

- [ ] `pnpm --filter app check-types`, `pnpm --filter app lint`, `pnpm format:check` exit 0
- [ ] `grep -n "onClick={gateway.removeKeys}" apps/app/src/features/organisation-settings/components/payment-gateway-form/payment-gateway-form.tsx` returns no match
- [ ] `grep -n "removeTitle" apps/app/src/locales/cs/organisation-settings.json` and `grep -n "confirmRemove" apps/app/src/locales/cs/camps.json` each match
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

- The excerpts do not match the live code.
- The `Dialog` components in `@/components/ui/dialog` have a different API than the exemplar shows.
- Lint forbids state in the form hook in the way described and the fix needs a new file outside the scope.

## Maintenance notes

- Reviewer: read the Czech texts; they were written by the planner, not a native-speaking reviewer.
- If a third removal needs the same dialog, that is the moment to extract a shared confirm component into `apps/app/src/components/`.
