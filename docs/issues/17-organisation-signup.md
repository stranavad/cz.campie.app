# 17 - Organisation signup

Status: ready-for-agent
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 10, 14, 16
Stories: 1, 13, 14, 15, 16, 19

## What to build

Let an Owner sign up on the main host without contact with anyone: legal identity (name, IČO, address, statutory representative), contact and billing details, a subdomain, a password, and acceptance of the terms and data processing agreement with the accepted versions, time and user recorded. Subdomains are lowercase letters, digits and hyphens, unique, and not on the reserved list (`www`, `app`, `api`, `admin`, `mail`, `static`, `cdn`, `status`, `help`, `docs`, `blog` and the configured product name). The new Organisation starts as pending approval, gets its data key, and one Camp is created automatically. The signer becomes the first Owner. The platform operator is notified by email. The signup page links to the public data and processors page.

## Acceptance criteria

- [ ] Signup creates the Organisation (pending), its data key, one Camp and an Owner membership
- [ ] Reserved, malformed and taken subdomains are rejected with Czech messages
- [ ] Accepted terms and DPA versions are stored with time and user
- [ ] The operator receives a notification email
- [ ] The Owner can log in and sees a clear 'waiting for approval' state

## Notes

- Spec sections: Tenancy, Other (signup records terms)
- Subdomain becomes fixed at approval; until then the operator may change it (issue 21)
- Rate limiting is issue 22
