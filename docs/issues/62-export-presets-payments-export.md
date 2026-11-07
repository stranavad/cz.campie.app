# 62 - Export presets and payments export

Status: done
Stage: 1b
Episode: E6 Admin Registrations
Blocked by: 46
Stories: 121, 122, 123, 124

## What to build

Extend the simple export (issue 46) with column selection from the Camp's column catalogue, named presets shared within the Organisation and tied to a Camp, and the last selection remembered per user. Add a separate payments export (ledger entries with Variable symbol, date, amount, kind, note, gateway transaction id) for accountants. Health columns are absent without Health read. Exports run as background jobs; exports containing sensitive columns are audited.

## Acceptance criteria

- [x] A preset saved by one admin is visible to another admin of the same Organisation for that Camp only.
- [x] The last selection is restored per user.
- [x] Columns of fields removed in later form versions appear marked as removed.
- [x] Without Health read, health columns are neither offered nor present in the file.
- [x] Payments export includes correcting and gateway entries and tombstones of erased Registrations.
- [x] Exports with sensitive columns create an audit entry.

## Notes

- Spec sections: Export; Identity, permissions and audit.
- Port from Domino: `apps/api/src/admin-export/services/admin-export-preset.service.ts`, `apps/api/src/admin-export/services/admin-export-xlsx.service.ts`.
- No Google Drive export; Excel download only.

## Comments

2026-11-07 - **Done.** Export columns are the platform's own (`FIXED_EXPORT_COLUMNS`) and the form's (`field:<key>`, from every published version, removed ones marked). `GET /turnusy/:turnusId/export-options` lists the form's columns, the Camp's presets and the admin's last choice for the Camp; `POST /turnusy/:turnusId/exports` takes `columns` (every column without), remembered per admin and Camp (`export_selections`) and kept on the export; the file keeps the platform's column order. `POST /camps/:campId/export-presets` and `DELETE /export-presets/:id` keep named presets shared by the Organisation's admins for that Camp (`export_presets`), audited. `POST /payment-exports` exports the Organisation's whole ledger (Variable symbol, date, amount, kind, note, gateway transaction, recorded), corrections and card payments included and erased Registrations' entries too, as their rows stay. Every export is audited `export.create` with its kind and columns. No column is health data or encrypted yet, so nothing is withheld; issue 29 adds that. Participants page: export everything, pick columns with presets, and the payments export.
