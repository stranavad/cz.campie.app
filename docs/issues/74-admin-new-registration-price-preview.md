# 74 - Price preview for a new admin Registration

Status: ready-for-agent
Stage: 1b
Episode: E6 Admin Registrations
Blocked by: 38, 44
Stories: 109

## What to build

The redesigned Nová přihláška page shows the price as the admin fills it in: price lines, total, the Deposit and the due dates. The public price preview cannot serve it: it lives on the Organisation's subdomain, checks a Discount code as a guardian would, and returns no due dates. Add `POST /camps/:campId/registrations/preview` (Registrations write) that prices the same body `POST /camps/:campId/registrations` takes, as that endpoint would price it now.

## Acceptance criteria

- [ ] The preview returns the lines, the total, the Deposit total when chosen, and the deposit and balance due dates the Registration would get; creating it with the same body stores exactly those lines and dates.
- [ ] A Discount code past its limit or expiry shows as applied, as the admin create applies it; an unknown or inactive one shows as not applied.
- [ ] A closed or full Turnus and a child outside the age limits still get a price.
- [ ] The preview saves nothing: no Registration, no Variable symbol, no Discount code use, no Audit entry.
- [ ] Registrations read gets 403; a Turnus of another Camp is refused; a Camp of Organisation B is not found from A.

## Notes

- Spec sections: Pricing; Registration, placement and declarations.
- Design: canvas "Campie - návrhy designu", artboard `B3-NovaPrihlaska`. Consumed by the price panel of the admin Nová přihláška page.
- A cash Deposit taken at the desk needs no new endpoint: the page creates the Registration, then records the payment with `POST /registrations/:registrationId/payments`.
