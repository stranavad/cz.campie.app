# 10 - Audit log core

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: 08
Stories: 152

## What to build

Create the append-only audit log: each entry records actor kind (admin, guardian, platform operator, system) and identity, action, target, time and IP address, written inside the same unit of work as the change. For unencrypted fields the entry stores old and new values; for encrypted fields it stores only the names of fields that changed. Provide a helper that every later module uses for changes, health-data views and sensitive exports. The application role can insert but never update or delete audit rows.

## Acceptance criteria

- [x] Updating or deleting an audit row with the application role fails at the database level
- [x] A change made through a sample endpoint produces one entry with actor, action, target, time, IP and value diff
- [x] An entry for an encrypted field lists the field name and contains no plaintext or ciphertext value
- [x] If the change's transaction rolls back, no audit entry remains
- [x] Audit entries are Organisation-scoped by RLS like any other table

## Notes

- Spec sections: Identity, permissions and audit
- Erasure later scrubs diffs and IP addresses (issue 66); design the row so this is possible without deleting it

## Comments

2026-11-01 - **Done.** `AuditService.record(actor, { action, target, change })` in `apps/api/src/core/audit/` appends an entry through `AuditEntryRepository` in the current unit of work, so it commits or rolls back with the change.

- Table `audit_entries` (Organisation-owned, RLS like any other): occurred at (from the `Clock`), actor kind (`audit_actor_kind`: admin, guardian, operator, system), actor identity, IP address (`inet`), action, target type and id, `changes` (old and new values of plain fields) and `encrypted_fields` (names only). A custom migration revokes UPDATE, DELETE and TRUNCATE from `campie_app`.
- Diff: the pure `changesBetween(before, after)` compares rows field by field; `null` before is a created row, `null` after a removed one. Any byte value counts as encrypted, so neither plaintext nor ciphertext reaches the log. A re-encrypted unchanged value has new ciphertext and is listed as changed, so services re-encrypt only values that changed.
- Actor: passed explicitly (`Actor`, a union where `system` has no identity or IP), since services need it for permission checks anyway. Until issue 14 nothing builds one from a session; the sample endpoint is a test-only controller.
- For issue 66: actor identity, IP address and changes are nullable so an entry can be scrubbed and kept. The application role cannot update them, so erasure needs a narrow `SECURITY DEFINER` scrub function owned by the migrating role rather than a weaker grant. Entries are found by target id: erasure collects the ids of the Registration's Participants, guardians and health records before deleting them.
- For issue 14: the IP comes from Express `req.ip`; behind the `/api` proxy it needs `trust proxy` set, or every entry records the proxy's address.
- Open: `organisation_id` cascades from `organisations`, and the cascade runs as the table owner, so deleting an Organisation also deletes its audit log. Deliberate for now, since only a pending Organisation is ever deleted; revisit if Organisation deletion becomes broader.
- `ACTOR_KINDS` lives in `core/audit/actor.ts`; move it to `@repo/schema` when the audit log browser (issue 65) puts actor kinds on the wire.
