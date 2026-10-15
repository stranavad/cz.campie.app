# 16 - Email pipeline: React templates, two streams

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 11
Stories: -

## What to build

Build sending: emails are React templates rendered server-side and sent through the mail port as background jobs. Mail goes from the platform's domain with the Camp's name as sender name and the Camp's contact as reply address. There are two sending streams on separate subdomains: one for login links, email verification and invitations, one for everything else. A suspended Organisation sends nothing. Per-Camp editable texts come in issue 32; this issue provides the layout, the placeholder mechanism and fixed functional parts (buttons, payment block slot, attachments).

## Acceptance criteria

- [ ] A test email is captured by the mail fake with the right sender name, reply-to and stream
- [ ] Login-type mail uses the auth stream; other mail uses the notification stream
- [ ] Mail for a suspended Organisation is not sent
- [ ] Placeholders render and unknown placeholders are rejected at template save time (mechanism only)

## Notes

- Spec sections: Emails
- Port from Domino: `apps/api/emails/components/layout.tsx`, `apps/api/emails/components/ui.tsx`, `apps/api/src/email/services/email.service.ts`
- Bounce handling is issue 68 (stage 1b)
