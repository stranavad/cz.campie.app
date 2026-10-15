# 26 - Pricing pure module

Status: ready-for-agent
Stage: 1a
Episode: E2 Camp setup
Blocked by: 02
Stories: 38, 47, 53, 54, 65, 67

## What to build

A pure, framework-free pricing module in the shared schema package (so the form and the API compute identical results). Input: the Turnus price list, the Camp's Sibling discount settings, the Participants with their surcharge answers, an optional Discount code, the payment choice (full or Deposit) and the submission instant. Output: a breakdown of price lines plus totals. Rules: Base price or Early bird price per Participant by Prague submission date; Paid extras and Claimed discounts as per-child surcharge lines; Sibling discount per child, applied to every child or from the second child as the Camp chooses, only when the Registration has more than one Participant; a percentage Discount code applies to the per-child prices before the Sibling discount and not to surcharges, a fixed-amount code comes off the Registration total; the total never goes below zero; the Deposit total is per-child Deposit times Participants when chosen and the Turnus has one. A second function computes amount due now and its due date from the stored lines, the ledger total and dates (used by issue 38).

## Acceptance criteria

- [ ] Unit tests (pure seam) cover every rule above, including Early bird on its last day in Prague time near midnight UTC.
- [ ] Sibling discount "every child" vs "from the second child" with 1, 2 and 3 Participants.
- [ ] Percentage and fixed Discount codes; combined with Sibling discount; total floored at 0.
- [ ] Negative surcharges (Claimed discounts) and positive ones (Paid extras) each become their own line.
- [ ] Deposit 0 means no Deposit line and the Deposit choice is reported unavailable; a submission after the balance due date reports Deposit unavailable.
- [ ] Amount-due-now function: deposits phase, balance phase, full-payment choice uses the earlier of deposit date and balance due date, overpaid gives zero due.
- [ ] Output is lines with stable kinds and labels so they can be stored and rendered unchanged later.
- [ ] No I/O, no clock access, no framework imports.

## Notes

- Spec sections: Pricing; Payments (amount due now); Further Notes assumptions on Discount code order.
- Port from Domino: `apps/api/src/registration/registration.pricing.ts` and its tests `registration.pricing.spec.ts` (pragueDate, isEarlyBird). Domino's exclusive discount types are not carried over.
- Rules may change after the pilot camps' paper exercise; keep them in one place.
