# Plan 001: The admin participant list applies the invoice filter

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report - do not improvise. When done, update the status row for this plan
> in `plans/README.md` - unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a44a934..HEAD -- apps/app/src/core/participant-list/api/participant-list.service.ts apps/api/src/modules/registrations/participant-list`
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

On the admin page "Přihlášky" an admin can filter the Participants of a Turnus by Invoice request ("K fakturaci", "Vyfakturováno", ...). The choice lands in the URL (`?faktura=...`) and in the query key, so a refetch runs, but the frontend service never puts the filter into the request. The API therefore returns every Participant and the admin works through invoices from a list that silently ignores the filter. The API side already implements the filter; only the frontend drops it.

## Current state

- `apps/app/src/core/participant-list/api/participant-list.service.ts` - the only place that builds the list request. It copies the filters one by one and omits `invoice`:

  ```ts
  // apps/app/src/core/participant-list/api/participant-list.service.ts:10-24
  list: (organisationId: string, turnusId: string, filters: ParticipantListQuery, signal?: AbortSignal) =>
    apiClient.request(listParticipantsEndpoint, {
      organisationId,
      params: { turnusId },
      query: {
        ...(filters.search === undefined ? {} : { search: filters.search }),
        ...(filters.paymentStatus === undefined ? {} : { paymentStatus: filters.paymentStatus }),
        ...(filters.unverifiedClaimedDiscount === true ? { unverifiedClaimedDiscount: 'true' as const } : {}),
        ...(filters.overdue === true ? { overdue: 'true' as const } : {}),
        ...(filters.unsignedConsent === true ? { unsignedConsent: 'true' as const } : {}),
        ...(filters.missingDocument === true ? { missingDocument: 'true' as const } : {}),
        ...(filters.missingAnswers === true ? { missingAnswers: 'true' as const } : {}),
      },
      signal,
    }),
  ```

- `apps/app/src/features/participants/components/use-participants-page.hook.ts:51` - the caller does pass it: `...(invoice === 'all' ? {} : { invoice }),`.
- `packages/schema/src/registrations/participant-list/participant-list.contracts.ts:65` - the contract accepts it: `invoice: z.enum(INVOICE_FILTERS).optional(),` where `INVOICE_FILTERS = ['none', ...INVOICE_STATES, 'company_open']`.
- `apps/api/src/modules/registrations/participant-list/services/participant-list.service.ts:81-91,302` - the API applies it (`invoiceMatches(row.invoice, query.invoice)`).
- `apps/api/src/modules/registrations/participant-list/participant-list.integration.test.ts` - the list's HTTP tests. It has a test `filters by payment status and by an unverified Claimed discount` (line 106) but none for the invoice filter, which is how the gap went unnoticed end to end.

Conventions that apply:

- The frontend has no tests by design (`apps/app/AGENTS.md`: "no component tests, no browser tests"). Do not add any there.
- API tests are HTTP integration tests against a real PostgreSQL (`apps/api/docs/testing.md`); read that file before writing one. They need Docker running (Testcontainers).
- Use the glossary terms: Participant, Turnus, Registration, Invoice request.
- Text in code comments and documents uses a hyphen "-", never an em-dash.

## Commands you will need

| Purpose            | Command                                      | Expected on success |
| ------------------ | -------------------------------------------- | ------------------- |
| Typecheck frontend | `pnpm --filter app check-types`              | exit 0              |
| Lint frontend      | `pnpm --filter app lint`                     | exit 0              |
| API list tests     | `pnpm --filter api test -- participant-list` | all pass            |
| Format check       | `pnpm format:check`                          | exit 0              |

## Scope

**In scope** (the only files you should modify):

- `apps/app/src/core/participant-list/api/participant-list.service.ts`
- `apps/api/src/modules/registrations/participant-list/participant-list.integration.test.ts` (add one test)

**Out of scope** (do NOT touch):

- `use-participants-page.hook.ts` - it already passes the filter.
- The contract and the API service - both are correct.
- Any refactor of how the query object is built beyond adding the missing key.

## Git workflow

- Branch: `fix/participant-list-invoice-filter`
- Conventional Commits, lowercase imperative subject, at most 72 characters, no body, no AI attribution. Example from this repo: `fix: polish the calendar, payment details and admin header actions`.
- Suggested subject: `fix: apply the invoice filter in the participant list`
- Do NOT push or open a PR unless the operator instructed it. Never use `--no-verify`.

## Steps

### Step 1: Send the filter

In `participant-list.service.ts`, add one line to the `query` object, after the `paymentStatus` line:

```ts
...(filters.invoice === undefined ? {} : { invoice: filters.invoice }),
```

**Verify**: `pnpm --filter app check-types` -> exit 0. `grep -n "filters.invoice" apps/app/src/core/participant-list/api/participant-list.service.ts` -> one match.

### Step 2: Cover the filter in the API's list test

In `participant-list.integration.test.ts`, add a test next to `filters by payment status and by an unverified Claimed discount` (line 106) and model it on that test: same fixtures and request helper, but create one Registration with an Invoice request and one without, then assert that `?invoice=none` returns only the Participant without one and `?invoice=to_invoice` only the one with an Invoice request not yet invoiced. Look at how an Invoice request is created in `apps/api/src/modules/registrations/invoice-request/` tests and reuse that fixture or helper.

If the test file already asserts the invoice filter under another name (search the file and its sibling `participant-signals.integration.test.ts` for `invoice`), skip this step and say so in your report.

**Verify**: `pnpm --filter api test -- participant-list` -> all pass, including the new test. Prove the test once: temporarily remove the `query.invoice` condition at `participant-list.service.ts:302` in the API, run the test, see it fail, restore the line.

### Step 3: Gates

**Verify**: `pnpm --filter app lint` -> exit 0; `pnpm format:check` -> exit 0.

## Test plan

- One new API integration test for `invoice=none` and `invoice=to_invoice` (step 2).
- Manual check (needs the local stack, `pnpm docker:up`, `http://app.localhost`): on "Přihlášky" pick an invoice filter and confirm in the browser's network tab that the request to `/api/.../participants` carries `invoice=...` and the list shrinks.

## Done criteria

- [ ] `grep -n "filters.invoice" apps/app/src/core/participant-list/api/participant-list.service.ts` returns one match
- [ ] `pnpm --filter app check-types` and `pnpm --filter app lint` exit 0
- [ ] `pnpm --filter api test -- participant-list` exits 0 with the new test
- [ ] `git status` shows only the two in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `query` object in `participant-list.service.ts` no longer matches the excerpt.
- Typecheck rejects `invoice` in the query (the contract changed).
- Creating an Invoice request in a test needs a fixture you cannot find after reading the invoice-request tests; report rather than inventing database inserts.

## Maintenance notes

- Every new key in `participantListQuerySchema` must also be added to this service by hand; that is how this bug happened. If a third filter gets dropped the same way, replace the hand-written spread with a mapping typed over `keyof ParticipantListQuery`.
- Reviewer: check the new test fails without the API's filter condition.
