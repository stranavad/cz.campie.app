# 17 - Organisation signup

Status: done
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 10, 14, 16
Stories: 1, 13, 14, 15, 16, 19

## What to build

Let an Owner sign up on the main host without contact with anyone: legal identity (name, IČO, address, statutory representative), contact and billing details, a subdomain, a password, and acceptance of the terms and data processing agreement with the accepted versions, time and user recorded. Subdomains are lowercase letters, digits and hyphens, unique, and not on the reserved list (`www`, `app`, `api`, `admin`, `mail`, `static`, `cdn`, `status`, `help`, `docs`, `blog` and the configured product name). The new Organisation starts as pending approval, gets its data key, and one Camp is created automatically. The signer becomes the first Owner. The platform operator is notified by email. The signup page links to the public data and processors page.

## Acceptance criteria

- [x] Signup creates the Organisation (pending), its data key, one Camp and an Owner membership
- [x] Reserved, malformed and taken subdomains are rejected with Czech messages
- [x] Accepted terms and DPA versions are stored with time and user
- [x] The operator receives a notification email
- [x] The Owner can log in and sees a clear 'waiting for approval' state

## Notes

- Spec sections: Tenancy, Other (signup records terms)
- Subdomain becomes fixed at approval; until then the operator may change it (issue 21)
- Rate limiting is issue 22

## Comments

2026-11-02 - **Done.** `POST /api/organisations` signs an Organisation up in one transaction; `GET /api/account` shows the signed-in admin their Organisation and its status; the main host has the signup page (`/registrace-organizace`) and, at `/`, the "waiting for approval" state.

- Contracts: this is the first endpoint, so it brings the contract layer. `defineEndpoint` and the `Endpoint*` types in `@repo/schema/shared` (the compiler checks that `:params` are declared); `@Endpoint`, `@EndpointBody/Params/Query` in `core/http/`, with the global `StandardSchemaValidationPipe` and a route interceptor that passes every answer through its response schema inside the unit of work (a mismatch is a 500 and rolls back). In the app: `apiClient`, `ApiError` kinds, request hooks (CSRF header on mutations), the retry policy, the `core/form` module on TanStack Form, and shadcn `button`, `input`, `label`, `field`, `checkbox` (copied from the Koala42 template, with its lint override for `components/ui/`).
- Signup (`OrganisationService.signUp`): checks the legal versions, the subdomain and the email first, hashes the password, then creates the Organisation (pending) with its data key, the admin, the two `legal_acceptances` rows (document, version, time, admin), enters the new Organisation with `unitOfWork.enter()` and writes, audited as the new admin: the Organisation, the admin, both acceptances, the first Camp and the Owner membership. It answers 204 with the admin session cookie, and the operator job is enqueued after commit.
- Subdomains: `subdomainProblem()` in `@repo/schema/organisations` (DNS label, no double hyphen, at most 63, the reserved list plus `PRODUCT_NAME` written as a subdomain) is used by the form and the API. Codes `subdomain_malformed`, `subdomain_reserved` (400) and `subdomain_taken` (409); the app shows them in Czech at the field. The input is trimmed and lowercased. A simultaneous signup that loses on the unique constraint also gets 409 with its code, not a 500.
- Validation shared by both apps: `icoSchema` (checksum), `emailSchema` (lowercased), `phoneSchema`, `passwordSchema` (at least 12 characters), `slugify`. Messages of our own checks are i18n keys (`ico_invalid`), translated in `common.validation`.
- New columns and tables: `organisations` gets the statutory representative, DIČ, contact email and phone and billing email; `admins.password_hash` (Argon2id from `node:crypto`, PHC string, `core/passwords/`); `memberships.owner`; `camps` (RLS: name, slug from the name, unique per Organisation); `legal_acceptances` (platform table).
- Operator email: `emails.sendForPlatform()` sends platform mail without an Organisation's unit of work (sender name `PRODUCT_NAME`, no reply contact in the layout). It goes to `PLATFORM_OPERATOR_EMAIL` with the legal identity, contacts and the future address.
- `account` access kind: an admin session on the main host without an Organisation, run in a platform unit of work; `@RequestAdminId()`.
- Tests: `organisation.integration.test.ts` covers every acceptance criterion (rows created, the session and the pending status, the acceptances with time and user, audit entries without the hash, the operator email, each subdomain refusal, a taken email, outdated versions, invalid bodies, two simultaneous signups); `account.integration.test.ts`; `endpoint.integration.test.ts` (parsed body, stripped response, 500 with rollback, 204, compile-time return check); `unit-of-work` (`enter`), `access` (`account`), pure tests for the subdomain rules, IČO, `slugify` and password hashes. Checked by hand on the local stack in Chromium: client errors, the taken subdomain from the server, the waiting page after signup, the operator mail in the log.
- Assumed, to confirm:
  - "The Owner can log in" is covered by signup signing them in; logging in again needs the password login of issue 18 (the hash is already stored). Without a session, `/` says login is coming and links to signup.
  - Legal versions are constants (`CURRENT_LEGAL_VERSIONS`, both `draft` for now) and the app links to `/podminky`, `/zpracovatelska-smlouva` and the data page `/zpracovani-dat` (issue 47). None of these pages exists yet. The lawyer's texts set the real versions before the first approval.
  - Contact and billing details are the contact email and phone, the billing email and an optional DIČ. The Camp name entered also becomes the Organisation's display name.
  - An email that already has an admin account is refused (`email_taken`), since a signup cannot prove it owns that account. This tells an anonymous caller that an admin exists; rate limiting (issue 22) is the mitigation.
  - The operator address is configuration (`PLATFORM_OPERATOR_EMAIL`) until operators exist as admins (issue 21).
  - Password strength is only a minimum length; the strength check comes with issue 18.
- Open for later: fixtures create memberships without audit entries, so each test's audit log holds only what the test did.
- Local setup: two new env variables, `PRODUCT_NAME` and `PLATFORM_OPERATOR_EMAIL` (in `.env.example`, `.env.test` and Compose). The migration adds NOT NULL columns to `organisations` without defaults, so a local database that already holds Organisations needs a reset.
