# 60 - Open-items reminder

Status: done
Stage: 1b
Episode: E5 Guardian portal
Blocked by: 59
Stories: 132, 154

## What to build

An admin with Registrations write sends a reminder to the guardians of every Registration in the Selected Turnus that has open checklist items (unsigned Consents, missing documents, missing required form answers, and the Health record once stage 2 lands). Each email lists what is still open per child, using the Camp's open-items reminder text with placeholders. The admin sees the number of target Registrations before confirming. Sending runs as background jobs to both guardians.

## Acceptance criteria

- [x] Preview counts Registrations with at least one open non-payment item.
- [x] Each email lists the open items per Participant from the checklist module.
- [x] The Camp's switch for this email type is respected.
- [x] Permission and tenant isolation as in issue 50; the action is audited.

## Notes

- Spec sections: Emails; Documents (checklist).
- Payment items are reminded by issue 50, not here.

## Comments

2026-11-07 - **From issue 59.** `ChecklistService.ofTurnus(turnusId)` (`modules/registrations/checklist/services/checklist.service.ts`, in `RegistrationsModule`) gives every Registered child's checklist items (`kind`, `key`, `label`, `state`, `done`, `dueDate`) in a few queries.

2026-11-07 - **Done.** `GET`/`POST /turnusy/:turnusId/open-items-reminders` (Registrations write) count and remind the Registrations with an item `isOpenForGuardians` (from `@repo/schema/checklist`: open, not payment, not a document waiting for the camp's review); `checklist.send-open-items-reminder` per guardian (never access emails) reads the checklist again when it sends and lists what is open per child below the Camp's `open_items_reminder` text (new `details` slot of the Camp emails), skipping one with nothing open any more. Audited `open_items_reminder.send` with the count; 409 `open_items_reminder_switched_off` when the Camp switched it off; counted per Organisation like the payment reminder (same limit, counted apart). Participants page: "Připomenout chybějící věci" with the count before a confirming click.
