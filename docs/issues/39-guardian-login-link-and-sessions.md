# 39 - Guardian login link and sessions

Status: done
Stage: 1a
Episode: E5 Guardian portal
Blocked by: 14, 16, 35
Stories: 78, 79, 86, 90, 98

## What to build

Guardians log in to `/portal` on the Organisation's subdomain with a link sent by email, valid for 30 minutes and single use. The request always answers the same way whether or not the address has Registrations. Using the link creates a session cookie scoped to that subdomain and bound to the Organisation (ADR-0001). Access is derived on each request from the guardian emails and access emails on Registrations in that Organisation; both guardians have equal rights. A session presented to another Organisation's host is rejected. Login links go through the auth mail stream and cannot be switched off.

## Acceptance criteria

- [x] Unknown email: same response and no mail; known email: one login mail via the auth stream (mail fake).
- [x] Link expires after 30 minutes (Clock) and cannot be reused.
- [x] Session cookie is httpOnly, Secure, SameSite=Lax, host-only on the subdomain.
- [x] Session used against another Organisation's host: 401.
- [x] Guardian sees only Registrations where their email is a guardian or access email; guessing another Registration's id returns 404.
- [x] Removing an email from a Registration revokes access on the next request.
- [x] Rate limited (issue 22); login recorded in the audit log.

## Notes

- Spec sections: Identity, permissions and audit; Emails.
- Port from Domino: `apps/api/src/parent-auth/` and `apps/api/emails/magic-link.tsx` (Domino uses bearer tokens in localStorage; here cookies, ADR-0001).

## Comments

2026-11-07 - **From issue 22.** Login-link requests must be rate limited: add `LOGIN_LINK_LIMIT_PER_IP` and `LOGIN_LINK_LIMIT_PER_EMAIL` to `requestLimits` in `env.schema.ts` and call `RateLimiter.admit` first in the request service, counting unknown emails alike (see `apps/api/AGENTS.md`, Access and sessions).

2026-11-07 - **From issue 35.** Guardians of a Registration are `registration_guardians` (email lowercased by the form engine, position 1 the submitter). There is no index on their email yet; add one with the login lookup.

2026-11-07 - **Done.** `POST /portal/login-links` (public) records a `guardian_login_requests` row and enqueues `portal.login-link-requested` for every email, known or not, so the answer and its timing are the same; the job takes the request, finds the guardian's latest Registration in the Organisation and emails a 30-minute, single-use link from its Camp (`login_link`, auth stream). Only the token's SHA-256 is stored (`guardian_login_links`). `POST /portal/session` uses the link atomically, stops the guardian's other links, ends a session the browser already held, starts the guardian session (`__Host-guardian_session`, httpOnly, Secure, Lax, host-only, 7 days) and audits `guardian_login_link.use` with the guardian as actor; `DELETE /portal/session` signs out. Requests are limited per IP and per Organisation and email (`LOGIN_LINK_LIMIT_PER_IP`, `LOGIN_LINK_LIMIT_PER_EMAIL`). `GET /portal/registrations` and `/portal/registrations/:id` (guardian) show the Registrations whose guardian emails include the signed-in one, read on every request (`@RequestGuardianEmail`); guardian emails are lowercase by a CHECK. Frontend: `/portal/prihlaseni` asks for a link and, from a link, signs in on a click (not on load, against login CSRF and mail scanners); `/portal` lists the Registrations and signs out. Access emails do not exist yet; add them to `listByGuardian`/`getByGuardian` when they arrive.

2026-11-08 - **Project lead follow-up.** Hourly housekeeping (`modules/housekeeping/`) removes guardian sessions, login links (used or not) and email changes a day past their expiry, and login requests whose job never took them a day after they were made (by the UUIDv7 time of their id), each Organisation in its own unit of work; on the platform, admin sessions and password resets a day past expiry and invitations 30 days past (so an Owner still sees an expired one for a while).
