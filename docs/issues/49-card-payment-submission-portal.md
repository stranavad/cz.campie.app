# 49 - Card payment on submission and from the portal

Status: done
Stage: 1b
Episode: E4 Money
Blocked by: 40, 48
Stories: 68, 74, 82

## What to build

When the Organisation has Comgate configured, guardians can choose card or bank transfer on the registration form. Choosing card redirects to Comgate straight after a successful submission for the amount due now (deposits when a Deposit was chosen, otherwise the total). After payment the guardian lands on a branded thank-you page on the Organisation's subdomain with a link back to the Camp's (or Turnus's) website link. In the portal, a guardian can pay the amount due now or the full outstanding balance by card. The submission itself never waits for or depends on the gateway: if Comgate fails, the Registration exists and bank transfer instructions still apply.

## Acceptance criteria

- [x] The payment method choice is offered on the form only when the Organisation has Comgate keys.
- [x] A card submission returns a Comgate redirect for the amount due now; the Registration is created even when the fake gateway errors.
- [x] The thank-you page shows payment state (paid, pending, failed) from the ledger and the website link, using Camp branding.
- [x] From the portal a guardian can start a card payment for the amount due now or the full outstanding balance, and only for Registrations they have access to.
- [x] A guardian of Organisation A cannot start a payment for a Registration of Organisation B, even with a guessed identifier.
- [x] Overpaid or fully paid Registrations offer no card payment.

## Notes

- Spec sections: Payments (amount due now, card payment); Public addresses.
- Amount due now rules are owned by issue 38; reuse them, do not recompute.
- UI strings in the i18n layer.

## Comments

2026-11-07 - **From issue 48.** `CardPaymentService.create(registrationId, amountCzk)` (`modules/registrations/card-payment/services/card-payment.service.ts`) creates a Comgate payment with the current Organisation's keys and returns `{ transactionId, redirectUrl }`, or null when the Organisation has no keys; the reference is the Registration id, the label `VS <variable symbol>` (Comgate allows 16 characters), the email the first guardian's. It sends no return URLs yet: add `url_paid`/`url_cancelled`/`url_pending` (the thank-you page on the Organisation's subdomain) to `CreatePaymentInput` and the Comgate adapter here. `PaymentGatewayService.get()` (`modules/organisations/payment-gateway/`) tells whether the Organisation has keys, for offering the card choice. `FakePaymentGateway` has no failing mode yet; add one for "the Registration is created even when the fake gateway errors".

2026-11-07 - **Done.** The public Camp says whether the Organisation takes cards (`cardPayments`), and the form then offers bank transfer or card. A card submission is sent as usual; once it succeeds, the frontend calls `POST /card-payments` with the submission's own idempotency key (known only to whoever submitted, accepted for 24 hours), which creates a Comgate payment for the amount due now (`LedgerService.balanceOf`) and answers the redirect. The submission never depends on it: a Comgate failure answers 503 `card_payment_unavailable` and the page tells the guardian to pay by transfer or later in the portal. The portal shows "Zaplatit kartou" for the amount due now and, while Deposits are owed, for everything outstanding (`POST /portal/registrations/:id/card-payment`, for guardians and access emails); nothing due answers 409 `card_payment_nothing_due`. Started payments are kept in `card_payments`. Comgate sends the guardian back to `/platba?id=<transaction>` on the subdomain (`platba` is now a reserved Camp slug), which reads `GET /card-payments/:transactionId`: paid, pending (asked again for a minute) or failed, in the Camp's branding with the Turnus's website, else the Camp's; a transaction Comgate reports paid is recorded there too, once, in case its notification is late or lost. Starting and the result page are limited per address and Organisation (`CARD_PAYMENT_LIMIT_PER_IP`/`_PER_ORGANISATION`, counted apart). Not checked against Comgate itself: that it fills `${id}` in the return URLs.
