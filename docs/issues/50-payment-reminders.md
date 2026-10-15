# 50 - Payment reminders

Status: ready-for-agent
Stage: 1b
Episode: E4 Money
Blocked by: 38, 42
Stories: 117

## What to build

An admin with Registrations write sends a payment reminder to the guardians of every Registration in the Selected Turnus that has a balance, or optionally only the Overdue ones, in one action. The reminder uses the Camp's editable payment reminder email text (issue 32) with fixed functional parts: amount due now, due date, full outstanding balance, Variable symbol and QR platba. The admin sees how many Registrations will be reminded before confirming. Sending runs as background jobs and goes to both guardians, never to access emails; the per-Camp on/off switch for this email type is respected. Bulk sending is throttled per Organisation.

## Acceptance criteria

- [ ] Preview returns the number of target Registrations for 'all with a balance' and for 'Overdue only'.
- [ ] Sending queues one email per guardian of each targeted Registration; Cancelled-only Registrations and fully paid ones are excluded.
- [ ] Email contents include amount due now, due date, Variable symbol and a QR code for the Organisation's bank account.
- [ ] When the Camp switched the payment reminder off, nothing is sent and the admin is told so.
- [ ] Admin with Registrations read or none gets 403; another Organisation's Turnus id yields 404.
- [ ] The action is audited with the number of Registrations reminded.
- [ ] Undeliverable addresses (issue 68) are skipped once that issue lands.

## Notes

- Spec sections: Payments (reminders, Overdue); Emails.
- Port from Domino: reminder sending in `apps/api/src/admin-registration/services/admin-registration.service.ts` and `apps/api/src/email/services/email.service.ts`.
- No scheduled reminders; admin-triggered only.
