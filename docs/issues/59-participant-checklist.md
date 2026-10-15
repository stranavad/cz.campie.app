# 59 - Participant checklist

Status: ready-for-agent
Stage: 1b
Episode: E5 Guardian portal
Blocked by: 41, 53, 57
Stories: 87

## What to build

Build a pure checklist module that aggregates per Participant the status each module reports: payment (from the Registration's amount due now), missing required form answers ("Doplnit údaje", from fields added in later form versions), each Consent, the Health record (stub until stage 2) and each document requirement. Modules switched off for the Camp contribute nothing. The portal shows one checklist per child; the API exposes the same aggregation for admin filters and reminders.

## Acceptance criteria

- [ ] Pure-module tests cover every item kind, including module off, Withdrawn Consent, Returned document, requirement marked on paper and Cleared requirements.
- [ ] A Participant with a required field added in a later form version and unanswered shows a 'Doplnit údaje' item.
- [ ] Cancelled Participants have no checklist.
- [ ] The portal endpoint returns the checklist only for Participants the guardian has access to.

## Notes

- Spec sections: Documents (checklist); Form engine (new fields); Consents.
- Replaces Domino's feature-linked document types (Domino ADR-0001): each module reports its own status.
- Health record item is a no-op until stage 2; design the module interface so it plugs in.
