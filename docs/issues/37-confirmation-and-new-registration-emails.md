# 37 - Confirmation and new-Registration emails

Status: done
Stage: 1a
Episode: E3 Public registration
Blocked by: 32, 36
Stories: 58, 73

## What to build

After the Přihláška PDFs exist, a job sends the registration confirmation to both guardians with the Camp's edited subject and text, the fixed payment block (amount due now, due date, full balance, Variable symbol, account, QR code) and the Přihláška PDFs attached. A separate notification of the new Registration goes to the Camp's configured recipients. Mail is sent from the platform's notification stream with the Camp's name as sender name and the Camp's contact as reply address. Switched-off types are not sent. A suspended Organisation sends nothing.

## Acceptance criteria

- [x] Mail fake captures one confirmation per guardian address with all PDFs attached and the QR image.
- [x] Placeholders rendered with real values; payment block present even when the camp's text omits payment details.
- [x] Switched-off confirmation: no guardian mail; notification still sent if on.
- [x] Notification goes only to configured recipients; access emails receive nothing.
- [x] Sender name and reply-to taken from the Camp.
- [x] Suspended Organisation: nothing sent.

## Notes

- Spec sections: Emails.
- Port from Domino: `apps/api/emails/confirmation.tsx`, `apps/api/src/email/services/email.service.ts`.

## Comments

2026-11-07 - **From issue 35.** The team notification (`new_registration_notification`) is already sent from the submission's job through `CampEmailService.send` (`RegistrationService.notifyTeam`), covered in `registration.integration.test.ts`. The guardian confirmation still needs the PDFs, so chain it after issue 36's job; guardians are `registration_guardians` (position 1 and 2).

2026-11-07 - **Done.** Once the Přihlášky job stored the PDFs of a new Registration, it enqueues `registrations.send-confirmation` once per guardian (`modules/registrations/confirmation/`). Each job sends one guardian the Camp's `registration_confirmation` wording (`{{deti}}`, `{{turnus}}`, `{{castka}}` and `{{splatnost}}` of the amount due now, `{{variabilni_symbol}}`) with the platform's fixed payment block below it (account, Variable symbol, amount due now with its date, the rest and the whole outstanding amount after a Deposit, the QR platba as an inline `cid:` PNG) and every Přihláška attached. The mail port and `EmailService` take inline images (`inlineImages`, Resend's `contentId`). The team notification has been sent since issue 35. A Přihlášky job that runs again after succeeding generates nothing and sends nothing. Payment instructions for documents and emails come from one helper (`modules/registrations/payment/payment-instructions.helper.ts`); `paid` is 0 until the ledger (issue 38) exists. Access emails do not exist yet, so they receive nothing.
