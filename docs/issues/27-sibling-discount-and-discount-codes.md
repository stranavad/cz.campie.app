# 27 - Sibling discount and Discount codes

Status: done
Stage: 1a
Episode: E2 Camp setup
Blocked by: 25, 26
Stories: 53, 54

## What to build

Camp-level discount settings and Discount code management. An admin with Camp settings write sets the Sibling discount amount (0 means none) and its mode (every child or from the second child). They create Discount codes for the Camp: code text, percentage or fixed amount, usage limit (optional), expiry as an inclusive Prague calendar date (optional), and can deactivate a code. The admin sees how many uses each code has. Codes are case-insensitive and unique within a Camp. This issue stores settings and codes and exposes them to the pricing module; consuming a use happens at submission (issue 35).

## Acceptance criteria

- [x] Settings and codes editable with Camp settings write, readable with read, hidden with none.
- [x] Code uniqueness per Camp, case-insensitive; the same code may exist in another Camp or Organisation.
- [x] Percentage between 1 and 100; fixed amount a positive integer.
- [x] A "check code" service returns valid, expired, exhausted, inactive or unknown for a given instant using the Clock port (Prague date, expiry inclusive).
- [x] Use count is read from recorded uses, not a mutable counter that could drift (counter updated in the same transaction is acceptable if tested).
- [x] Tenant isolation, audit entries.
- [x] Admin UI for discount settings and codes.

## Notes

- Spec sections: Pricing (Discount code use), Further Notes divergence "Discount codes belong to a Camp".
- Port from Domino: `apps/api/src/admin-discount/` and `apps/portal/src/pages/admin/Discounts.vue` (Domino codes are global; here per Camp).

## Comments

2026-11-07 - **Implemented.** The Camp settings page edits the Sibling discount with the Camp and lists the Camp's Discount codes in their own section.

- Sibling discount: `camps.sibling_discount_amount` (0 for none) and `sibling_discount_applies_to` (`every_child` or `from_second_child`), part of `PATCH /camps/:campId`; `CampEntity.toSiblingDiscount()` gives what pricing takes.
- Discount codes: `GET`/`POST /camps/:campId/discount-codes`, `PATCH`/`DELETE /discount-codes/:id`, read with Camp settings read, changes with write, all audited. Codes are plain letters, digits and hyphens (3-40), unique per Camp in any case by a unique index on `lower(code)`, compared in SQL on both sides. Text, kind and value are fixed once created; on/off, limit and expiry change. A code nobody used can be deleted (typos); a used one answers 409 `discount_code_used` and can only be switched off.
- Uses are rows of `discount_code_uses`, counted on read. `discountCodeStatus` (pure, `@repo/schema/camps`) and `DiscountCodeService.check(campId, text)` answer valid, expired (Prague date, inclusive), exhausted, inactive or unknown by the Clock; `DiscountCodeEntity.toPricing()` gives what pricing takes.
