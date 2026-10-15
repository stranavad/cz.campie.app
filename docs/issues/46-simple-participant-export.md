# 46 - Simple Participant export

Status: ready-for-agent
Stage: 1a
Episode: E6 Admin Registrations
Blocked by: 42
Stories: 121, 124

## What to build
A first, fixed export for the opening: an Excel file of the Selected Turnus's Participants with every column the admin may see, built from the column catalogue of all published versions of the Camp's form (core, switched-on standard fields, custom fields with removed ones marked, prices, payments, statuses). Columns containing health data are absent without Health read. An export containing sensitive columns writes an audit entry. Named presets and the payments export come in issue 62.

## Acceptance criteria
- [ ] Export returns an .xlsx with one row per Participant of the Selected Turnus.
- [ ] Columns derived from the catalogue across versions; removed-field headers marked.
- [ ] Without Health read, the health note column is absent.
- [ ] Rodné číslo decrypted into the file only for users with Registrations read; export containing it is audited.
- [ ] Requires Registrations read; tenant isolation.

## Notes
- Spec sections: Export.
- Port from Domino: `apps/api/src/admin-export/services/admin-export-xlsx.service.ts`, `apps/api/src/participant-export/`.
