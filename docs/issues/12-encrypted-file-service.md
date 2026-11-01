# 12 - Encrypted file service and short-lived download links

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: 06, 09
Stories: 103

## What to build

Build the one way files enter and leave the platform. Uploads go through the API with type checks (PDF, JPG, PNG, verified by content, not only extension) and Domino's size limit, are encrypted with the Organisation's key and stored as ciphertext. A download is requested through a permission-checked API call that returns a short-lived link to the API's own download endpoint, which decrypts and streams the file with the right content type, so click-to-open works on phones. Storage addresses are never exposed. Deleting a file record removes the stored object. Later modules (logos, declaration PDFs, documents, Consents) call this service and do their own permission checks before asking for a link.

## Acceptance criteria

- [x] An uploaded file is ciphertext in storage
- [x] A wrong type or oversize upload is rejected with a Czech message key
- [x] A download link works once permission is checked, expires after its lifetime and cannot be used for another Organisation's file
- [x] The streamed response has the correct content type and filename and opens inline
- [x] Deleting the record removes the stored object

## Notes

- Spec sections: Files, Encryption
- Port from Domino: `apps/api/src/storage/object-key.ts` (key layout idea) and its spec; size limit from Domino's upload validation
- Diverges from Domino ADR-0006/0008 (presigned URLs); reason in spec Further Notes

## Comments

2026-11-01 - **Done.** `FileService` in `apps/api/src/core/files/`, the `files` table (Organisation-owned, RLS) and `@repo/schema/files` (`FILE_CONTENT_TYPES`, `MAX_FILE_BYTES`, `FILE_ERROR_CODES`, `FileLink`).

- Uploads: `FileUploadInterceptor` reads one multipart field `file` into memory through Nest's multer, limited to 10 MB (Domino's limit) and with UTF-8 file names (multer reads Latin-1 by default, which garbles Czech names). `@UploadedFile()` hands over a `FileUpload`. `files.store(upload)` tells the type from the first bytes (PDF, JPG, PNG) and requires the name's extension to agree, so a renamed file is rejected as well as a disguised one. Rejections are 400 `file_type_not_allowed`, 400 `file_missing` or 413 `file_too_large`; the app translates the code.
- Storage: one record per file (content type, plaintext size, name as an `encrypted()` column, since names can be personal or medical), and the ciphertext from `cipher.encryptStream()` under `<organisation id>/<file id>`. The key layout keeps Domino's idea of a prefix per owner, but no file name. The object is written inside the caller's unit of work; the new `UnitOfWork.afterRollback` deletes it if that unit of work rolls back, so a feature failing after `store` leaves no orphan.
- Downloads: `files.link(fileId)` (inside the caller's unit of work, after its permission check) returns `{ url: /api/downloads/<token>, expiresAt }`, valid 5 minutes (Domino's TTL). The token is the Organisation, file id and expiry, HMAC-SHA256 signed with a key derived by HKDF from the master key; nothing is stored. `GET /api/downloads/:token` verifies it, opens the token's Organisation's unit of work, and streams the decrypted file with its content type, length, `Content-Disposition: inline` with an ASCII fallback and the UTF-8 name, `Cache-Control: private, no-store` and `nosniff`. It is streamed with `@Res()` and `pipeline`, so a file failing to decrypt aborts the response instead of ending it as complete. An altered, expired or foreign token answers 404; swapping another Organisation's ids into a valid link fails both the signature and RLS.
- Delete: `files.remove(fileId)` deletes the record and enqueues `files.delete-stored`, which deletes the object after commit and retries while storage is down.
- Tests (`files.integration.test.ts`, HTTP only, through a test-only controller with the `x-test-organisation` header standing in for sessions): ciphertext in storage, type and size rejections with nothing stored, the 10 MB edge, the download round trip with headers and a Czech name, expiry by the fake clock, tampered tokens, tenant isolation for link, open and delete, deletion via the job, rollback cleanup, and an aborted response on altered ciphertext. Mutations caught: no size code mapping, no expiry check, no signature check, no rollback cleanup.
- Not done, on purpose: no audit entry in the file service, since the owning feature audits its own record. No contract (`defineEndpoint`) and no param schema for the download route, since neither the contract infrastructure nor the global validation pipe exists yet; the token is validated by its signature. No access declaration until issue 14; the route is public by design, as the token is the permission. Multer errors other than size (a second file, a wrong field name) keep Nest's 400 without a code: only our own frontend sends them.
- For later features: keep the file id on the owning record and delete through `files.remove`, never by cascade, or the object stays in storage. A PDF with bytes before `%PDF-` is rejected; real readers tolerate that, so widen the check if scanners produce such files.
