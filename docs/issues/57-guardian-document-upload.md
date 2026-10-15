# 57 - Guardian document upload

Status: ready-for-agent
Stage: 1b
Episode: E8 Documents
Blocked by: 39, 56
Stories: 100, 101, 102, 103

## What to build

In the portal, either guardian uploads a PDF, JPG or PNG for each requirement per Participant, from a phone or computer. The upload goes through the API with type and size checks and is stored encrypted; its status starts as Pending. The guardian sees each requirement's status (Pending, Approved, Returned with the note), can open what they uploaded through a short-lived link, and can upload again after a Returned status.

## Acceptance criteria

- [ ] Uploading a PDF, JPG or PNG within the size limit creates a Pending upload; other types or oversize files are refused with a Czech message.
- [ ] Storage holds only ciphertext for the upload.
- [ ] A guardian can open their own upload; a guardian of another family or Organisation gets 404.
- [ ] Re-upload after Returned creates a new Pending upload and keeps the previous one in history.
- [ ] Uploading is audited with actor guardian.

## Notes

- Spec sections: Documents; Files.
- Port from Domino: `apps/api/src/parent/services/parent.service.ts` (document upload), `apps/portal/src/pages/parent/ParticipantDocuments.vue`.
- Domino has no Returned state; it is new here.
