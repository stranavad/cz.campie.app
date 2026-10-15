# 67 - TOTP for admins and enforcement

Status: ready-for-agent
Stage: 1b
Episode: E1 Organisations and identity
Blocked by: 18, 21
Stories: -

## What to build

Any admin can turn on two-step login with TOTP for their own account and receives one-time recovery codes. An Owner can enforce TOTP for the Organisation; members without it must set it up at their next login before reaching anything else. An Owner can reset a member's TOTP. A locked-out Owner is reset by the platform operator from the console after an identity check outside the platform. Reuse the TOTP implementation already built for operators (issue 21).

## Acceptance criteria

- [ ] Enabling requires a valid code; login then requires a code or an unused recovery code; a recovery code works once.
- [ ] With enforcement on, a member without TOTP can only reach the setup endpoints until set up.
- [ ] An Owner resetting a member's TOTP is audited and emails the member.
- [ ] The operator reset is available only in the console and is audited in the Organisation's log.
- [ ] Failed code attempts count toward the failed-attempt limit.

## Notes

- Spec sections: Identity, permissions and audit (Two-step login).
- Admin identity is global; enforcement applies when the member logs in to that Organisation.
