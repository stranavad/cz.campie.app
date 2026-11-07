# 32 - Email texts, notification recipients, contact-edit lock date

Status: done
Stage: 1a
Episode: E2 Camp setup
Blocked by: 16, 24
Stories: 55, 56, 57, 58

## What to build

Per-Camp email configuration. For each guardian email type the admin with Camp settings write edits subject and text with placeholders (e.g. child names, Turnus, amount due now, due date, Variable symbol, camp contact) and switches it on or off; the login link cannot be switched off. Functional parts (payment details with QR, login button, attachments) are fixed by the platform and always rendered. The admin sets which addresses receive the new-Registration notification, and the Camp's contact-edit lock date (until which guardians may edit contact details and fill new form fields). A preview renders an email with sample data.

## Acceptance criteria

- [x] Every email type from the spec has a default subject and text in Czech via the platform's translation files.
- [x] Edited subject and text are stored per Camp; unknown placeholders are rejected on save.
- [x] Switching a type off makes the email pipeline skip it (verified with the mail fake); the login link type has no off switch.
- [x] Preview endpoint returns rendered HTML with sample data.
- [x] Notification recipients validated as emails; lock date stored per Camp.
- [x] Tenant isolation, audit.

## Notes

- Spec sections: Emails; story 55.
- Port from Domino: `apps/api/emails/` (templates, `components/layout.tsx`) for the fixed parts.
- Sending itself and the two mail streams are issue 16.

## Comments

2026-11-07 - **Implemented.** The Camp settings page has an E-maily section (each type's subject and text, whether it is sent, reset to the default, and a preview with made-up data) and the Camp form takes the notification recipients (one per line, at most 10) and the contact-edit lock date.

- Types and defaults: `EMAIL_TYPES` and `EMAIL_TYPE_SPECS` in `@repo/schema/emails` (stream, audience, whether it can be switched off, placeholders, Czech default subject and text). The defaults are platform constants there rather than translation files: the API has no translation layer, and both apps read them from one place. A test checks every default uses only its type's placeholders.
- `camp_email_texts` holds a Camp's own wording and switch per type; without a row the default is sent. `GET /camps/:campId/email-texts`, `PUT`/`DELETE .../email-texts/:type` (write, audited as `camp_email_text.update`/`.remove`), `POST .../email-texts/:type/preview` (read; HTML shown in a sandboxed iframe). Unknown placeholders in the subject or text answer 400 `email_placeholders_unknown` (the form names them with `unknownPlaceholders`); the login link cannot be switched off (`email_type_required`); a subject must be one line, and `EmailService` keeps every subject on one line.
- `CampEmailService.send(campId, type, message)` sends a type as the Camp worded it, filling the Camp's name and contact itself, from the Camp with its contact (else the Organisation's) as reply address; it skips a type switched off, and sends the team notification to the Camp's recipients, skipping it while there are none. Callers pass the other placeholder values, the guardians and the fixed parts (a login link, the payment block).
- The preview shows the subject and the body with sample data; the payment block comes with issue 36.
