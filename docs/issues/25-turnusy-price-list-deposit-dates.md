# 25 - Turnusy with price list, Deposit and dates

Status: in-progress
Stage: 1a
Episode: E2 Camp setup
Blocked by: 24
Stories: 37, 38, 39, 40

## What to build

An admin with Camp settings write creates and edits Turnusy of a Camp. A Turnus has a name, start and end dates, place, capacity, optional minimum and maximum age (whole years), a Registration window (opens and closes as a Prague date and time, either end optional), a manual "closed" switch and an optional website link. Its price list holds the Base price, an optional Early bird price with its last day, the per-child Deposit (0 means no Deposit), "Deposit due within N days of submission" (default 14) and the balance due date. All amounts are whole CZK integers. The API exposes a derived availability for each Turnus (not yet open, open, closed manually, closed by window, full) computed from the Clock port and the count of Registered Participants.

## Acceptance criteria

- [x] CRUD with Camp settings write; read-only with read; 403 with none.
- [x] Validation: end not before start, capacity at least 1, min age not above max age, window close after open, Early bird price requires its last day, amounts are non-negative integers.
- [x] Deposit 0 is stored as "no Deposit" and reported so by the API.
- [x] Availability is correct for each state using the controllable Clock, including the exact Prague open time (open is inclusive, close is exclusive) across a DST change.
- [ ] Changing a price list never alters stored price lines of existing Registrations (asserted once issue 35 exists; leave a pending test marked with the issue number).
- [x] Tenant isolation and audit entries as for every Organisation table.
- [x] Admin UI for the Turnus list and form; Czech strings through i18n.

## Notes

- Spec sections: Registration, placement and declarations; Payments (Deposit, due dates); Pricing.
- Port from Domino: `apps/api/src/turnus/services/turnus.service.ts`, `apps/portal/src/pages/admin/Turnusy.vue` (price fields, early bird). Domino stores but never enforces the window; here it is enforced.
- Age limits are compared with Age on start (completed years on the start date), see CONTEXT.md.

## Comments

2026-11-07 - **Implemented**, except the pending price-line test (below). Turnusy are managed in a section of the Camp settings page (`/platform/tabory`), one edited at a time.

- API: `GET`/`POST /camps/:campId/turnusy`, `GET`/`PATCH`/`DELETE /turnusy/:turnusId`; read with Camp settings read, changes with write, each audited (`turnus.create`, `.update`, `.remove`) with old and new values. `PATCH` takes the whole Turnus, so its cross-field rules always hold on the result.
- `turnusy` belongs to its Camp by a composite foreign key `(organisation_id, camp_id)`, under the organisation policy, with checks mirroring the contract (dates, capacity, prices, Deposit never 0, the Early bird pair, ages, window order, Deposit days).
- Registration window: entered and answered as Prague wall-clock text (`pragueLocalSchema`, documented in the schema guide's wire rules), stored as instants. `@repo/schema/shared` gained `instantFromPragueLocal`, `pragueLocalOf`, `pragueDateOf` (a skipped spring time reads an hour later, a repeated autumn time as the first), `calendarDateSchema` (real dates, 2000-2099) and `czkSchema`.
- Availability (`turnusAvailability`, pure, in `@repo/schema/camps`): closed by hand, then not yet open or closed by window (open inclusive, close exclusive), then full, else open; tested at the exact opening time on the day the clocks go forward.
- Deposit 0 is stored and answered as `null`. `depositDueDays` is required on the wire; the form suggests 14 (`DEFAULT_DEPOSIT_DUE_DAYS`).
- Not done here: the test that a price-list change never alters stored price lines of existing Registrations. The lint forbids `it.todo`, so issue 35 carries it in its comments, with counting Registered Participants (today 0 for every Turnus) and refusing to remove a Turnus that has Registrations.
