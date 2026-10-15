# 38 - Payment ledger, amount due now, Overdue

Status: ready-for-agent
Stage: 1a
Episode: E4 Money
Blocked by: 35
Stories: 81, 88, 113, 114, 115

## What to build

Payments are a ledger on the Registration. An admin with Registrations write records a payment (amount, date, note), a Correcting payment for a refund or mistake, and a Price adjustment (plus or minus amount with a note). Entries are never deleted or edited. From the price lines, adjustments and ledger the API derives the total, paid, balance, payment status (unpaid, deposit paid, paid, overpaid), the amount due now with its date (via the pricing module's function) and an Overdue flag. Recording a payment sends the payment-received email to both guardians (if switched on).

## Acceptance criteria

- [ ] Ledger entries are append-only: no update or delete endpoint, and the database role cannot delete them.
- [ ] Derived status for each case including overpaid; Deposit phase vs balance phase; full-payment choice.
- [ ] Overdue flips exactly after the due date using the controllable Clock.
- [ ] Price adjustment changes the total and balance; total never below zero.
- [ ] Payment received email sent to both guardians through the mail fake, skipped when switched off.
- [ ] Registrations read can see the ledger; none cannot; write needed to add entries.
- [ ] Each entry writes an audit entry; tenant isolation.

## Notes

- Spec sections: Payments; Registration (cancel changes no money).
- Port from Domino: `apps/api/src/payment/`, `apps/api/emails/payment-confirmation.tsx`.
- Gateway entries come in issue 48; keep an entry source field (manual, gateway, correction).
