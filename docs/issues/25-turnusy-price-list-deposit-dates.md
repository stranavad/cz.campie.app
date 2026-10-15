# 25 - Turnusy with price list, Deposit and dates

Status: ready-for-agent
Stage: 1a
Episode: E2 Camp setup
Blocked by: 24
Stories: 37, 38, 39, 40

## What to build
An admin with Camp settings write creates and edits Turnusy of a Camp. A Turnus has a name, start and end dates, place, capacity, optional minimum and maximum age (whole years), a Registration window (opens and closes as a Prague date and time, either end optional), a manual "closed" switch and an optional website link. Its price list holds the Base price, an optional Early bird price with its last day, the per-child Deposit (0 means no Deposit), "Deposit due within N days of submission" (default 14) and the balance due date. All amounts are whole CZK integers. The API exposes a derived availability for each Turnus (not yet open, open, closed manually, closed by window, full) computed from the Clock port and the count of Registered Participants.

## Acceptance criteria
- [ ] CRUD with Camp settings write; read-only with read; 403 with none.
- [ ] Validation: end not before start, capacity at least 1, min age not above max age, window close after open, Early bird price requires its last day, amounts are non-negative integers.
- [ ] Deposit 0 is stored as "no Deposit" and reported so by the API.
- [ ] Availability is correct for each state using the controllable Clock, including the exact Prague open time (open is inclusive, close is exclusive) across a DST change.
- [ ] Changing a price list never alters stored price lines of existing Registrations (asserted once issue 35 exists; leave a pending test marked with the issue number).
- [ ] Tenant isolation and audit entries as for every Organisation table.
- [ ] Admin UI for the Turnus list and form; Czech strings through i18n.

## Notes
- Spec sections: Registration, placement and declarations; Payments (Deposit, due dates); Pricing.
- Port from Domino: `apps/api/src/turnus/services/turnus.service.ts`, `apps/portal/src/pages/admin/Turnusy.vue` (price fields, early bird). Domino stores but never enforces the window; here it is enforced.
- Age limits are compared with Age on start (completed years on the start date), see CONTEXT.md.
