# 62 - Export presets and payments export

Status: ready-for-agent
Stage: 1b
Episode: E6 Admin Registrations
Blocked by: 46
Stories: 121, 122, 123, 124

## What to build

Extend the simple export (issue 46) with column selection from the Camp's column catalogue, named presets shared within the Organisation and tied to a Camp, and the last selection remembered per user. Add a separate payments export (ledger entries with Variable symbol, date, amount, kind, note, gateway transaction id) for accountants. Health columns are absent without Health read. Exports run as background jobs; exports containing sensitive columns are audited.

## Acceptance criteria

- [ ] A preset saved by one admin is visible to another admin of the same Organisation for that Camp only.
- [ ] The last selection is restored per user.
- [ ] Columns of fields removed in later form versions appear marked as removed.
- [ ] Without Health read, health columns are neither offered nor present in the file.
- [ ] Payments export includes correcting and gateway entries and tombstones of erased Registrations.
- [ ] Exports with sensitive columns create an audit entry.

## Notes

- Spec sections: Export; Identity, permissions and audit.
- Port from Domino: `apps/api/src/admin-export/services/admin-export-preset.service.ts`, `apps/api/src/admin-export/services/admin-export-xlsx.service.ts`.
- No Google Drive export; Excel download only.
