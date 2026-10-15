# 37 - Confirmation and new-Registration emails

Status: ready-for-agent
Stage: 1a
Episode: E3 Public registration
Blocked by: 32, 36
Stories: 58, 73

## What to build

After the Přihláška PDFs exist, a job sends the registration confirmation to both guardians with the Camp's edited subject and text, the fixed payment block (amount due now, due date, full balance, Variable symbol, account, QR code) and the Přihláška PDFs attached. A separate notification of the new Registration goes to the Camp's configured recipients. Mail is sent from the platform's notification stream with the Camp's name as sender name and the Camp's contact as reply address. Switched-off types are not sent. A suspended Organisation sends nothing.

## Acceptance criteria

- [ ] Mail fake captures one confirmation per guardian address with all PDFs attached and the QR image.
- [ ] Placeholders rendered with real values; payment block present even when the camp's text omits payment details.
- [ ] Switched-off confirmation: no guardian mail; notification still sent if on.
- [ ] Notification goes only to configured recipients; access emails receive nothing.
- [ ] Sender name and reply-to taken from the Camp.
- [ ] Suspended Organisation: nothing sent.

## Notes

- Spec sections: Emails.
- Port from Domino: `apps/api/emails/confirmation.tsx`, `apps/api/src/email/services/email.service.ts`.
