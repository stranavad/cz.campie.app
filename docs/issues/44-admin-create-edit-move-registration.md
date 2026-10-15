# 44 - Admin create, edit and move Registration

Status: ready-for-agent
Stage: 1a
Episode: E6 Admin Registrations
Blocked by: 43
Stories: 109, 110

## What to build
An admin with Registrations write creates a Registration by hand for phone and paper registrations, using the same form but bypassing the Registration window, capacity and age limits, and may apply a Discount code past its limit or expiry (still counted as a use). They edit any answer of an existing Registration, including fields added in later form versions; removed fields stay read-only. They move a whole Registration to another Turnus of the same Camp, bypassing capacity and age; price lines stay and money is fixed with Price adjustments. When the admin adds a Participant or changes Paid extras, only the affected price lines are recalculated from the price list in force at that moment and shown before saving.

## Acceptance criteria
- [ ] Admin-created Registration succeeds outside the window, over capacity and outside age limits; gets a Variable symbol and Přihláška jobs like a public one.
- [ ] Code past limit or expiry accepted for admins and counted as a use.
- [ ] Edit endpoint validates through the form engine for the Registration's version plus later-added fields.
- [ ] Move to another Turnus of the same Camp updates all Participants; moving to another Camp's Turnus is rejected; price lines unchanged.
- [ ] Recalculation preview endpoint returns proposed changed lines; saving applies exactly them.
- [ ] Registrations read gets 403 on all writes.
- [ ] Every change audited with old and new values.

## Notes
- Spec sections: Registration, placement and declarations; Further Notes assumptions on admin recalculation.
- Domino forbids moving a Registration between Turnusy; here it is allowed.
