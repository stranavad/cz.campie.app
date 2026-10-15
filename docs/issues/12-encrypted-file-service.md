# 12 - Encrypted file service and short-lived download links

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 06, 09
Stories: 103

## What to build

Build the one way files enter and leave the platform. Uploads go through the API with type checks (PDF, JPG, PNG, verified by content, not only extension) and Domino's size limit, are encrypted with the Organisation's key and stored as ciphertext. A download is requested through a permission-checked API call that returns a short-lived link to the API's own download endpoint, which decrypts and streams the file with the right content type, so click-to-open works on phones. Storage addresses are never exposed. Deleting a file record removes the stored object. Later modules (logos, declaration PDFs, documents, Consents) call this service and do their own permission checks before asking for a link.

## Acceptance criteria

- [ ] An uploaded file is ciphertext in storage
- [ ] A wrong type or oversize upload is rejected with a Czech message key
- [ ] A download link works once permission is checked, expires after its lifetime and cannot be used for another Organisation's file
- [ ] The streamed response has the correct content type and filename and opens inline
- [ ] Deleting the record removes the stored object

## Notes

- Spec sections: Files, Encryption
- Port from Domino: `apps/api/src/storage/object-key.ts` (key layout idea) and its spec; size limit from Domino's upload validation
- Diverges from Domino ADR-0006/0008 (presigned URLs); reason in spec Further Notes
