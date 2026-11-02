# 16 - Email pipeline: React templates, two streams

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: 11
Stories: -

## What to build

Build sending: emails are React templates rendered server-side and sent through the mail port as background jobs. Mail goes from the platform's domain with the Camp's name as sender name and the Camp's contact as reply address. There are two sending streams on separate subdomains: one for login links, email verification and invitations, one for everything else. A suspended Organisation sends nothing. Per-Camp editable texts come in issue 32; this issue provides the layout, the placeholder mechanism and fixed functional parts (buttons, payment block slot, attachments).

## Acceptance criteria

- [x] A test email is captured by the mail fake with the right sender name, reply-to and stream
- [x] Login-type mail uses the auth stream; other mail uses the notification stream
- [x] Mail for a suspended Organisation is not sent
- [x] Placeholders render and unknown placeholders are rejected at template save time (mechanism only)

## Notes

- Spec sections: Emails
- Port from Domino: `apps/api/emails/components/layout.tsx`, `apps/api/emails/components/ui.tsx`, `apps/api/src/email/services/email.service.ts`
- Bounce handling is issue 68 (stage 1b)

## Comments

2026-11-02 - **Done.** `core/emails/` holds the one pipeline: a React template, rendered with `@react-email/render` (HTML and the plain-text part), the `MailSender` port.

- Templates: `defineEmail({ stream, subject, render })`; `render` wraps its content in `EmailLayout` and gets the `brand` (sender name, contact, accent colour) from `EmailService`. `emails.send(template, props, { to, sender, attachments })` is called from a feature's job inside its Organisation's unit of work; attachments are file ids, read and decrypted through `FileService` (`read` now also returns the name). One call is one message, so a job sending once never repeats a mail on retry.
- Streams: the template declares `auth` or `notification`; the From address comes from `MAIL_AUTH_FROM` / `MAIL_NOTIFICATION_FROM`, which the config refuses on the same domain. The display name is always quoted and stripped of line breaks, since it is an admin's text.
- Suspension: `organisations.status` (`pending` default, `approved`, `suspended`; tuple in `@repo/schema/organisations`) is new. A suspended Organisation's mail is skipped and logged, the job completes and does not retry. Issue 21 sets the status.
- Placeholders: `@repo/schema/emails` has `fillPlaceholders` and `unknownPlaceholders` (`{{ name }}`, spaces allowed; anything in double braces counts, and a stray `{{` or `}}` is reported as itself, so a typo is caught on save). `EmailText` splits the admin's paragraphs and lines first and fills placeholders after, as escaped text, so a value adds neither paragraphs nor markup. Issue 32 calls `unknownPlaceholders` on save.
- Fixed parts: `EmailAction` (button, fixed dark colour so any accent stays legible), the layout's `payment` slot below the text, attachments on the port (`MailMessage.attachments`, logged by name and size in the log adapter).
- Tests: `core/emails/emails.integration.test.ts` sends the samples (`src/testing/sample-emails.tsx`) through a drained job: sender name, reply-to and notification stream, auth stream for the login sample, placeholders escaped, attachments decrypted, nothing for a suspended Organisation, the quoted sender name. Pure tests for placeholders in `packages/schema`; a config test for the two streams' domains.
- Assumed, to confirm:
  - The sender (Camp name and contact) is passed by the caller, since Camps don't exist yet. Issue 24 or 32 may load it from a Camp id instead. For login links, which belong to the Organisation rather than a Camp, the caller decides.
  - Stream addresses are configured per environment (`prihlaseni@auth.<domain>`, `info@posta.<domain>` in the examples); the deployment needs both set and both domains verified in Resend.
  - No logo in emails: a data URL is blocked by most clients, and a hosted logo needs the public serving from issue 23.
  - Only Organisation mail. Platform mail (the operator notification in issue 17) needs a path without an Organisation's unit of work.
- Open for later: a retry after a successful send whose unit of work then fails to commit repeats the mail. Resend idempotency keys would close that if it matters.
- Local setup: the migration adds `organisations.status` with a default, so existing local data migrates as is.
