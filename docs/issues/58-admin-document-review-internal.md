# 58 - Admin document review and Internal documents

Status: done
Stage: 1b
Episode: E8 Documents
Blocked by: 57
Stories: 135, 136, 137, 138

## What to build

Admins with Registrations write review Parent-uploaded documents: approve them, or return them with a note that is emailed to both guardians (document returned email, Camp switch respected). They can upload a file on a guardian's behalf or mark a requirement as handed in on paper, which closes it without a file. Admins also attach Internal documents to a Participant, which guardians never see in any endpoint.

## Acceptance criteria

- [x] Approve sets Approved; return sets Returned with the note and queues the document returned email to both guardians.
- [x] Upload on behalf creates an Approved upload attributed to the admin; mark on paper closes the requirement without a file.
- [x] Internal documents never appear in any guardian endpoint, verified by listing every portal endpoint response.
- [x] Registrations read can view and download but not approve, return or upload.
- [x] All actions are audited.

## Notes

- Spec sections: Documents.
- Port from Domino: `apps/api/src/admin-document/services/admin-document.service.ts`, `apps/api/src/internal-document/`, `apps/portal/src/pages/admin/ParticipantDocuments.vue`, `apps/portal/src/pages/admin/InternalDocuments.vue`.

## Comments

2026-11-07 - **From issue 57.** Uploads are `document_uploads` (`DocumentUploadRepository`, `modules/documents/upload/`) with `status`, `note`, `uploaded_by_email` and `uploaded_by_admin_id` (for an upload on behalf) and a nullable `file_id` (handed in on paper). The newest per child and requirement counts; a guardian may hand in again only after a return. `FileService.links(fileIds)` makes many links in one query.

2026-11-07 - **Done.** Registrations read: `GET /registrations/:id/documents` shows per child each requirement's documents newest first (status, note, who handed it in, file link) and the child's Internal documents with their file names, links made in one query (`FileService.links`, `FileService.names`). Registrations write: `POST /document-uploads/:id/approve` (a pending newest one) and `/return` with a note (a newest one not yet returned), each audited, the return emailing both guardians (`document_returned`, Camp switch respected) from `documents.send-document-returned`; `POST /registrations/:id/participants/:participantId/documents/:documentTypeId` hands in on behalf and `/paper` marks it handed in on paper, both Approved and attributed to the admin (refused once the requirement is approved); `POST .../internal-documents` and `DELETE /internal-documents/:id` keep Internal documents (`internal_documents`), which no portal endpoint reads, checked against every portal GET. Reviews lock the child like a guardian's upload does. UI: "Dokumenty" on the Registration detail with approve, return with a note, on behalf, on paper and Internal documents.

2026-11-08 - **Decision by the project lead: opening an Internal document is audited**, like a view of health data. `GET /registrations/:id/documents` and `POST .../internal-documents` no longer carry an Internal document's link; `POST /internal-documents/:id/open` (Registrations read) hands out a short-lived link and records `internal_document.view` with the actor, the child as target and the document's id (`changes.internalDocumentId`), on every call. The detail asks for the link at the click, as for a signed Consent PDF.
