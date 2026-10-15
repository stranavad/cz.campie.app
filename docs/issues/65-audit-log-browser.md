# 65 - Audit log browser

Status: ready-for-agent
Stage: 1b
Episode: E9 Trust
Blocked by: 10, 19
Stories: 30, 120

## What to build

Owners browse and filter the Organisation's full audit log by actor, actor kind, action, target and time range, with old and new values for unencrypted fields and only field names for encrypted ones. Anyone with read access to a record sees that record's own history (used by the Registration detail). Erased Registrations show scrubbed entries.

## Acceptance criteria

- [ ] Owner sees all entries; filters narrow correctly; results paginate.
- [ ] A non-Owner admin cannot list the full log but sees the history of a record they can read.
- [ ] Entries about encrypted fields show field names only.
- [ ] Health view entries are invisible to admins without Health read.
- [ ] Entries of Organisation A never appear for B.

## Notes

- Spec sections: Identity, permissions and audit; Removing a Registration.
