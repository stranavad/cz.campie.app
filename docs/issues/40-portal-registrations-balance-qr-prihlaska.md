# 40 - Portal: Registrations, balance, QR, Přihláška

Status: done
Stage: 1a
Episode: E5 Guardian portal
Blocked by: 36, 38, 39
Stories: 80, 81, 83, 89

## What to build

The guardian portal home lists all the guardian's Registrations at this Organisation, past ones included, grouped by Camp and Turnus. Each Registration shows its Participants, price breakdown, payments, balance, the amount due now with its date and the full balance as a second option, the Variable symbol, account number and a QR code. Each Participant's Přihláška PDF can be opened through a short-lived download link. The camp's contact is shown for questions and a separate link for technical problems. Cancelled Participants are shown as cancelled.

## Acceptance criteria

- [x] Endpoint returns only the session's accessible Registrations; other families' ids return 404.
- [x] Amounts match the ledger derivations of issue 38.
- [x] QR payload for amount due now and for the full balance.
- [x] Přihláška download via a short-lived link that fails after expiry and for other guardians.
- [x] Health data never appears in these responses.
- [x] Phone-width layout, strings through i18n.

## Notes

- Spec sections: Guardian portal stories; Payments; Files.
- Port from Domino: `apps/portal/src/pages/parent/Dashboard.vue`, `Registration.vue` (UI reference).
- Card payment from the portal comes in issue 49.

2026-11-07 - **Done.** `GET /portal/registrations` returns the guardian's Registrations at the Organisation, newest first, past ones included, each with its Camp (contact falling back to the Organisation's, `campContactOf`), Turnus, Participants (status, position, a 5-minute Přihláška download link), frozen price lines, Price adjustment amounts (not their notes, which are the camp's own), payments (amount and date, not the note), the ledger's total, paid, balance, status and Overdue, and the payment: amount due now with its date and QR platba payload, and while Deposits are owed the rest with its date and everything at once with its own QR platba (`paymentInstructionsOf` gained the second payload). `technicalContact` is `PLATFORM_OPERATOR_EMAIL`. The portal page groups by Turnus, draws the QR codes in the browser (`qrcode`), refetches every 4 minutes so the links stay valid, and fits a phone. No health data exists in these responses; a test pins the keys a guardian sees.

## Comments

2026-11-08 - **Decisions by the project lead (issue 38).** The portal reads each Registration's stored due dates, so editing the Turnus no longer moves what a guardian sees as due; it names the new `partly_paid` status (Částečně zaplaceno); the second QR platba for all outstanding, shown only while it differs from the amount due now, is unchanged.
