# 66 - Erase a Registration

Status: ready-for-agent
Stage: 1b
Episode: E9 Trust
Blocked by: 12, 45
Stories: 31

## What to build

Removing a Registration offers Cancel all (issue 45) or Erase. Erase is Owner only and anonymises: Registered Participants are cancelled first, then every stored file (uploads, Přihlášky, signed Consent PDFs, Internal documents) is deleted from storage and all form answers, declarations, Consent signatures, health data, guardians, access emails and notes are deleted. A tombstone remains for accounting: Turnus, Variable symbol, Participant count, price lines, Price adjustments with blanked notes and the full payment ledger including gateway transaction ids, with names reading 'Smazáno' and the erasure date. Audit entries about the Registration are scrubbed of value diffs and IP addresses with the guardian actor shown as an erased guardian, and the erasure itself is logged.

## Acceptance criteria

- [ ] After erasure no object of the Registration exists in storage (fake storage checked).
- [ ] No personal data remains in any table for that Registration; the tombstone and ledger remain and appear in the payments export.
- [ ] Places are freed for Registered Participants.
- [ ] Audit entries remain with diffs and IPs scrubbed; a new erasure entry exists.
- [ ] Guardians lose portal access to the Registration.
- [ ] Non-Owners get 403; the Variable symbol is never reused.

## Notes

- Spec sections: Removing a Registration; Files.
- ADR-0002: erasure anonymises and keeps the ledger.
