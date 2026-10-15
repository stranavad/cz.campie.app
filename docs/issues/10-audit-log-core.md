# 10 - Audit log core

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 08
Stories: 152

## What to build

Create the append-only audit log: each entry records actor kind (admin, guardian, platform operator, system) and identity, action, target, time and IP address, written inside the same unit of work as the change. For unencrypted fields the entry stores old and new values; for encrypted fields it stores only the names of fields that changed. Provide a helper that every later module uses for changes, health-data views and sensitive exports. The application role can insert but never update or delete audit rows.

## Acceptance criteria

- [ ] Updating or deleting an audit row with the application role fails at the database level
- [ ] A change made through a sample endpoint produces one entry with actor, action, target, time, IP and value diff
- [ ] An entry for an encrypted field lists the field name and contains no plaintext or ciphertext value
- [ ] If the change's transaction rolls back, no audit entry remains
- [ ] Audit entries are Organisation-scoped by RLS like any other table

## Notes

- Spec sections: Identity, permissions and audit
- Erasure later scrubs diffs and IP addresses (issue 66); design the row so this is possible without deleting it
