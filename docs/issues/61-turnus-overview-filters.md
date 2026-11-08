# 61 - Turnus overview and list filters

Status: done
Stage: 1b
Episode: E6 Admin Registrations
Blocked by: 38, 42, 59
Stories: 106, 107

## What to build

Add a Turnus overview for admins with Registrations read: places filled against capacity, and money expected, received and outstanding, plus the count of Overdue Registrations. Extend the Participant list with filters for payment status, Overdue, unsigned Consents, missing documents, missing required form answers, an unfinished Health record (once stage 2 lands) and unverified Claimed discounts. Admins can confirm a Claimed discount from the list or detail.

## Acceptance criteria

- [x] Overview totals match the ledger and price lines for a fixture with paid, partly paid, overpaid and Cancelled Participants.
- [x] Each filter returns exactly the expected Participants in a fixture.
- [x] Confirming a Claimed discount clears it from the unverified filter and is audited.
- [x] Health filter is absent without Health read.
- [x] Overview of Organisation A's Turnus is unreachable for B.

## Notes

- Spec sections: Payments (Overdue); Form engine (Claimed discount); User stories 106-107.
- Port from Domino: `apps/portal/src/pages/admin/Finance.vue` (overview ideas).

## Comments

2026-11-07 - **From issue 59.** `ChecklistService.ofTurnus(turnusId)` (`modules/registrations/checklist/services/checklist.service.ts`, in `RegistrationsModule`) gives every Registered child's checklist items (`kind`, `key`, `label`, `state`, `done`, `dueDate`) in a few queries.

2026-11-07 - **Done.** `GET /turnusy/:turnusId/overview` (Registrations read): capacity and Registered children, and summed over the Turnus's Registrations the totals, payments, what is still owed, what was overpaid, and the Overdue count, from `LedgerService.balancesOf`. The Participant list takes `overdue`, `unsignedConsent`, `missingDocument` (nothing or a returned document handed in for a requirement) and `missingAnswers`, read from `ChecklistService.ofTurnus`, and its rows carry the three checklist marks; a Cancelled child has no checklist, so no checklist filter finds one. The checklist feature moved into `RegistrationsModule` (`modules/registrations/checklist/`, `open-items-reminder/`), which the list needs. No Health filter exists until stage 2; Claimed discounts are confirmed in the detail as since issue 43, which already clears the unverified filter and audits it. Participants page: the overview above the list and the four filters.

2026-11-08 - **Decisions by the project lead (issue 38).** The overview also counts Registrations per payment status (`registrationsByPaymentStatus`), so partly paid ones show apart from unpaid ones, and the list filter offers `partly_paid`; Overdue follows each Registration's stored due dates.
