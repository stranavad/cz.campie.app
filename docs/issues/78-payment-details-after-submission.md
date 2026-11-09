# 78 - Payment details and Přihláška after submission

Status: ready-for-agent
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
