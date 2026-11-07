# 48 - Comgate adapter with per-Organisation keys

Status: done
Stage: 1b
Episode: E4 Money
Blocked by: 23, 38
Stories: 26, 116

## What to build

Implement the Comgate payment gateway adapter behind the payment gateway port, using each Organisation's own Comgate keys (stored encrypted by issue 23 and never returned by the API). The adapter creates a payment for a given Registration and amount and returns the redirect URL. Each Organisation has its own notification address (`/webhooks/comgate/{organisationId}`), which resolves the Organisation from the URL path and opens a unit of work for it. A notification is never trusted on its own: the API fetches the payment's status from Comgate with that Organisation's keys and, when paid, writes an automatic gateway entry to the Registration's payment ledger. Notifications are idempotent per Comgate transaction, so repeats never create a second ledger entry. Organisations without keys simply have no card option; bank transfer stays available.

## Acceptance criteria

- [x] Creating a payment uses the keys of the Registration's Organisation, verified with the fake gateway recording which keys were used.
- [x] A notification to Organisation A's address for a transaction verified as paid adds exactly one gateway ledger entry; replaying it adds none.
- [x] A notification whose status fetch returns unpaid, cancelled or an unknown transaction adds no ledger entry.
- [x] A notification sent to Organisation B's address for Organisation A's transaction adds nothing to either Organisation (status fetch with B's keys fails, and RLS hides A's Registration).
- [x] No API response, log line or audit entry contains a Comgate secret.
- [x] The gateway ledger entry is audited with actor `system` and records the Comgate transaction identifier.
- [x] The payment received email (issue 38) is triggered by a verified gateway entry.

## Notes

- Spec sections: Payments; Ports and adapters; Tenancy (Organisation from the URL path for gateway notifications).
- Port from Domino: `apps/api/src/payment/services/payment.service.ts` (create payment), `apps/api/src/payment-internal/payment-internal.controller.ts` and `apps/api/src/payment-internal/services/payment-internal.service.ts` (notify + status verification).
- Domino uses one global merchant; here keys come from the Organisation via the encryption core (issue 09). The fake provider in tests must support paid, cancelled and unknown outcomes.

## Comments

2026-11-07 - **Done.** Owners set the Comgate keys at `PUT /organisation-settings/payment-gateway` (merchant id and secret; `GET` shows the merchant id only, `DELETE` removes them), stored in `payment_gateway_accounts` with the secret encrypted; changes are audited as `payment_gateway.update`/`.remove` with the secret's name only. Settings page: "Platby kartou (Comgate)". `ComgatePaymentGateway` talks to Comgate's REST API v2.0 with each Organisation's Basic credentials: creating a payment (`CardPaymentService.create`, used by issue 49) and reading a transaction (`getPayment`: null for one the account does not know, a throw when Comgate fails or answers in an unexpected shape, so the notification is repeated). `COMGATE_TEST_PAYMENTS=true` makes a deployment send and accept only test payments (logged as a warning at boot); otherwise a test payment is never recorded. `POST /webhooks/comgate/:organisationId` (gateway access, limited per address and Organisation by `GATEWAY_NOTIFICATION_LIMIT_PER_IP`/`_PER_ORGANISATION`) reads only `transId`, fetches the transaction with that Organisation's keys and, when paid, `LedgerService.recordGatewayPayment` adds a `gateway` entry under the Registration's lock: `payments.gateway_transaction_id` is unique per Organisation, so a repeat adds nothing; the entry is audited as `system` with the transaction id, and both guardians get the payment received email. The reference sent to Comgate is the Registration id, so another Organisation's Registration stays invisible (RLS) even with matching keys.
