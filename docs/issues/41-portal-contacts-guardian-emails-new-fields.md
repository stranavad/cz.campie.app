# 41 - Portal: contact edits, guardian emails, new form fields

Status: done
Stage: 1a
Episode: E5 Guardian portal
Blocked by: 30, 39
Stories: 84, 85, 86

## What to build

Until the Camp's contact-edit lock date, a guardian edits contact and address details of the Registration, adds a second guardian, and fills fields added to the form after their Registration was submitted. A guardian may change either guardian's email; the change takes effect only after the link sent to the new address is confirmed, and the old address receives a notice naming the change and the camp's contact. An added second guardian receives an invitation email and has access immediately. Fields removed in a later form version are shown read-only and marked as removed. Answering a newly added surcharge field adds a price line at the amount shown at that moment; changing that answer later is admin only. After the lock date everything is read-only for guardians.

## Acceptance criteria

- [x] Edits allowed before the lock date and rejected after (Clock).
- [x] Email change: pending until confirmation; access follows the new address only after confirming; notice mail to the old address; both via mail fake.
- [x] Added guardian: invitation mail; can log in immediately.
- [x] New fields from later versions are returned and accepted; removed fields are returned read-only.
- [x] Answering a new surcharge field adds one frozen price line and updates the balance; a second change by the guardian is rejected.
- [x] Guardian cannot remove a guardian.
- [x] Every change audited with old and new values (encrypted fields by name only).

## Notes

- Spec sections: Identity (guardian emails); Form engine (new and removed fields).
- Port from Domino: `apps/portal/src/pages/parent/ParticipantEdit.vue` (UI reference).
- The "Doplnit údaje" checklist item is part of issue 59.

2026-11-07 - **Done.** Guardian edits in the portal (`modules/portal/guardian-edit/`), allowed through the Camp's contact-edit lock date (inclusive, Prague calendar; 409 `registration_locked` after) and run under a lock on the Registration: `GET /portal/registrations/:id/edit` shows the guardians (with a pending new email), the latest form's definition, the fields added since the Registration's own version, the frozen surcharge answers (per Participant) and answers to fields the latest form no longer asks, read-only with their last label (chosen options by label). `PATCH .../guardians/:position` changes a guardian's name and phone; `POST .../guardians` adds a second guardian once, who gets a login link (the login link job) and access at once; there is no way to remove one. `POST .../guardians/:position/email-change` (rate limited like login links, audited with the asking guardian) records the change and mails a 24-hour link to the new address from a job; `POST /portal/email-changes/confirm` (public, on a click) switches the address, audited, and a job tells the old address (it is kept on the confirmed change row until then, never in Redis). `PUT .../answers` answers new fields (`checkAnswersTo` in the form engine); each first answer to a surcharge field adds its price line at today's amount on the Participants it concerns, and changing it later answers 409 `answer_locked`. Not covered: address fields (standard fields, issue 29) and fields whose type changed between versions.
