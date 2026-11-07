# 56 - Document types

Status: done
Stage: 1b
Episode: E8 Documents
Blocked by: 12, 24
Stories: 99, 133, 134

## What to build

An admin with Camp settings write defines Document types for a Camp, of two kinds: downloads (a published file, optionally limited to chosen Turnusy) and requirements (name, description, optional blank form, optional due date). Files are stored through the encrypted file service. Guardians see in the portal the downloads that apply to their Registration's Turnus and can download them. Requirements become per-Participant items consumed by issue 57 and the checklist. Document types are visible only when the Documents module is on.

## Acceptance criteria

- [x] An admin creates a download limited to Turnus 1; a guardian of a Turnus 2 Registration does not see it.
- [x] A requirement with a blank form and due date is returned to guardians of every Turnus of the Camp.
- [x] Turning the Documents module off hides types from guardians and keeps them stored.
- [x] Camp settings read cannot change types; types of Organisation A are invisible to B.
- [x] Downloads use short-lived links; changes are audited.

## Notes

- Spec sections: Documents; Files.
- Port from Domino: `apps/api/src/admin-document-type/`, `apps/portal/src/pages/parent/DownloadDocuments.vue`.
- Domino's feature-linked document types (its ADR-0001) are replaced by the checklist; do not port linking.

## Comments

2026-11-07 - **Done.** New module `documents` (`@repo/schema/documents`, `apps/api/src/modules/documents`, class `CampDocumentsModule` beside the core `DocumentsModule`). `document_types` per Camp: kind `download` (optionally for chosen Turnusy, checked to be the Camp's) or `requirement` (optional due date), name, description, and one file: a download's file or a requirement's blank form, stored through `FileService` (PDF, JPG, PNG). Camp settings write: `POST`/`PUT`/`DELETE /camps/:campId/document-types[/:id]`, `PUT`/`DELETE .../file`, each audited (`document_type.create`/`update`/`remove`), a replaced or removed file removed with it; read: `GET /camps/:campId/document-types`. Guardians: `GET /portal/registrations/:id/documents` gives the downloads with a file for the Registration's Turnus and every requirement with its blank form, through short-lived links; empty while the Documents module is off. The guardian registration now says which portal modules the Camp has on (`camp.consents`, `camp.documents`), and the portal shows "Souhlasy" and "Dokumenty" only then. Admin UI: "Dokumenty" on the Camp page (shown with the module off too, so types can be prepared). Removing a type with uploads is issue 57's to settle.
