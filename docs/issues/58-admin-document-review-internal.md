# 58 - Admin document review and Internal documents

Status: ready-for-agent
Stage: 1b
Episode: E8 Documents
Blocked by: 57
Stories: 135, 136, 137, 138

## What to build

Admins with Registrations write review Parent-uploaded documents: approve them, or return them with a note that is emailed to both guardians (document returned email, Camp switch respected). They can upload a file on a guardian's behalf or mark a requirement as handed in on paper, which closes it without a file. Admins also attach Internal documents to a Participant, which guardians never see in any endpoint.

## Acceptance criteria

- [ ] Approve sets Approved; return sets Returned with the note and queues the document returned email to both guardians.
- [ ] Upload on behalf creates an Approved upload attributed to the admin; mark on paper closes the requirement without a file.
- [ ] Internal documents never appear in any guardian endpoint, verified by listing every portal endpoint response.
- [ ] Registrations read can view and download but not approve, return or upload.
- [ ] All actions are audited.

## Notes

- Spec sections: Documents.
- Port from Domino: `apps/api/src/admin-document/services/admin-document.service.ts`, `apps/api/src/internal-document/`, `apps/portal/src/pages/admin/ParticipantDocuments.vue`, `apps/portal/src/pages/admin/InternalDocuments.vue`.

## Comments

2026-11-07 - **From issue 57.** Uploads are `document_uploads` (`DocumentUploadRepository`, `modules/documents/upload/`) with `status`, `note`, `uploaded_by_email` and `uploaded_by_admin_id` (for an upload on behalf) and a nullable `file_id` (handed in on paper). The newest per child and requirement counts; a guardian may hand in again only after a return. `FileService.links(fileIds)` makes many links in one query.
