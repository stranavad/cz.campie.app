# 68 - Bounce and complaint handling

Status: ready-for-agent
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
