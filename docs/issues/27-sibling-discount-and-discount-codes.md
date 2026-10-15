# 27 - Sibling discount and Discount codes

Status: ready-for-agent
Stage: 1a
Episode: E2 Camp setup
Blocked by: 25, 26
Stories: 53, 54

## What to build

Camp-level discount settings and Discount code management. An admin with Camp settings write sets the Sibling discount amount (0 means none) and its mode (every child or from the second child). They create Discount codes for the Camp: code text, percentage or fixed amount, usage limit (optional), expiry as an inclusive Prague calendar date (optional), and can deactivate a code. The admin sees how many uses each code has. Codes are case-insensitive and unique within a Camp. This issue stores settings and codes and exposes them to the pricing module; consuming a use happens at submission (issue 35).

## Acceptance criteria

- [ ] Settings and codes editable with Camp settings write, readable with read, hidden with none.
- [ ] Code uniqueness per Camp, case-insensitive; the same code may exist in another Camp or Organisation.
- [ ] Percentage between 1 and 100; fixed amount a positive integer.
- [ ] A "check code" service returns valid, expired, exhausted, inactive or unknown for a given instant using the Clock port (Prague date, expiry inclusive).
- [ ] Use count is read from recorded uses, not a mutable counter that could drift (counter updated in the same transaction is acceptable if tested).
- [ ] Tenant isolation, audit entries.
- [ ] Admin UI for discount settings and codes.

## Notes

- Spec sections: Pricing (Discount code use), Further Notes divergence "Discount codes belong to a Camp".
- Port from Domino: `apps/api/src/admin-discount/` and `apps/portal/src/pages/admin/Discounts.vue` (Domino codes are global; here per Camp).
