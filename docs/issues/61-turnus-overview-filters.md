# 61 - Turnus overview and list filters

Status: ready-for-agent
Stage: 1b
Episode: E6 Admin Registrations
Blocked by: 38, 42, 59
Stories: 106, 107

## What to build

Add a Turnus overview for admins with Registrations read: places filled against capacity, and money expected, received and outstanding, plus the count of Overdue Registrations. Extend the Participant list with filters for payment status, Overdue, unsigned Consents, missing documents, missing required form answers, an unfinished Health record (once stage 2 lands) and unverified Claimed discounts. Admins can confirm a Claimed discount from the list or detail.

## Acceptance criteria

- [ ] Overview totals match the ledger and price lines for a fixture with paid, partly paid, overpaid and Cancelled Participants.
- [ ] Each filter returns exactly the expected Participants in a fixture.
- [ ] Confirming a Claimed discount clears it from the unverified filter and is audited.
- [ ] Health filter is absent without Health read.
- [ ] Overview of Organisation A's Turnus is unreachable for B.

## Notes

- Spec sections: Payments (Overdue); Form engine (Claimed discount); User stories 106-107.
- Port from Domino: `apps/portal/src/pages/admin/Finance.vue` (overview ideas).
