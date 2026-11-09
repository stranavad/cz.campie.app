# 74 - Price preview for a new admin Registration

Status: done
Stage: 1b
Episode: E6 Admin Registrations
Blocked by: 38, 44
Stories: 109

## What to build

The redesigned Nová přihláška page shows the price as the admin fills it in: price lines, total, the Deposit and the due dates. The public price preview cannot serve it: it lives on the Organisation's subdomain, checks a Discount code as a guardian would, and returns no due dates. Add `POST /camps/:campId/registrations/preview` (Registrations write) that prices the same body `POST /camps/:campId/registrations` takes, as that endpoint would price it now.

## Acceptance criteria

- [ ] `cashDeposit` records exactly one cash payment of the Deposit total in the same transaction as the Registration; replaying the create with the same idempotency key records no second payment; it is refused when the body chooses no Deposit or the Turnus has none; it is audited with the Registration.
- [ ] The preview returns the lines, the total, the Deposit total when chosen, and the deposit and balance due dates the Registration would get; creating it with the same body stores exactly those lines and dates.
- [ ] A Discount code past its limit or expiry shows as applied, as the admin create applies it; an unknown or inactive one shows as not applied.
- [ ] A closed or full Turnus and a child outside the age limits still get a price.
- [ ] The preview saves nothing: no Registration, no Variable symbol, no Discount code use, no Audit entry.
- [ ] Registrations read gets 403; a Turnus of another Camp is refused; a Camp of Organisation B is not found from A.

## Notes

- Spec sections: Pricing; Registration, placement and declarations.
- Design: canvas "Campie - návrhy designu", artboard `B3-NovaPrihlaska`. Consumed by the price panel of the admin Nová přihláška page.
- A cash Deposit taken at the desk is recorded by `POST /camps/:campId/registrations` itself: an optional `cashDeposit` flag records the Deposit as a cash payment dated today in the same transaction as the Registration. Chaining a second `POST /registrations/:registrationId/payments` from the page is not safe: a lost response makes the admin retry, the idempotent create replays the Registration and the payment is recorded twice, with two payment emails. The redesign shipped that chain and the review removed it; this issue brings the checkbox back on the atomic endpoint.

## Comments

2026-11-09 - **In progress.** `POST /camps/:campId/registrations/preview` (Registrations write) takes the create body and answers `NewRegistrationPrice`: lines, total, `depositAvailable`, `depositTotal`, `depositDueDate`, `balanceDueDate` and `discountCode` (`applied` / `not_applied`, null when none typed). Preview and create share one private step, `RegistrationService.priceForAdmin` (form check, code lookup past its limit or expiry, `priceRegistration`), and the due dates come from one helper, so the preview is what create stores; the preview takes no code lock and saves nothing. `cashDeposit` (default false) on the create records one manual payment of the server's Deposit total, dated today in Prague, note "Záloha v hotovosti", through `LedgerService.recordPayment` in the create's unit of work: audited `payment.create`, emailed to the guardians like any payment received; a replay of the key returns before it, so nothing is recorded twice; without a Deposit to pay (paying in full, a Turnus without one, or a price discounted to zero) it answers 409 `cash_deposit_unavailable`. The Nová přihláška summary shows the live price, the Deposit and due dates, "Platit nejdřív zálohu", a Discount code field and "Záloha zaplacena v hotovosti". Decisions to confirm: the admin preview tells only applied or not, no more than the admin create's field errors and the public preview already tell, so it has no rate limit (issue 22 limits anonymous callers); the payment received email goes out with a cash Deposit even when the confirmation is switched off.
