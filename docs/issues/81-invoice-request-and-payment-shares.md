# 81 - Invoice request and payment shares

Status: in-progress
Stage: 1a
Episode: E4 Money
Blocked by: 49, 50, 78
Stories: 195, 196, 197, 198, 202

## What to build

A guardian whose employer or another company pays part or all of the price asks for an Invoice request on the registration form: the company's billing details and the amount to invoice. The camp later issues the invoice in its own accounting program. From then on the Registration has two shares: what the guardian owes, which drives the amount due now, Overdue, reminders and the QR platba, and what the company owes, which only shows what is left. Each ledger entry records who paid. The guardian can add, change or remove the Invoice request in the portal until the camp has invoiced it.

## Decisions

- **Camp switch.** "Platba fakturou" per Camp, off by default; it only controls the offer on the form and in the portal. Existing Invoice requests stay when it is switched off.
- **Fixed section, not form fields.** Shown next to the payment choice when the switch is on: company name, IČO (8 digits, mod 11 checksum, shared validator in `packages/schema`), DIČ, street, city, postcode, billing email, note or order number. Required: name, IČO, street, city, postcode. Amount in whole CZK, prefilled with the live total; a guardian enters `0 < amount <= total` at submission (and against the current total in the portal).
- **Storage.** One row per Registration in its own table (Organisation-scoped, RLS), with the state fields of issue 82 (`invoicedOn`, `invoiceNumber`) already present so the portal can tell whether it may still edit. The note is the only field blanked on erasure.
- **Payer on the ledger.** `payments.payer`: `guardian | company`, default `guardian`. A check constraint keeps gateway entries `guardian`; the API allows `company` only on manual and correcting entries of a Registration with an Invoice request. The admin payment form gets the choice when an Invoice request exists; the ledger listing shows the payer.
- **Shares, in the pure module.** `balanceOf` gains the amount to invoice (or null) and splits payments by payer. Guardian's share = `max(total - invoiced, 0)`; the amount due now, its Deposit phase (Deposit capped at the share, not offered at zero) and Overdue come from `amountDueNow` over the guardian's share and the guardian's payments, unchanged otherwise. The company part is `invoiced - company payments`, with no due date. The payment status stays over the whole total and all payments.
- **Everything that shows a payment uses the same shares**: submit response, confirmation email, Přihláška, portal, payment reminders (target and amounts; a Registration whose guardian share is settled is not reminded), card payment from the portal (guardian's outstanding share only). They add a line "Fakturováno firmě {name}: {amount} Kč"; with a zero guardian share no QR code.
- **Portal.** Add, change and remove while `invoicedOn` is null; afterwards read-only with the state. Each change is an audit entry by the guardian; encrypted fields none (billing data is a company's, not personal).
- **Never automatic.** Price adjustments, Participant cancellation and moving Turnus never change the amount; the guardian's share just clamps at zero.

## Acceptance criteria

- [ ] With the switch off the submit endpoint rejects an Invoice request; with it on, an invalid IČO, a missing required field, an amount of 0 or above the total are rejected with field errors.
- [ ] Pure tests: total 10 000, invoiced 6 000, Deposit 3 000 → due now 3 000 by the deposit date, then 1 000 by the balance due date; a company payment of 6 000 changes neither; invoiced 10 000 → guardian share 0, no Deposit, nothing due, status unpaid until the company pays.
- [ ] Payment status is paid only when guardian and company payments together reach the total.
- [ ] Submit response, portal and the confirmation email show the guardian's share and its QR payload, and the invoiced line.
- [ ] Payment reminders skip a Registration whose guardian share is paid while the company's is open; the reminder amount is the guardian's.
- [ ] A company payment is refused on a Registration without an Invoice request and on gateway entries; it is recorded and listed with its payer otherwise.
- [ ] The guardian adds, changes and removes the Invoice request in the portal while not invoiced, and gets 409 once `invoicedOn` is set; each change is audited.
- [ ] Another Organisation's guardian or admin session reaches none of it (404).

## Notes

- Spec sections: Invoice requests; Payments; Removing a Registration.
- Glossary: Invoice request (`CONTEXT.md`).
- Admin side, states and invoice files: issue 82.

## Comments

- 2026-11-10: Implemented. The Camp switch is the Camp module `invoiceRequests` ("Platba fakturou"). The switch controls only new Invoice requests: an existing one stays changeable in the portal after it is switched off. A Correcting payment takes back at most what its payer paid. Erasure already blanks the note. The admin create body and the payments export payer column are left to issue 82. Open: when the company invoices the whole total, the form offers no Deposit, but a Registration whose share later becomes zero keeps its stored Deposit, which `amountDueNow` ignores. Not checked in a browser yet.
