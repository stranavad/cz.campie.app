# 78 - Payment details and Přihláška after submission

Status: in-progress
Stage: 1b
Episode: E3 Public registration
Blocked by: 36, 40, 49
Stories: 73, 74, 83

## What to build

The redesigned "Odesláno" page shows how to pay right away (QR platba, bank account, amount, Variable symbol, due date) and offers the Přihláška PDF for download, without waiting for the email. The card payment result page shows what was paid and for whom, and on failure offers a retry and the QR code instead. Today the submit response carries only the id, Variable symbol and totals, and the card payment result only its state and branding.

## Decisions

- **Submit response.** Gains `payment` in the shape the portal already uses: the account (null without the Organisation's), the amount due now, its due date and its QR platba payload, plus the balance part while a Deposit is owed. Built by the same code as the portal's, so both always agree.
- **Přihláška right after submitting.** `POST /public-camps/:slug/registrations/prihlaska` with the submission's `idempotencyKey`, which only the submitting browser knows (as for the card payment): short-lived download links per Participant, null for one whose Přihláška is not generated yet. It works for a limited time after submission (a day), is rate limited like the submission, and answers not found for an unknown key, an Erased Registration or another Organisation's key.
- **Card payment result.** Gains the amount of the transaction, the Registration's id and Variable symbol, the Participants' first names (no surnames, no other data), and on `failed` or `pending` the same `payment` instructions as the submit response. The transaction id in the return address stays the only key.

## Acceptance criteria

- [ ] The submit response's QR payload, amount and due date equal what the portal shows for the same Registration, with and without a Deposit, and with no account set.
- [ ] Repeating a submission with the same key returns the same payment details.
- [ ] The Přihláška endpoint returns links once the job has run and nulls before; it refuses after the time limit, past its rate limit, for an unknown key and across Organisations.
- [ ] The card payment result carries amount, Variable symbol and first names; payment instructions appear only when the payment did not go through.
- [ ] A transaction id of Organisation A returns nothing on B's subdomain.

## Notes

- Spec sections: Payments; Registration, placement and declarations.
- Design: canvas "Campie - návrhy designu", artboards `M-Odeslano`, `M-Platba`. Consumed by the public submitted page and the card payment result page.

## Comments

2026-11-09 - **Implemented, awaiting review.** The submit response (public and admin) gains `payment` in the portal's shape (`registrationPaymentSchema`), built by `LedgerService.paymentInstructionsOf`, which the portal now uses too. `POST /public-camps/:slug/registrations/prihlasky` with the submission's `idempotencyKey` returns per Participant (by position) a 5-minute download link or null; it answers 404 for an unknown key, another Camp or Organisation, an Erased Registration or more than a day after the submission, and is rate limited with the submission's numbers under its own counter. The card payment result gains `amount` (of the transaction), `registrationId`, `variableSymbol`, `firstNames` and `payment` (null once paid), all from the stored card payment; an Erased Registration's transaction answers 404, as does starting a card payment for one.

- Tests: payment details equal the portal's with and without a Deposit and without an account, and on a replay; Přihlášky null before the job and downloadable after, links expiring after 5 minutes, refusals per case and across Organisations, the limit; card result fields, payment only while not paid, the transaction's own amount, query params ignored, other Organisation and Erased refused.
- UI: the submitted page shows the transfer details with QR (shared `core/transfer-details`), the Přihláška download per child and the balance due date; the card result page shows amount, children and VS, and the QR on failure (not while pending, to avoid paying twice).
- Open: not checked in a browser (the local stack's port 80 is taken on this machine).
