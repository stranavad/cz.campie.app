# 59 - Participant checklist

Status: done
Stage: 1b
Episode: E5 Guardian portal
Blocked by: 41, 53, 57
Stories: 87

## What to build

Build a pure checklist module that aggregates per Participant the status each module reports: payment (from the Registration's amount due now), missing required form answers ("Doplnit údaje", from fields added in later form versions), each Consent, the Health record (stub until stage 2) and each document requirement. Modules switched off for the Camp contribute nothing. The portal shows one checklist per child; the API exposes the same aggregation for admin filters and reminders.

## Acceptance criteria

- [x] Pure-module tests cover every item kind, including module off, Withdrawn Consent, Returned document, requirement marked on paper and Cleared requirements.
- [x] A Participant with a required field added in a later form version and unanswered shows a 'Doplnit údaje' item.
- [x] Cancelled Participants have no checklist.
- [x] The portal endpoint returns the checklist only for Participants the guardian has access to.

## Notes

- Spec sections: Documents (checklist); Form engine (new fields); Consents.
- Replaces Domino's feature-linked document types (Domino ADR-0001): each module reports its own status.
- Health record item is a no-op until stage 2; design the module interface so it plugs in.

## Comments

2026-11-07 - **Done.** Pure module `@repo/schema/checklist`: `checklistOf(input)` gathers a child's items from what each module reports: payment (done once nothing is due now), missing answers (one item with the count, from `missingNewAnswers` in the form engine: required fields a later version added, unanswered), each Consent (signed or Withdrawn count as done), the Health record (`healthRecord: null` until stage 2, so it reports nothing yet; a module plugs in by passing `{ complete }`), each requirement (approved, on paper or `cleared` done; pending not done; returned or missing open); modules switched off report nothing and a Cancelled child gets null. `ChecklistService` (`modules/checklist/checklist/`) gathers the inputs for a Turnus in a few queries: `ofTurnus(turnusId)` for admin filters and reminders (issues 60, 61), `forGuardian` behind `GET /portal/registrations/:id/checklist`. Portal: "Co ještě zbývá" on each Registration card, open items linking to where they are settled. Missing answers stay open after the contact-edit lock date, since admins can still fill them.
