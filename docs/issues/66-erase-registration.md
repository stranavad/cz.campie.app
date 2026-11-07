# 66 - Erase a Registration

Status: done
Stage: 1b
Episode: E9 Trust
Blocked by: 12, 45
Stories: 31

## What to build

Removing a Registration offers Cancel all (issue 45) or Erase. Erase is Owner only and anonymises: Registered Participants are cancelled first, then every stored file (uploads, Přihlášky, signed Consent PDFs, Internal documents) is deleted from storage and all form answers, declarations, Consent signatures, health data, guardians, access emails and notes are deleted. A tombstone remains for accounting: Turnus, Variable symbol, Participant count, price lines, Price adjustments with blanked notes and the full payment ledger including gateway transaction ids, with names reading 'Smazáno' and the erasure date. Audit entries about the Registration are scrubbed of value diffs and IP addresses with the guardian actor shown as an erased guardian, and the erasure itself is logged.

## Acceptance criteria

- [x] After erasure no object of the Registration exists in storage (fake storage checked).
- [x] No personal data remains in any table for that Registration; the tombstone and ledger remain and appear in the payments export.
- [x] Places are freed for Registered Participants.
- [x] Audit entries remain with diffs and IPs scrubbed; a new erasure entry exists.
- [x] Guardians lose portal access to the Registration.
- [x] Non-Owners get 403; the Variable symbol is never reused.

## Notes

- Spec sections: Removing a Registration; Files.
- ADR-0002: erasure anonymises and keeps the ledger.

## Comments

2026-11-07 - **From issue 53.** The API role may neither delete nor update `consent_signatures` (only attach `file_id`), and the same holds for `consent_versions` and `consent_files`: erasure needs its own path for signatures and their PDFs (the signed PDFs are files to remove through `FileService`).

2026-11-07 - **From issues 57 and 58.** `document_uploads` and `internal_documents` cascade from `participants`, which would leave their stored files behind: erasure must remove their files through `FileService` (and the consent signature PDFs, see above) before any Participant row goes.

2026-11-07 - **From the security review after issue 62.** Export files (`participant_exports`) hold children's personal data; each is removed with its file a day after it was made (`registrations.remove-export`, a delayed job), so erasure need not list them beyond that day.

2026-11-07 - **Done.** `POST /registrations/:id/erase` (Owners only, `ErasureService`): under the Registration's lock it cancels the Registered Participants (freeing their places), gathers every stored file (Přihlášky, handed-in documents, Internal documents, signed Consent PDFs) and removes each through `FileService`, deletes handed-in and Internal document records, Claimed discount verifications, declaration answers, email changes, access emails and guardians, and turns the Participants into "Smazáno" with no birth date (`participants.birth_date` is now nullable for this) and no answers; the Registration keeps its Turnus, Variable symbol, price lines and ledger, gains `erased_at`, and is never reused. What the API role may otherwise never change is erased by one `SECURITY DEFINER` function, `erase_registration_protected(registration)`, limited to a Registration of the current Organisation (`app.organisation_id`): it deletes the Consent signatures and withdrawals, blanks Price adjustment notes, and scrubs the audit entries of the Registration and its Participants (values, encrypted field names, IP addresses, guardian identities). The erasure is audited `registration.erase`. Every other writer of a Registration's personal data (Přihláška and signed Consent PDF jobs, signing, handing in documents, admin edits) takes the Registration's lock first and stops on an erased one, so nothing lands after an erasure. Payment notes stay with the ledger. Export files with the child are removed a day after they were made anyway. UI: "Smazat osobní údaje" on the Registration detail for Owners, confirmed by typing SMAZAT.
