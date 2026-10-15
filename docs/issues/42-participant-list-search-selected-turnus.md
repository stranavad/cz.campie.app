# 42 - Participant list with search and Selected Turnus

Status: ready-for-agent
Stage: 1a
Episode: E6 Admin Registrations
Blocked by: 19, 35
Stories: 104, 105, 111

## What to build
The admin's main working list: one row per Participant of the Selected Turnus. The Selected Turnus is the admin's viewing choice, remembered per user, switchable from the header; it is not a business state. Rows show child name, Age on start, guardian, email, Variable symbol, payment status, amount due now and the Participant's state. Search covers child name, guardian name, email and Variable symbol. Filters for consents, documents and health come in issue 61; this issue ships a payment status filter and a filter for unverified Claimed discounts. Rows open the Registration detail (issue 43).

## Acceptance criteria
- [ ] Requires Registrations read; none gets 403.
- [ ] Only Participants of the selected Turnus and current Organisation; cross-tenant ids return nothing.
- [ ] Search by each field, case- and diacritics-insensitive.
- [ ] Payment status and unverified Claimed discount filters.
- [ ] Encrypted fields are never filtered or sorted in the database.
- [ ] Selected Turnus persisted per user.
- [ ] Health data never appears in the list.

## Notes
- Spec sections: Admin Registrations stories; Further Notes divergence "No Current Turnus".
- Port from Domino: `apps/portal/src/pages/admin/Registrations.vue`, `apps/portal/src/lib/selectedTurnus.ts`.
