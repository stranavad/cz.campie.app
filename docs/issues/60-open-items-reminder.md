# 60 - Open-items reminder

Status: ready-for-agent
Stage: 1b
Episode: E5 Guardian portal
Blocked by: 59
Stories: 132, 154

## What to build

An admin with Registrations write sends a reminder to the guardians of every Registration in the Selected Turnus that has open checklist items (unsigned Consents, missing documents, missing required form answers, and the Health record once stage 2 lands). Each email lists what is still open per child, using the Camp's open-items reminder text with placeholders. The admin sees the number of target Registrations before confirming. Sending runs as background jobs to both guardians.

## Acceptance criteria

- [ ] Preview counts Registrations with at least one open non-payment item.
- [ ] Each email lists the open items per Participant from the checklist module.
- [ ] The Camp's switch for this email type is respected.
- [ ] Permission and tenant isolation as in issue 50; the action is audited.

## Notes

- Spec sections: Emails; Documents (checklist).
- Payment items are reminded by issue 50, not here.
