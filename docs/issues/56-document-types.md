# 56 - Document types

Status: ready-for-agent
Stage: 1b
Episode: E8 Documents
Blocked by: 12, 24
Stories: 99, 133, 134

## What to build

An admin with Camp settings write defines Document types for a Camp, of two kinds: downloads (a published file, optionally limited to chosen Turnusy) and requirements (name, description, optional blank form, optional due date). Files are stored through the encrypted file service. Guardians see in the portal the downloads that apply to their Registration's Turnus and can download them. Requirements become per-Participant items consumed by issue 57 and the checklist. Document types are visible only when the Documents module is on.

## Acceptance criteria

- [ ] An admin creates a download limited to Turnus 1; a guardian of a Turnus 2 Registration does not see it.
- [ ] A requirement with a blank form and due date is returned to guardians of every Turnus of the Camp.
- [ ] Turning the Documents module off hides types from guardians and keeps them stored.
- [ ] Camp settings read cannot change types; types of Organisation A are invisible to B.
- [ ] Downloads use short-lived links; changes are audited.

## Notes

- Spec sections: Documents; Files.
- Port from Domino: `apps/api/src/admin-document-type/`, `apps/portal/src/pages/parent/DownloadDocuments.vue`.
- Domino's feature-linked document types (its ADR-0001) are replaced by the checklist; do not port linking.
