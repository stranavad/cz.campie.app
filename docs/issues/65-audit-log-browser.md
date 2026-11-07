# 65 - Audit log browser

Status: done
Stage: 1b
Episode: E9 Trust
Blocked by: 10, 19
Stories: 30, 120

## What to build

Owners browse and filter the Organisation's full audit log by actor, actor kind, action, target and time range, with old and new values for unencrypted fields and only field names for encrypted ones. Anyone with read access to a record sees that record's own history (used by the Registration detail). Erased Registrations show scrubbed entries.

## Acceptance criteria

- [x] Owner sees all entries; filters narrow correctly; results paginate.
- [x] A non-Owner admin cannot list the full log but sees the history of a record they can read.
- [x] Entries about encrypted fields show field names only.
- [x] Health view entries are invisible to admins without Health read.
- [x] Entries of Organisation A never appear for B.

## Notes

- Spec sections: Identity, permissions and audit; Removing a Registration.

## Comments

2026-11-07 - **Done.** `GET /audit-log` (Owners only): the Organisation's whole log newest first, 50 a page (`after` the last id), filtered by actor kind, actor (an admin's or a guardian's email), action or the start of one, target type and id, and time; each entry with the actor's email, IP address, target, old and new plain values and encrypted fields by name only, as recorded. A record's own history stays where reading the record allows it (the Registration detail since issue 43), now without entries of actions on health data for admins without Health read. Erased Registrations' entries show as erasure (issue 66) scrubs them. UI: "Historie změn" from the admin home for Owners, with filters and paging.
