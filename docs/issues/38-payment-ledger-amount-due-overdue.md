# 38 - Payment ledger, amount due now, Overdue

Status: done
Stage: 1a
Episode: E4 Money
Blocked by: 35
Stories: 81, 88, 113, 114, 115

## What to build

Payments are a ledger on the Registration. An admin with Registrations write records a payment (amount, date, note), a Correcting payment for a refund or mistake, and a Price adjustment (plus or minus amount with a note). Entries are never deleted or edited. From the price lines, adjustments and ledger the API derives the total, paid, balance, payment status (unpaid, deposit paid, paid, overpaid), the amount due now with its date (via the pricing module's function) and an Overdue flag. Recording a payment sends the payment-received email to both guardians (if switched on).

## Acceptance criteria

- [x] Ledger entries are append-only: no update or delete endpoint, and the database role cannot delete them.
- [x] Derived status for each case including overpaid; Deposit phase vs balance phase; full-payment choice.
- [x] Overdue flips exactly after the due date using the controllable Clock.
- [x] Price adjustment changes the total and balance; total never below zero.
- [x] Payment received email sent to both guardians through the mail fake, skipped when switched off.
- [x] Registrations read can see the ledger; none cannot; write needed to add entries.
- [x] Each entry writes an audit entry; tenant isolation.

## Notes

- Spec sections: Payments; Registration (cancel changes no money).
- Port from Domino: `apps/api/src/payment/`, `apps/api/emails/payment-confirmation.tsx`.
- Gateway entries come in issue 48; keep an entry source field (manual, gateway, correction).

## Comments

2026-11-07 - **From issue 26.** `amountDueNow` takes the total (price lines plus Price adjustments), the Deposit owed, the ledger sum and the dates. Price adjustments are not price lines; consider a pure `registrationTotal(lines, adjustments)` in `@repo/schema/pricing` so both apps agree on the total. The due dates read the Turnus's deposit days and balance due date as they are now, so editing a Turnus moves the due dates of its existing Registrations; decide whether that is wanted.

2026-11-07 - **From issue 37.** Payment instructions (amount due now, rest, QR platba) come from `registrationPaymentOf` in `apps/api/src/modules/registrations/payment/payment-instructions.helper.ts`, used by the Přihláška and the confirmation with `paid: 0`. Pass the ledger's sum (and the total with Price adjustments) there for the payment-received email and the portal; the Přihláška stays a snapshot with nothing paid. The payment block email component is `modules/registrations/confirmation/payment-block.email.tsx`.

2026-11-07 - **Done.** Append-only `payments` (source manual, gateway or correction; a correction is stored negative) and `price_adjustments`, with UPDATE, DELETE and TRUNCATE revoked from the API role. The pure `balanceOf` (`@repo/schema/pricing`) derives total (lines plus Price adjustments), paid, balance, payment status (a payment below the Deposits stays unpaid), the amount due now and Overdue (the Prague date past the due date while something is due). `LedgerService` and `LedgerController`: `GET /registrations/:id/ledger` (Registrations read), `POST .../payments` and `POST .../price-adjustments` (write), both under a lock on the Registration: a correction takes back at most what was paid (409 `correction_exceeds_paid`, and it needs a note) and an adjustment never takes the total below zero (409 `price_adjustment_below_zero`). Every entry is audited (`payment.create`, `price_adjustment.create`, target the Registration). A payment received emails both guardians (`payment_received`, `{{castka}}` the amount received) with what is left to pay and its QR platba; a correction emails nobody. The confirmation now reads the ledger too. Due dates follow the Turnus as it is now: editing a Turnus's deposit days or balance due date moves them for its existing Registrations. The admin UI comes with the Registration detail (issue 43).

2026-11-08 - **Decision by the project lead: due dates stay fixed per Registration, and partly paid is its own status.** Editing a Turnus no longer moves the due dates of its existing Registrations. `registrations.deposit_due_date` (not null) and `registrations.balance_due_date` are stored when a Registration is submitted or created by an admin, from the pure `dueDatesOf` (`@repo/schema/pricing`: the Prague date of submission plus the Turnus's deposit days, never after its balance due date unless submitted after it). `amountDueNow`, `balanceOf` and `paymentInstructionsOf` take these dates instead of the Turnus's terms, so Overdue, reminders, the portal, the lists, the export and the emails all read the stored dates. An admin move takes the target Turnus's dates for the original submission instant (`dueDatesOf` again), audited with old and new dates (issue 44). Existing rows were backfilled in the migration from the Turnus's current terms, the same ones they were read from until now (`drizzle/20261108132222_registration-due-dates`, `20261108132226_backfill-registration-due-dates`, `20261108132242_registration-due-dates-required`). A new payment status `partly_paid` (`PAYMENT_STATUSES`) covers anything paid that covers neither the Deposits nor, paying in full, the total; unpaid now means nothing paid. Overdue stays orthogonal: a partly paid Registration whose amount due now is unpaid past its date is Overdue too, and the reminder (all with a balance, or only Overdue) reaches it with what is still due now. The participant list filter, the portal and the participant export name the status; the Turnus overview counts Registrations per status (`registrationsByPaymentStatus`, issue 61).
