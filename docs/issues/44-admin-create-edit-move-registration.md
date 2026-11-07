# 44 - Admin create, edit and move Registration

Status: done
Stage: 1a
Episode: E6 Admin Registrations
Blocked by: 43
Stories: 109, 110

## What to build

An admin with Registrations write creates a Registration by hand for phone and paper registrations, using the same form but bypassing the Registration window, capacity and age limits, and may apply a Discount code past its limit or expiry (still counted as a use). They edit any answer of an existing Registration, including fields added in later form versions; removed fields stay read-only. They move a whole Registration to another Turnus of the same Camp, bypassing capacity and age; price lines stay and money is fixed with Price adjustments. When the admin adds a Participant or changes Paid extras, only the affected price lines are recalculated from the price list in force at that moment and shown before saving.

## Acceptance criteria

- [x] Admin-created Registration succeeds outside the window, over capacity and outside age limits; gets a Variable symbol and Přihláška jobs like a public one.
- [x] Code past limit or expiry accepted for admins and counted as a use.
- [x] Edit endpoint validates through the form engine for the Registration's version plus later-added fields.
- [x] Move to another Turnus of the same Camp updates all Participants; moving to another Camp's Turnus is rejected; price lines unchanged.
- [x] Recalculation preview endpoint returns proposed changed lines; saving applies exactly them.
- [x] Registrations read gets 403 on all writes.
- [x] Every change audited with old and new values.

## Notes

- Spec sections: Registration, placement and declarations; Further Notes assumptions on admin recalculation.
- Domino forbids moving a Registration between Turnusy; here it is allowed.

2026-11-07 - **Done.** `POST /camps/:campId/registrations` (`RegistrationService.createByAdmin`) creates a Registration under the Camp's latest form outside the window, over capacity and outside age limits, without mandatory declarations, with a Discount code past its limit or expiry (an inactive or unknown one is still refused) counted as a use; it gets a Variable symbol, the Přihlášky and the confirmations like a public one, audited `registration.create` with the admin. `AdminRegistrationService` (Registrations write): answers are validated against the Registration's version for the fields the latest form still asks and the latest form for fields added since (removed fields stay read-only; required answers cannot be emptied); `POST .../answers/preview` and `POST .../participants/preview` list the price lines a change adds, and `PUT .../answers` / `POST .../participants` save only with those `expectedLines` (else 409 `price_changed`). Price lines now keep the answer they come from (`price_lines.field_id`, `option_id`, `PriceLine.source`), so an option no longer chosen is reversed exactly as charged and a newly chosen one is added at today's amount; unchanged options of a multiple choice stay. An added child gets the price in force now, its surcharges and the Sibling discount, and under "every child" each Registered child without one gets it too; a percentage Discount code is not applied to an added child (its line stays as submitted; settle with a Price adjustment). `POST .../move` moves the whole Registration within its Camp (409 `turnus_other_camp`), price lines untouched. `PUT .../guardians/:position` changes a guardian, the email at once: it replaces any change the guardian is confirming and the old address gets the notice (now `modules/registrations/guardian-email/`). Admin pages: `/platform/prihlasky/nova` and the edit, add-child, move and guardian sections of the detail.
