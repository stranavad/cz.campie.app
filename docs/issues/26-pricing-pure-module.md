# 26 - Pricing pure module

Status: done
Stage: 1a
Episode: E2 Camp setup
Blocked by: 02
Stories: 38, 47, 53, 54, 65, 67

## What to build

A pure, framework-free pricing module in the shared schema package (so the form and the API compute identical results). Input: the Turnus price list, the Camp's Sibling discount settings, the Participants with their surcharge answers, an optional Discount code, the payment choice (full or Deposit) and the submission instant. Output: a breakdown of price lines plus totals. Rules: Base price or Early bird price per Participant by Prague submission date; Paid extras and Claimed discounts as per-child surcharge lines; Sibling discount per child, applied to every child or from the second child as the Camp chooses, only when the Registration has more than one Participant; a percentage Discount code applies to the per-child prices before the Sibling discount and not to surcharges, a fixed-amount code comes off the Registration total; the total never goes below zero; the Deposit total is per-child Deposit times Participants when chosen and the Turnus has one. A second function computes amount due now and its due date from the stored lines, the ledger total and dates (used by issue 38).

## Acceptance criteria

- [x] Unit tests (pure seam) cover every rule above, including Early bird on its last day in Prague time near midnight UTC.
- [x] Sibling discount "every child" vs "from the second child" with 1, 2 and 3 Participants.
- [x] Percentage and fixed Discount codes; combined with Sibling discount; total floored at 0.
- [x] Negative surcharges (Claimed discounts) and positive ones (Paid extras) each become their own line.
- [x] Deposit 0 means no Deposit line and the Deposit choice is reported unavailable; a submission after the balance due date reports Deposit unavailable.
- [x] Amount-due-now function: deposits phase, balance phase, full-payment choice uses the earlier of deposit date and balance due date, overpaid gives zero due.
- [x] Output is lines with stable kinds and labels so they can be stored and rendered unchanged later.
- [x] No I/O, no clock access, no framework imports.

## Notes

- Spec sections: Pricing; Payments (amount due now); Further Notes assumptions on Discount code order.
- Port from Domino: `apps/api/src/registration/registration.pricing.ts` and its tests `registration.pricing.spec.ts` (pragueDate, isEarlyBird). Domino's exclusive discount types are not carried over.
- Rules may change after the pilot camps' paper exercise; keep them in one place.

## Comments

2026-11-07 - **Implemented** in `@repo/schema/pricing`, pure: no I/O, no clock, the submission instant is an argument.

- `priceRegistration(input)` answers `{ lines, total, depositAvailable, depositTotal }`. Line kinds (`PRICE_LINE_KINDS`): `base_price`, `early_bird_price`, `paid_extra`, `claimed_discount`, `sibling_discount`, `discount_code`, `zero_floor`; each has the Participant's position or null for the Registration, a `label` only where it is data (the answer's label, the code), and whole CZK. Renderers name the kinds; the lines always sum to the total.
- Order: children's prices, surcharges, a percentage code off the children's prices (rounded half up, in the guardian's favour), the Sibling discount (more than one Participant; every child or from the second), then a fixed code off what is left. The code never adds money and is capped so the total stays at 0 or above; when Claimed discounts alone exceed the price, a `zero_floor` line makes up the difference.
- Deposit: offered when the Turnus has one above 0 and the submission's Prague date is not after the balance due date; owed per child, never more than the total.
- `amountDueNow(input)` answers `{ phase: deposit | balance | full | settled, amount, dueDate }` from the total, the Deposit owed, the ledger sum and the dates. The deposit date is the Prague submission date plus the deposit days, but never after the balance due date (paying it on time would otherwise leave the Registration Overdue). A total brought below the Deposits by Price adjustments caps them.
- `addDays` joined the Prague time helpers in `@repo/schema/shared`.
