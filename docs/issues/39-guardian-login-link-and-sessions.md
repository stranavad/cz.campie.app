# 39 - Guardian login link and sessions

Status: ready-for-agent
Stage: 1a
Episode: E5 Guardian portal
Blocked by: 14, 16, 35
Stories: 78, 79, 86, 90, 98

## What to build
Guardians log in to `/portal` on the Organisation's subdomain with a link sent by email, valid for 30 minutes and single use. The request always answers the same way whether or not the address has Registrations. Using the link creates a session cookie scoped to that subdomain and bound to the Organisation (ADR-0001). Access is derived on each request from the guardian emails and access emails on Registrations in that Organisation; both guardians have equal rights. A session presented to another Organisation's host is rejected. Login links go through the auth mail stream and cannot be switched off.

## Acceptance criteria
- [ ] Unknown email: same response and no mail; known email: one login mail via the auth stream (mail fake).
- [ ] Link expires after 30 minutes (Clock) and cannot be reused.
- [ ] Session cookie is httpOnly, Secure, SameSite=Lax, host-only on the subdomain.
- [ ] Session used against another Organisation's host: 401.
- [ ] Guardian sees only Registrations where their email is a guardian or access email; guessing another Registration's id returns 404.
- [ ] Removing an email from a Registration revokes access on the next request.
- [ ] Rate limited (issue 22); login recorded in the audit log.

## Notes
- Spec sections: Identity, permissions and audit; Emails.
- Port from Domino: `apps/api/src/parent-auth/` and `apps/api/emails/magic-link.tsx` (Domino uses bearer tokens in localStorage; here cookies, ADR-0001).
