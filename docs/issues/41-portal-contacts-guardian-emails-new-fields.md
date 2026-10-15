# 41 - Portal: contact edits, guardian emails, new form fields

Status: ready-for-agent
Stage: 1a
Episode: E5 Guardian portal
Blocked by: 30, 39
Stories: 84, 85, 86

## What to build

Until the Camp's contact-edit lock date, a guardian edits contact and address details of the Registration, adds a second guardian, and fills fields added to the form after their Registration was submitted. A guardian may change either guardian's email; the change takes effect only after the link sent to the new address is confirmed, and the old address receives a notice naming the change and the camp's contact. An added second guardian receives an invitation email and has access immediately. Fields removed in a later form version are shown read-only and marked as removed. Answering a newly added surcharge field adds a price line at the amount shown at that moment; changing that answer later is admin only. After the lock date everything is read-only for guardians.

## Acceptance criteria

- [ ] Edits allowed before the lock date and rejected after (Clock).
- [ ] Email change: pending until confirmation; access follows the new address only after confirming; notice mail to the old address; both via mail fake.
- [ ] Added guardian: invitation mail; can log in immediately.
- [ ] New fields from later versions are returned and accepted; removed fields are returned read-only.
- [ ] Answering a new surcharge field adds one frozen price line and updates the balance; a second change by the guardian is rejected.
- [ ] Guardian cannot remove a guardian.
- [ ] Every change audited with old and new values (encrypted fields by name only).

## Notes

- Spec sections: Identity (guardian emails); Form engine (new and removed fields).
- Port from Domino: `apps/portal/src/pages/parent/ParticipantEdit.vue` (UI reference).
- The "Doplnit údaje" checklist item is part of issue 59.
