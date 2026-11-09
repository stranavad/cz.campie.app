# 77 - Public pages: Camp summaries, Deposit, contact and Sibling discount

Status: ready-for-agent
Stage: 1b
Episode: E3 Public registration
Blocked by: 27, 33, 34
Stories: 59, 60, 65, 67, 89

## What to build

The redesigned public pages need a few read-only fields the public contracts lack. The landing page's Camp cards show the Camp's Turnus dates and "od {price}"; the Camp page shows each Turnus's Deposit; the guardian footer shows the Organisation's contact email and phone on pages without a Camp (landing page, portal login); and the form wizard's "+ Sourozenec -500 Kč" needs the Sibling discount before a second child is added.

## Decisions

- **Camp summary on the public Camp list.** Per Camp: the first start and last end date of its Turnusy that are not yet over, and the lowest `priceNow` among those still open or not yet open; null when it has none. Computed with the same availability rules as the Camp page.
- **Deposit on the public Turnus.** `deposit` per child, null when the Turnus has none.
- **Organisation contact.** `GET /organisation` gains the contact email and phone from Organisation settings.
- **Sibling discount on the public Camp.** The amount and whether it applies to every child or from the second; the price preview stays the source of the actual lines.

## Acceptance criteria

- [ ] The Camp list's dates and lowest price ignore finished Turnusy, take Early bird prices while in force, and are null for a Camp without upcoming Turnusy.
- [ ] A Turnus with a Deposit returns it; one without returns null.
- [ ] `GET /organisation` returns the contact on the Organisation's subdomain and still answers `organisation_suspended` for a suspended one.
- [ ] The public Camp's Sibling discount matches what the price preview applies for two children, in both modes.
- [ ] Nothing on these endpoints exposes capacity, counts beyond remaining places, billing details or another Organisation's data.

## Notes

- Spec sections: Pricing; Other (branding).
- Design: canvas "Campie - návrhy designu", artboards `M-Organizace` (Camp cards, footer), `M-Tabor` (Turnus Deposit), `M-Prihlaska` (Sibling discount), `M-PortalLogin` (footer). Consumed by the public landing and Camp pages, the form wizard (issue 34's comment of 2026-11-09) and the guardian footer.
