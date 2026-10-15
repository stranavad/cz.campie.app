# 14 - Cookie sessions, CSRF, Organisation resolution

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 08, 13
Stories: 79, 90

## What to build

Implement ADR-0001 in the API. Sessions are httpOnly, Secure, SameSite=Lax cookies: admin cookies for the main host, guardian cookies for the exact Organisation subdomain. Mutating requests must also carry a custom header against CSRF. Resolve the current Organisation per request: from the forwarded original host for public and guardian requests (a guardian session's Organisation must match the host), from an explicit header checked against membership for admin requests, from the URL path for gateway notifications. The resolved Organisation opens the unit of work from issue 07. Unknown, suspended or unapproved subdomains are handled per the spec later; this issue only resolves and rejects unknown ones.

## Acceptance criteria

- [ ] A guardian session issued for Organisation A is rejected on Organisation B's host
- [ ] An admin request naming an Organisation the admin has no membership in is rejected
- [ ] A mutating request without the CSRF header is rejected
- [ ] Cookies carry httpOnly, Secure, SameSite=Lax and the right host scope
- [ ] An unknown subdomain returns not-found

## Notes

- Spec sections: Tenancy, Identity, permissions and audit
- ADR-0001
- Port from Domino: guard structure in `apps/api/src/guards/` (Domino uses bearer tokens; this replaces that)
