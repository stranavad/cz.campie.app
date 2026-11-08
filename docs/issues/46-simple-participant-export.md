# 46 - Simple Participant export

Status: done
Stage: 1a
Episode: E6 Admin Registrations
Blocked by: 42
Stories: 121, 124

## What to build

A first, fixed export for the opening: an Excel file of the Selected Turnus's Participants with every column the admin may see, built from the column catalogue of all published versions of the Camp's form (core, switched-on standard fields, custom fields with removed ones marked, prices, payments, statuses). Columns containing health data are absent without Health read. An export containing sensitive columns writes an audit entry. Named presets and the payments export come in issue 62.

## Acceptance criteria

- [x] Export returns an .xlsx with one row per Participant of the Selected Turnus.
- [x] Columns derived from the catalogue across versions; removed-field headers marked.
- [x] Without Health read, the health note column is absent.
- [x] Rodné číslo decrypted into the file only for users with Registrations read; export containing it is audited.
- [x] Requires Registrations read; tenant isolation.

## Notes

- Spec sections: Export.
- Port from Domino: `apps/api/src/admin-export/services/admin-export-xlsx.service.ts`, `apps/api/src/participant-export/`.

## Comments

2026-11-07 - **Done.** `POST /turnusy/:turnusId/exports` (Registrations read) records a `participant_exports` row for the admin, audits `export.create` on the Turnus and enqueues `registrations.export-participants`; a repeated start returns the admin's export still waiting for that Turnus. The job locks the row, builds an .xlsx with exceljs (one row per Participant sorted by surname: core fields, guardians, every non-core column of `columnCatalogue` across all published versions with `(odstraněno)` on removed ones, option labels, then total, paid, remaining, payment status, amount due now, due date, overdue) and stores it encrypted through `FileService` (`.xlsx` is now a stored type, never an upload type; `files.content_type` became text with a check, since the spreadsheet's media type is longer than an enum label may be). `GET /exports/:exportId` shows an export only to the admin who started it, with a five-minute download link once ready. The list page has an export button that polls for up to two minutes and renews the link. The health note and rodné číslo criteria wait for the standard field catalogue (issue 29), which has no field yet; noted there.

2026-11-08 - **Project lead follow-up.** Exports expire instead of vanishing: the hourly housekeeping marks an export `expired` (new `export_status` value, migration `20261108134159_export-expired`) 24 hours after it started and removes its file through `FileService`; a pending one never built expires too. `GET /exports/:id` keeps answering with `status: 'expired'` and no file, and the page says it expired. The delayed `registrations.remove-export` job is gone.

2026-11-08 - **Closed by issue 29.** The criterion that waited for the standard field catalogue is met there; see its comment.
