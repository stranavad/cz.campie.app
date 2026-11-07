# 63 - Support access

Status: done
Stage: 1b
Episode: E9 Trust
Blocked by: 10, 21
Stories: 6, 7, 28, 29

## What to build

An Owner grants the platform operator support access for a limited time, choosing whether changes are allowed (read-only by default), and can revoke it early. While a grant is active, the operator can enter the Organisation from the console and act as a support actor; without one, the operator has no path to participant data. Every operator action under a grant is written to the Organisation's audit log with actor platform operator. Grants expire automatically by the clock.

## Acceptance criteria

- [x] Without a grant the operator gets 403 on every organisation endpoint.
- [x] With a read-only grant reads succeed and every write is refused.
- [x] With a write grant writes succeed and are audited as platform operator.
- [x] After expiry (controllable clock) or revocation access is refused immediately.
- [x] Granting, revoking and entering are audited and visible to Owners.
- [x] Only Owners can grant.

## Notes

- Spec sections: Tenancy (platform console); Identity, permissions and audit (support access).
- Lack of operator access is an application rule, not cryptographic; the public data page says so (issue 47).

## Comments

2026-11-07 - **Done.** Owners grant, list and revoke at `/support-access` (`support_grants`, a platform table the access guard reads; a new grant ends the one in force; all under the Organisation's row lock; audited `support_access.grant`/`revoke`). The access guard lets the Platform operator into an Organisation without a membership only with a TOTP-passed session and a grant in force now: every permission area at read, or at write when the grant allows changes, never as an Owner; a read-only grant refuses every mutating request with 403 `support_read_only` except `POST /support-access/enter`, which records the entry in the Organisation's log. Under a grant the actor is the operator, so every change lands in the Organisation's log as theirs. The account lists the supported Organisations for the operator (`support` on a membership), the console offers to enter them, and the admin pages show a support banner. Known limit: a five-minute download link made under a grant still opens for up to five minutes after it ends.
