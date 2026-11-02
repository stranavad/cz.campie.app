# 21 - Platform operator console with mandatory TOTP

Status: done
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 19
Stories: 1, 2, 3, 4, 6

## What to build

The platform operator is a global admin identity with an operator flag that can only be set from the command line. The console on the main host checks the flag on every request and requires TOTP for every operator login. It lists Organisations with status (pending approval, approved, suspended), lets the operator approve, change the subdomain of a pending Organisation, reject a pending Organisation (deleting it and freeing the subdomain), and suspend an approved one. Approval fixes the subdomain and allows publishing. Suspension takes public pages offline and stops outgoing email. The console has access only to organisation-level records, never participant data.

## Acceptance criteria

- [x] Only a CLI command sets or clears the operator flag; no API endpoint does
- [x] An operator without TOTP set up must enrol before reaching the console
- [x] Approve, reject, rename subdomain (pending only) and suspend work and are audited
- [x] A suspended Organisation's public pages return a suspended page and no mail is sent
- [x] Console endpoints cannot return Registrations, Participants or any participant data (test)

## Notes

- Spec sections: Tenancy, Identity, permissions and audit
- Approving the first real Organisation also needs the legal texts (non-code dependency)
- Usage counts are after the season; feedback is issue 64; support access is issue 63

## Comments

2026-11-02 - **Implemented.** The Platform operator works at `/konzole` on the main host (linked from the admin home for the operator): the first visit sets up TOTP, every later login enters a code, then the list of Organisations with approve, change subdomain and reject for pending ones and suspend for approved ones (reject and suspend ask once more).

- Operator flag: a platform table `operators`, which the API's database role may only read (custom migration revokes INSERT, UPDATE, DELETE, TRUNCATE), so no route can make anyone the operator, by design or by bug. `pnpm --filter api operator grant|revoke|reset-totp <email>` (`src/cli/`, after a build) connects as the tables' owner (`MIGRATION_DATABASE_URL`). `grant` creates a missing account without a password; the operator sets one through `/zapomenute-heslo`. `reset-totp` removes the TOTP and ends the admin's sessions, for a lost phone. Each command is recorded in the platform audit log as the system. Locally: `docker compose run --rm migrate pnpm --filter api operator grant <email>`.
- Console access: a new access kind `operator`. It needs the main host, a live admin session, the operator flag (read on every request, so a revoke takes effect at once) and a session that passed a TOTP code. Otherwise it answers 401, 403 `not_operator` or 403 `second_factor_required`. Its routes run in `UnitOfWork.runForOperator`, a platform unit of work that throws on `enter`, so RLS keeps every Organisation-owned table empty to the console and nothing in it can switch Organisations.
- TOTP (`core/totp/`, hand-written RFC 6238, tested against the RFC vectors): `POST /account/totp` gives a new secret and otpauth URI (operators only for now, 403 `not_operator`; replaces an unconfirmed one; 409 `totp_enabled` once on). `POST /account/totp/confirm` turns it on with a code. `POST /sessions/current/totp` passes a later session. The secret is in `totp_credentials`, sealed with the master key and bound to the admin (`EncryptionService.sealPlatformSecret`). Each accepted code uses up its time step, so no code works twice. Wrong codes count against the login limits per admin (429 `totp_throttled`). A passed code replaces the session with a new one, with `admin_sessions.second_factor` set and a new cookie, until the old one would have expired. A cookie copied after the password step therefore never reaches the console. `GET /account` now carries `operator`, `totpEnabled` and `secondFactor`. Issue 67 can reuse all of it for admins.
- Console endpoints (`@repo/schema/console`): `GET /console/organisations` (identity and status only, newest first), `POST .../:id/approve` and `.../:id/suspend`, `PATCH .../:id` (subdomain, signup rules and codes), `DELETE .../:id` (reject). Status changes are one conditional `UPDATE`/`DELETE ... WHERE status = ...`, so two simultaneous actions can't both start from the same status. The row the audit entry compares against is read `FOR UPDATE` first. A wrong status answers 409 `organisation_not_pending` / `organisation_not_approved`.
- Rejecting deletes the Organisation with everything it holds (cascade), which frees the subdomain. It also deletes the accounts of its members who belong to no other Organisation, are not the operator and never signed for another Organisation, so the signer's email is free to sign up again. Legal acceptances keep naming their signer, so such an account stays.
- Audit: console actions go to a new append-only platform table `platform_audit_entries` through `AuditService.recordForPlatform`, with actor `operator`, IP address and the old and new values (`organisation.approve`, `organisation.update`, `organisation.remove`, `organisation.suspend`, `admin.remove`). An Organisation's own log is deleted with it on rejection, so it could not hold these.
- Suspension: public and guardian requests on a suspended Organisation's subdomain answer 403 `organisation_suspended`. The new `GET /organisation` (public, display name) lets the subdomain shell show a "Stránky jsou pozastavené" page instead of its pages. Mail was already skipped for the Organisation's own templates. **Fixed on the way:** invitations and Owner-change mails went out through `sendForPlatform` past that check. Platform mail sent from a suspended Organisation's unit of work is now skipped too.
- Tests: `totp.test.ts` (RFC vectors, drift, base32, URI), `cli/operator.integration.test.ts` (grant and revoke seen by the API, passwordless account set by reset, reset-totp ending sessions, audit, refusals, and the API role refused INSERT/UPDATE/DELETE on `operators`), `totp.integration.test.ts` (setup, the session replaced so a pre-code cookie opens nothing, sealed secret, replaced secret, a code once, lockout and its end, steps out of order, operators only), `console-organisation.integration.test.ts` (who is admitted, enrolment first, revoke effective at once, list shape, approve, rename rules, reject and what it frees, an account kept because it signed for another Organisation, status refusals, suspend with the subdomain offline and the mail stopped, and a test-only console route that sees no Camps and cannot `enter`), and the suspended host in `access.integration.test.ts`. Each guard was mutation-checked: removing it fails a test. Checked by hand on the local stack: the CLI, password reset, login, TOTP setup, code step and list in headless Chromium, approve and suspend over the proxy, the cookie replaced in the browser after the code, and the suspended subdomain page.
- Assumed, to confirm:
  - Rejection also removes the accounts left without any membership (the signer's above all), so their email can sign up again.
  - Suspension takes the guardian portal offline too, not only the public pages: a fake camp's portal would otherwise keep showing payment instructions. Admins of a suspended Organisation can still sign in.
  - There is no way back from suspension (no reinstate) and no email to the Owners on approval, rejection or suspension; neither was asked for.
  - The console's actions are not copied into the Organisation's own audit log: the console never enters an Organisation. Support access (issue 63) will write there.
  - Until issue 67, a password-only session of the operator still works outside the console (account and any membership of their own); only the console demands the code.
  - Enrolment shows the key and an otpauth link, no QR code (it would need a library); issue 67 can add one for admins.
  - The CLI's audit entries use the database's `now()`, not the Clock: it runs outside the app.
- Open, not changed:
  - Rejection doesn't delete the Organisation's objects in storage. Its data key goes with it, so they can no longer be decrypted, but they stay there. `FileStorage` has no prefix delete, and nothing stores files for a pending Organisation yet (the logo comes with issue 23).
