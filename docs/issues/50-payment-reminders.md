# 50 - Payment reminders

Status: done
Stage: 1b
Episode: E4 Money
Blocked by: 38, 42
Stories: 117

## What to build

An admin with Registrations write sends a payment reminder to the guardians of every Registration in the Selected Turnus that has a balance, or optionally only the Overdue ones, in one action. The reminder uses the Camp's editable payment reminder email text (issue 32) with fixed functional parts: amount due now, due date, full outstanding balance, Variable symbol and QR platba. The admin sees how many Registrations will be reminded before confirming. Sending runs as background jobs and goes to both guardians, never to access emails; the per-Camp on/off switch for this email type is respected. Bulk sending is throttled per Organisation.

## Acceptance criteria

- [x] Preview returns the number of target Registrations for 'all with a balance' and for 'Overdue only'.
- [x] Sending queues one email per guardian of each targeted Registration; Cancelled-only Registrations and fully paid ones are excluded.
- [x] Email contents include amount due now, due date, Variable symbol and a QR code for the Organisation's bank account.
- [x] When the Camp switched the payment reminder off, nothing is sent and the admin is told so.
- [x] Admin with Registrations read or none gets 403; another Organisation's Turnus id yields 404.
- [x] The action is audited with the number of Registrations reminded.
- [ ] Undeliverable addresses (issue 68) are skipped once that issue lands.

## Notes

- Spec sections: Payments (reminders, Overdue); Emails.
- Port from Domino: reminder sending in `apps/api/src/admin-registration/services/admin-registration.service.ts` and `apps/api/src/email/services/email.service.ts`.
- No scheduled reminders; admin-triggered only.

## Comments

2026-11-07 - **Done.** `GET /turnusy/:turnusId/payment-reminders` counts the Registrations with a Registered child and a balance, the Overdue ones among them, and says whether the Camp sends the reminder; `POST` with `{ overdueOnly }` enqueues `registrations.send-payment-reminder` per guardian (never access emails), audits `payment_reminder.send` on the Turnus with `overdueOnly` and `reminded`, and answers 409 `payment_reminder_switched_off` when the Camp switched it off. Both take Registrations write; a send is counted per Organisation (`PAYMENT_REMINDER_LIMIT_PER_ORGANISATION` per window). The job skips a Registration paid or cancelled meanwhile and names only Registered children; the email carries the payment block (amount due now, due date, the rest, Variable symbol, QR platba). `LedgerService.balancesOf` now derives a Turnus's balances for the list, the export and the reminders alike. Participants page: "Připomenout platby" with the count before a confirming click (Registrations write only). The undeliverable-address criterion waits for issue 68.
