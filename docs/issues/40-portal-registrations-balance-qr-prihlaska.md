# 40 - Portal: Registrations, balance, QR, Přihláška

Status: ready-for-agent
Stage: 1a
Episode: E5 Guardian portal
Blocked by: 36, 38, 39
Stories: 80, 81, 83, 89

## What to build
The guardian portal home lists all the guardian's Registrations at this Organisation, past ones included, grouped by Camp and Turnus. Each Registration shows its Participants, price breakdown, payments, balance, the amount due now with its date and the full balance as a second option, the Variable symbol, account number and a QR code. Each Participant's Přihláška PDF can be opened through a short-lived download link. The camp's contact is shown for questions and a separate link for technical problems. Cancelled Participants are shown as cancelled.

## Acceptance criteria
- [ ] Endpoint returns only the session's accessible Registrations; other families' ids return 404.
- [ ] Amounts match the ledger derivations of issue 38.
- [ ] QR payload for amount due now and for the full balance.
- [ ] Přihláška download via a short-lived link that fails after expiry and for other guardians.
- [ ] Health data never appears in these responses.
- [ ] Phone-width layout, strings through i18n.

## Notes
- Spec sections: Guardian portal stories; Payments; Files.
- Port from Domino: `apps/portal/src/pages/parent/Dashboard.vue`, `Registration.vue` (UI reference).
- Card payment from the portal comes in issue 49.
