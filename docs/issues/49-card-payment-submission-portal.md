# 49 - Card payment on submission and from the portal

Status: ready-for-agent
Stage: 1b
Episode: E4 Money
Blocked by: 40, 48
Stories: 68, 74, 82

## What to build

When the Organisation has Comgate configured, guardians can choose card or bank transfer on the registration form. Choosing card redirects to Comgate straight after a successful submission for the amount due now (deposits when a Deposit was chosen, otherwise the total). After payment the guardian lands on a branded thank-you page on the Organisation's subdomain with a link back to the Camp's (or Turnus's) website link. In the portal, a guardian can pay the amount due now or the full outstanding balance by card. The submission itself never waits for or depends on the gateway: if Comgate fails, the Registration exists and bank transfer instructions still apply.

## Acceptance criteria

- [ ] The payment method choice is offered on the form only when the Organisation has Comgate keys.
- [ ] A card submission returns a Comgate redirect for the amount due now; the Registration is created even when the fake gateway errors.
- [ ] The thank-you page shows payment state (paid, pending, failed) from the ledger and the website link, using Camp branding.
- [ ] From the portal a guardian can start a card payment for the amount due now or the full outstanding balance, and only for Registrations they have access to.
- [ ] A guardian of Organisation A cannot start a payment for a Registration of Organisation B, even with a guessed identifier.
- [ ] Overpaid or fully paid Registrations offer no card payment.

## Notes

- Spec sections: Payments (amount due now, card payment); Public addresses.
- Amount due now rules are owned by issue 38; reuse them, do not recompute.
- UI strings in the i18n layer.

## Comments

2026-11-07 - **From issue 48.** `CardPaymentService.create(registrationId, amountCzk)` (`modules/registrations/card-payment/services/card-payment.service.ts`) creates a Comgate payment with the current Organisation's keys and returns `{ transactionId, redirectUrl }`, or null when the Organisation has no keys; the reference is the Registration id, the label `VS <variable symbol>` (Comgate allows 16 characters), the email the first guardian's. It sends no return URLs yet: add `url_paid`/`url_cancelled`/`url_pending` (the thank-you page on the Organisation's subdomain) to `CreatePaymentInput` and the Comgate adapter here. `PaymentGatewayService.get()` (`modules/organisations/payment-gateway/`) tells whether the Organisation has keys, for offering the card choice. `FakePaymentGateway` has no failing mode yet; add one for "the Registration is created even when the fake gateway errors".
