# 14 - Cookie sessions, CSRF, Organisation resolution

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: 08, 13
Stories: 79, 90

## What to build

Implement ADR-0001 in the API. Sessions are httpOnly, Secure, SameSite=Lax cookies: admin cookies for the main host, guardian cookies for the exact Organisation subdomain. Mutating requests must also carry a custom header against CSRF. Resolve the current Organisation per request: from the forwarded original host for public and guardian requests (a guardian session's Organisation must match the host), from an explicit header checked against membership for admin requests, from the URL path for gateway notifications. The resolved Organisation opens the unit of work from issue 07. Unknown, suspended or unapproved subdomains are handled per the spec later; this issue only resolves and rejects unknown ones.

## Acceptance criteria

- [x] A guardian session issued for Organisation A is rejected on Organisation B's host
- [x] An admin request naming an Organisation the admin has no membership in is rejected
- [x] A mutating request without the CSRF header is rejected
- [x] Cookies carry httpOnly, Secure, SameSite=Lax and the right host scope
- [x] An unknown subdomain returns not-found

## Notes

- Spec sections: Tenancy, Identity, permissions and audit
- ADR-0001
- Port from Domino: guard structure in `apps/api/src/guards/` (Domino uses bearer tokens; this replaces that)

## Comments

2026-11-01 - **Done.** `core/access/` resolves every request; `core/sessions/` issues the sessions and cookies.

- Access: `@Access(kind)` on every controller, one of `public`, `guardian`, `admin`, `platform` (main host, no Organisation: signup and login), `gateway` (Organisation from the `:organisationId` path) and `unscoped` (health, download links). The app refuses to boot with a controller that declares none. A global guard checks CSRF and resolves the Organisation and actor; a global interceptor runs the route in that Organisation's unit of work (a platform one for `platform`). `@RequestActor()` gives the admin or guardian for audit.
- Host: `PLATFORM_DOMAIN` (new env variable) with `app.<domain>` as the main host. The API reads the last `X-Forwarded-Host` entry (the one our proxy appended), else `Host`. Unknown subdomains, nested ones and foreign hosts answer 404 `organisation_unknown`.
- CSRF: every request other than GET, HEAD and OPTIONS must carry `x-csrf-protection`, or it gets 403 `csrf_header_missing`. Gateway routes are exempt. Header names and codes are in `@repo/schema/shared` for the app's request hooks.
- Sessions: stored in the database, with only the SHA-256 of a random 256-bit token kept. Cookies are `__Host-admin_session` and `__Host-guardian_session`: httpOnly, Secure, SameSite=Lax, Path=/, no Domain, so the browser keeps each to its exact host. Guardian sessions are an RLS table looked up in the host's Organisation, with an explicit Organisation comparison on top. A session of Organisation A on B's host is 401. Admins, memberships and admin sessions are platform tables. A membership is checked for the Organisation named in `x-organisation-id`: missing, malformed or foreign is 403.
- Minimal tables for later issues to extend: `organisations.subdomain` (17 adds validation and the reserved list), `admins` (id and email; 18 adds the password), `memberships` (19 adds permission areas and Owner), `admin_sessions` and `guardian_sessions` (39 adds the login link). `AdminService` and `MembershipService` exist only for fixtures so far and write no audit entry yet; the first real caller (signup) adds it.
- Tests: `core/access/access.integration.test.ts` covers every acceptance criterion, plus gateway resolution and the boot refusal. The files, audit and tenant-isolation tests now use real admin sessions (`createAdmin(app, { memberOf }).headers(organisationId)`) instead of the `x-test-organisation` stand-in.
- Assumed, to confirm: admin sessions last 12 hours and guardian sessions 7 days, fixed and not extended by use. The spec sets neither; issue 39 may change the guardian one.
- Open for later:
  - That Vercel's external rewrite sends `X-Forwarded-Host` is still unconfirmed; Vercel's docs don't say. Check it on the first deployment.
  - No `trust proxy` is set, so behind the proxy `request.ip`, and with it the audit IP, is the proxy's address. Decide it with backend hosting and rate limiting (issue 22).
  - The unit of work opens before route interceptors, so an upload's transaction stays open while its body arrives.
  - A guardian request uses three short transactions (host lookup, session lookup, route).
- Local setup: a local env file needs `PLATFORM_DOMAIN=localhost` (now in the example file and Compose). The migration adds `subdomain` as NOT NULL, so a local database that already holds Organisations needs a reset.
