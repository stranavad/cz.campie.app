# 63 - Support access

Status: ready-for-agent
Stage: 1b
Episode: E9 Trust
Blocked by: 10, 21
Stories: 6, 7, 28, 29

## What to build

An Owner grants the platform operator support access for a limited time, choosing whether changes are allowed (read-only by default), and can revoke it early. While a grant is active, the operator can enter the Organisation from the console and act as a support actor; without one, the operator has no path to participant data. Every operator action under a grant is written to the Organisation's audit log with actor platform operator. Grants expire automatically by the clock.

## Acceptance criteria

- [ ] Without a grant the operator gets 403 on every organisation endpoint.
- [ ] With a read-only grant reads succeed and every write is refused.
- [ ] With a write grant writes succeed and are audited as platform operator.
- [ ] After expiry (controllable clock) or revocation access is refused immediately.
- [ ] Granting, revoking and entering are audited and visible to Owners.
- [ ] Only Owners can grant.

## Notes

- Spec sections: Tenancy (platform console); Identity, permissions and audit (support access).
- Lack of operator access is an application rule, not cryptographic; the public data page says so (issue 47).
