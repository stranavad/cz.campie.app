# 48 - Comgate adapter with per-Organisation keys

Status: ready-for-agent
Stage: 1b
Episode: E4 Money
Blocked by: 23, 38
Stories: 26, 116

## What to build

Implement the Comgate payment gateway adapter behind the payment gateway port, using each Organisation's own Comgate keys (stored encrypted by issue 23 and never returned by the API). The adapter creates a payment for a given Registration and amount and returns the redirect URL. Each Organisation has its own notification address (`/webhooks/comgate/{organisationId}`), which resolves the Organisation from the URL path and opens a unit of work for it. A notification is never trusted on its own: the API fetches the payment's status from Comgate with that Organisation's keys and, when paid, writes an automatic gateway entry to the Registration's payment ledger. Notifications are idempotent per Comgate transaction, so repeats never create a second ledger entry. Organisations without keys simply have no card option; bank transfer stays available.

## Acceptance criteria

- [ ] Creating a payment uses the keys of the Registration's Organisation, verified with the fake gateway recording which keys were used.
- [ ] A notification to Organisation A's address for a transaction verified as paid adds exactly one gateway ledger entry; replaying it adds none.
- [ ] A notification whose status fetch returns unpaid, cancelled or an unknown transaction adds no ledger entry.
- [ ] A notification sent to Organisation B's address for Organisation A's transaction adds nothing to either Organisation (status fetch with B's keys fails, and RLS hides A's Registration).
- [ ] No API response, log line or audit entry contains a Comgate secret.
- [ ] The gateway ledger entry is audited with actor `system` and records the Comgate transaction identifier.
- [ ] The payment received email (issue 38) is triggered by a verified gateway entry.

## Notes

- Spec sections: Payments; Ports and adapters; Tenancy (Organisation from the URL path for gateway notifications).
- Port from Domino: `apps/api/src/payment/services/payment.service.ts` (create payment), `apps/api/src/payment-internal/payment-internal.controller.ts` and `apps/api/src/payment-internal/services/payment-internal.service.ts` (notify + status verification).
- Domino uses one global merchant; here keys come from the Organisation via the encryption core (issue 09). The fake provider in tests must support paid, cancelled and unknown outcomes.
