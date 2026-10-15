# 18 - Admin password auth

Status: ready-for-agent
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 14, 16
Stories: -

## What to build

Admins log in on the main host with email and password. Admin identity is global (one email, one account). Passwords have a minimum strength, are hashed with a modern algorithm, and failed attempts are limited per account and per IP. A forgotten password is reset through an emailed link. A successful login issues the admin session cookie from issue 14. TOTP comes later (issue 67), except for operators (issue 21).

## Acceptance criteria

- [ ] Correct credentials produce an admin session cookie; wrong ones do not, with a generic message
- [ ] After the configured number of failed attempts, further attempts are blocked for a period
- [ ] Password reset by email works once and expires
- [ ] Weak passwords are rejected

## Notes

- Spec sections: Identity, permissions and audit
- Port from Domino: `apps/api/src/auth/services/auth.service.ts` (bcrypt login flow)
