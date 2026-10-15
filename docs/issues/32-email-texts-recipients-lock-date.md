# 32 - Email texts, notification recipients, contact-edit lock date

Status: ready-for-agent
Stage: 1a
Episode: E2 Camp setup
Blocked by: 16, 24
Stories: 55, 56, 57, 58

## What to build

Per-Camp email configuration. For each guardian email type the admin with Camp settings write edits subject and text with placeholders (e.g. child names, Turnus, amount due now, due date, Variable symbol, camp contact) and switches it on or off; the login link cannot be switched off. Functional parts (payment details with QR, login button, attachments) are fixed by the platform and always rendered. The admin sets which addresses receive the new-Registration notification, and the Camp's contact-edit lock date (until which guardians may edit contact details and fill new form fields). A preview renders an email with sample data.

## Acceptance criteria

- [ ] Every email type from the spec has a default subject and text in Czech via the platform's translation files.
- [ ] Edited subject and text are stored per Camp; unknown placeholders are rejected on save.
- [ ] Switching a type off makes the email pipeline skip it (verified with the mail fake); the login link type has no off switch.
- [ ] Preview endpoint returns rendered HTML with sample data.
- [ ] Notification recipients validated as emails; lock date stored per Camp.
- [ ] Tenant isolation, audit.

## Notes

- Spec sections: Emails; story 55.
- Port from Domino: `apps/api/emails/` (templates, `components/layout.tsx`) for the fixed parts.
- Sending itself and the two mail streams are issue 16.
