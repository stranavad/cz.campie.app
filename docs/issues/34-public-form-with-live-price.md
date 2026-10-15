# 34 - Public form with live price

Status: ready-for-agent
Stage: 1a
Episode: E3 Public registration
Blocked by: 27, 30, 33
Stories: 63, 64, 65, 66, 67, 68, 69, 70, 75, 76

## What to build

The public registration form at `/{camp-slug}/prihlaska?turnus={id}`, rendered from the Camp's latest published form version. The guardian picks one Turnus first (preselected from the link); every child added to the form goes to it. The form takes up to the Camp's maximum number of children, the guardian and an optional second guardian, the standard and custom fields, the payment choice (full or Deposit, only when the Turnus has a Deposit and the balance due date has not passed), the payment method (only bank transfer in 1a), a Discount code and the declarations. The price updates live through a price-preview endpoint that runs the pricing module server-side and reports whether the code applied. Age outside the Turnus limits is shown at the birth date with the camp's contact. Validation messages are Czech and next to their field. This issue stops before submission (issue 35).

## Acceptance criteria

- [ ] Form renders from the published version via the form engine; the builder preview (issue 30) uses the same components.
- [ ] Price-preview endpoint returns the breakdown for given answers, Turnus and code; results match the pricing module's tests.
- [ ] Code check reports applied, expired, exhausted, inactive or unknown with an i18n message.
- [ ] Age check uses Age on start, inclusive limits, and reports the camp's contact.
- [ ] Deposit choice hidden when the Turnus has no Deposit or the balance due date has passed.
- [ ] Price-preview is rate limited (issue 22) and works without a session.
- [ ] Works at phone width; strings through i18n.

## Notes

- Spec sections: Form engine; Pricing; Registration, placement and declarations.
- Port from Domino: `apps/web/app/prihlaska/` (`PrihlasovaciFormularClient.tsx`, `components/PriceCard.tsx`, `PaymentStep.tsx`) as UI reference; rewritten in React with TanStack.
