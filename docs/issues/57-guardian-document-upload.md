# 57 - Guardian document upload

Status: done
Stage: 1b
Episode: E8 Documents
Blocked by: 39, 56
Stories: 100, 101, 102, 103

## What to build

In the portal, either guardian uploads a PDF, JPG or PNG for each requirement per Participant, from a phone or computer. The upload goes through the API with type and size checks and is stored encrypted; its status starts as Pending. The guardian sees each requirement's status (Pending, Approved, Returned with the note), can open what they uploaded through a short-lived link, and can upload again after a Returned status.

## Acceptance criteria

- [x] Uploading a PDF, JPG or PNG within the size limit creates a Pending upload; other types or oversize files are refused with a Czech message.
- [x] Storage holds only ciphertext for the upload.
- [x] A guardian can open their own upload; a guardian of another family or Organisation gets 404.
- [x] Re-upload after Returned creates a new Pending upload and keeps the previous one in history.
- [x] Uploading is audited with actor guardian.

## Notes

- Spec sections: Documents; Files.
- Port from Domino: `apps/api/src/parent/services/parent.service.ts` (document upload), `apps/portal/src/pages/parent/ParticipantDocuments.vue`.
- Domino has no Returned state; it is new here.

## Comments

2026-11-07 - **From issue 56.** Requirements are `document_types` rows of kind `requirement` (`DocumentTypeRepository.listByCamp`, `modules/documents/document-type/`); the portal's `GET /portal/registrations/:id/documents` lists them per Registration, to be extended with each child's uploads and status. `DocumentTypeService.remove` deletes a type and its file outright: once uploads reference a type, refuse removing it (or keep it archived) so uploads never lose their requirement.

2026-11-07 - **Done.** `document_uploads` (child, requirement, file or none for paper, status `pending`/`approved`/`returned`, note, who and when; a requirement with uploads cannot be removed: 409 `document_type_in_use`). `POST /portal/registrations/:id/participants/:participantId/documents/:documentTypeId` (multipart, guardians and access emails) stores a PDF, JPG or PNG within `MAX_FILE_BYTES` encrypted as Pending, audited `document_upload.create` (actor guardian); it takes one only while nothing was handed in or the newest was returned (409 `document_upload_not_needed`), under locks of the requirement and the child, for Registered children only. `GET /portal/registrations/:id/documents` adds per child each requirement's documents newest first, with short-lived links made in one query (`FileService.links`). Portal: the documents page shows per child and requirement the status, the return note, everything handed in to open, and the upload (refused types and sizes in Czech).

2026-11-08 - **Decision by the project lead: a guardian may replace a pending upload** (a wrong photo) before the admin reviews it. `PUT /portal/registrations/:registrationId/uploads/:uploadId` (multipart, guardians and access emails of the Registration, the same rate limit and Registered-child checks as an upload) puts the new file in place of the document's, which keeps its id and stays Pending with the new guardian and time; the old file is removed through `FileService.remove`, so its object is deleted from storage. Only while Pending (409 `document_upload_not_pending` once approved or returned); the document is locked before its child, in a review's order, so a review and a replacement never both pass. Audited `document_upload.replace` with before and after. Portal: a pending document shows "Nahradit jiným souborem".
