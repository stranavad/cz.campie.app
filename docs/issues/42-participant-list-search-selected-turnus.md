# 42 - Participant list with search and Selected Turnus

Status: done
Stage: 1a
Episode: E6 Admin Registrations
Blocked by: 19, 35
Stories: 104, 105, 111

## What to build

The admin's main working list: one row per Participant of the Selected Turnus. The Selected Turnus is the admin's viewing choice, remembered per user, switchable from the header; it is not a business state. Rows show child name, Age on start, guardian, email, Variable symbol, payment status, amount due now and the Participant's state. Search covers child name, guardian name, email and Variable symbol. Filters for consents, documents and health come in issue 61; this issue ships a payment status filter and a filter for unverified Claimed discounts. Rows open the Registration detail (issue 43).

## Acceptance criteria

- [x] Requires Registrations read; none gets 403.
- [x] Only Participants of the selected Turnus and current Organisation; cross-tenant ids return nothing.
- [x] Search by each field, case- and diacritics-insensitive.
- [x] Payment status and unverified Claimed discount filters.
- [x] Encrypted fields are never filtered or sorted in the database.
- [x] Selected Turnus persisted per user.
- [x] Health data never appears in the list.

## Notes

- Spec sections: Admin Registrations stories; Further Notes divergence "No Current Turnus".
- Port from Domino: `apps/portal/src/pages/admin/Registrations.vue`, `apps/portal/src/lib/selectedTurnus.ts`.

2026-11-07 - **Done.** `GET /turnusy/:turnusId/participants` (Registrations read) returns one row per Participant of the Turnus: name, Age on start, the first guardian's name and email, Variable symbol, payment status, amount due now with its date, Overdue, state, and whether a Claimed discount needing verification was answered (from the answers and the Registration's form version). Rows are built in the API from bulk queries (a Turnus holds at most a few hundred children), so nothing is filtered or sorted in the database: every word of `search` must appear among the child's and both guardians' names, the emails and the Variable symbol, in any case and without diacritics; `paymentStatus` and `unverifiedClaimedDiscount=true` filter; rows sort by surname in Czech order. The Selected Turnus is `memberships.selected_turnus_id` (`GET`/`PUT /selected-turnus`, Registrations read), per admin and Organisation; a removed Turnus reads as none. Admin page `/platform/prihlasky` with the Turnus switcher at its top, search and filters. Rows do not open anything yet: the Registration detail comes with issue 43, and its confirmation of Claimed discounts must take confirmed ones out of the unverified filter.

2026-11-08 - **Switcher in the header.** As the project lead answered, the Turnus switcher moved from the top of `/platform/prihlasky` to the main host's header, so it shows on every admin page for a member with Registrations read and at least one Turnus. The Selected Turnus query, mutation and switcher now live in `core/selected-turnus` (`useSelectedTurnus`, `TurnusSwitcher`); the participant list, the admin's create page and the move control read it from there. Behaviour is unchanged: the remembered Turnus, else the newest, saved per admin with `PUT /selected-turnus`. Saving or removing a Turnus and renaming a Camp now refetch the switcher, since it stays mounted.
