# 34 - Public form with live price

Status: done
Stage: 1a
Episode: E3 Public registration
Blocked by: 27, 30, 33
Stories: 63, 64, 65, 66, 67, 68, 69, 70, 75, 76

## What to build

The public registration form at `/{camp-slug}/prihlaska?turnus={id}`, rendered from the Camp's latest published form version. The guardian picks one Turnus first (preselected from the link); every child added to the form goes to it. The form takes up to the Camp's maximum number of children, the guardian and an optional second guardian, the standard and custom fields, the payment choice (full or Deposit, only when the Turnus has a Deposit and the balance due date has not passed), the payment method (only bank transfer in 1a), a Discount code and the declarations. The price updates live through a price-preview endpoint that runs the pricing module server-side and reports whether the code applied. Age outside the Turnus limits is shown at the birth date with the camp's contact. Validation messages are Czech and next to their field. This issue stops before submission (issue 35).

## Acceptance criteria

- [x] Form renders from the published version via the form engine; the builder preview (issue 30) uses the same components.
- [x] Price-preview endpoint returns the breakdown for given answers, Turnus and code; results match the pricing module's tests.
- [x] Code check reports applied, expired, exhausted, inactive or unknown with an i18n message.
- [x] Age check uses Age on start, inclusive limits, and reports the camp's contact.
- [x] Deposit choice hidden when the Turnus has no Deposit or the balance due date has passed.
- [x] Price-preview is rate limited (issue 22) and works without a session.
- [x] Works at phone width; strings through i18n.

## Notes

- Spec sections: Form engine; Pricing; Registration, placement and declarations.
- Port from Domino: `apps/web/app/prihlaska/` (`PrihlasovaciFormularClient.tsx`, `components/PriceCard.tsx`, `PaymentStep.tsx`) as UI reference; rewritten in React with TanStack.

## Comments

2026-11-07 - **From issue 30.** `GET /public-camps/:slug/registration-form` serves the latest version; render its fields with `formFields` (`@repo/schema/form-engine`) and `RegistrationField` (`apps/app/src/core/registration-form`), as the builder's preview does (`form-preview.tsx`); move the child and guardian layout into `core/registration-form` when the form needs it. Standard fields render as plain text until issue 29 gives the catalogue input kinds and options. Core labels come from translations, not from the stored version.

2026-11-07 - **From issue 31.** The public form's declarations carry five-minute PDF links; refetch the form before they expire (as the builder does, every four minutes) or when a guardian opens one. Render them with `DeclarationCheckbox`.

2026-11-07 - **Implemented.** `/{camp-slug}/prihlaska?turnus=<id>` (the Turnus picker keeps it in the address) renders the latest published form: children up to the Camp's maximum, the guardian and an optional second one, the Registration's own questions, the payment choice (only when the Turnus offers a Deposit), bank transfer, a Discount code, the declarations, a live price card, and "Zkontrolovat přihlášku", which shows every error at its field. Open Turnusy on the Camp page link to it. Sending is issue 35.

- `POST /public-camps/:slug/price-preview` (no session; CSRF header as every mutation; `RateLimiter.admit` per IP, `PRICE_PREVIEW_LIMIT_PER_IP`, and per Organisation, `PRICE_PREVIEW_LIMIT_PER_ORGANISATION`) prices the answers with `priceRegistration` at the Clock's now: the Turnus's price list, the Camp's Sibling discount, `surchargesOf` under the latest version, and the code when `DiscountCodeService.check` finds it valid. It answers the lines, the total, whether a Deposit is offered and owed, and the code's check: applied, expired, exhausted, inactive or unknown. The form sends only the answers to fields that carry a surcharge (`pricedFieldIds`), so typing a name or a note asks nothing, and debounces them.
- The form engine's core gained an optional second guardian (`secondGuardian*`); once any of their fields is given, their name and email are needed.
- Age on start (`ageOnStart`, `ageProblem` in `@repo/schema/camps`): completed years on the start date, both limits inclusive; a child outside them gets a note at the birth date with the camp's contact (a 29 February birthday counts from 1 March in other years).
- The public Camp now carries its contact (name, email, phone), falling back to the Organisation's contact; Organisation settings say so at the contact email.
- `surchargesOf` runs on unchecked answers here, so a crafted preview can show a wrong price; issue 35 must price only checked answers.
