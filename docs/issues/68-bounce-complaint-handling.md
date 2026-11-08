# 68 - Bounce and complaint handling

Status: done
Stage: 1b
Episode: E3 Public registration
Blocked by: 16, 42
Stories: -

## What to build

Consume bounce and complaint notifications from the mail provider (fake in tests) and mark the affected address undeliverable. Admins see a badge on the Registration and in the list; guardians see a portal banner asking them to correct their email. Further non-login emails to that address are skipped; login links are always attempted. Changing the address clears the mark. The operator console shows each Organisation's bounce and complaint rate. Mail stays split into two sending streams (login and invitations vs everything else).

## Acceptance criteria

- [ ] A hard bounce or complaint notification marks the address undeliverable for every Registration in that Organisation using it.
- [ ] Non-login sends to it are skipped and recorded as skipped; login links still go out.
- [ ] Changing the email (issue 41 or admin edit) clears the mark.
- [ ] The console shows per-Organisation bounce rate without exposing addresses.
- [ ] Webhook authenticity is verified before acting.

## Notes

- Spec sections: Emails.

## Comments

2026-11-07 - **From issue 50.** Payment reminders are sent one job per guardian by `LedgerService.sendPaymentReminder` (`modules/registrations/ledger/services/ledger.service.ts`); skip undeliverable addresses there (or in `CampEmailService.send` for every guardian email).

2026-11-07 - **Done.** Every message `EmailService.send` sends for an Organisation carries the Organisation's id as a Resend tag. Resend's webhook posts to `POST /api/webhooks/mail` (a new `webhook` access kind: no CSRF header, raw body); `MailSender.readNotification` verifies the Svix signature (`RESEND_WEBHOOK_SECRET`, 5-minute replay window) before anything is read, and answers a forged or stale one with 401. A hard bounce (`email.bounced` with bounce type `Permanent`), a suppression (`email.suppressed`) or a complaint (`email.complained`) of a message to a single recipient marks it in that Organisation's `undeliverable_emails`, audited as the system; soft bounces, other events and messages to several recipients (a Camp team's mail, where the bounced one cannot be told apart) are accepted and ignored. `EmailService.send` leaves marked addresses out of `notification` mail and counts them as skipped; `auth` mail (login links, email change links, invitations) always goes. An admin changing a guardian's email or adding a Camp team address, or a guardian confirming a new email by its link, clears that address's mark (audited). Admins see "E-mail nedoručitelný" in the participant list and on the Registration detail (guardians and access emails); the portal shows a banner on the Registration. The console shows each Organisation's sent, bounced and complained counts with the rate (`mail_statistics`, counts only), highlighted past 2 % bounces or 0.1 % complaints once 50 messages went out. Locally and in tests, notifications are signed with `signFakeMailNotification`.

2026-11-08 - **Decision by the project lead: admins can clear an undeliverable mark by hand.** Registrations write, the area that owns guardian contact data (changing a guardian or an access email takes it too): `POST /registrations/:id/clear-undeliverable` with the `email` clears the mark of one of that Registration's guardian or access email addresses through `UndeliverableEmailService.clear` (audited `undeliverable_email.clear`, actor admin) and answers the detail; an address the Registration does not have answers 404, so no other family's or Camp team's mark can be cleared from it. The Registration detail shows "Zrušit značku nedoručitelnosti" next to the badge of a guardian and of an access email.
