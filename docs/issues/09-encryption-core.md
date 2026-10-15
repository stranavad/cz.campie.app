# 09 - Encryption core: per-Organisation data keys

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 08
Stories: -

## What to build

Give each Organisation its own data key, generated at Organisation creation and stored wrapped by the master key from the key provider. Provide field-level encrypt and decrypt helpers for values stored in the database and streaming encrypt and decrypt for files. Encrypted values carry a version marker so the scheme can evolve. Encrypted fields are never filtered or sorted in the database. Destroying an Organisation's wrapped key makes all its encrypted data unreadable.

## Acceptance criteria

- [ ] Creating an Organisation creates a wrapped data key; the unwrapped key never touches the database
- [ ] A value encrypted for Organisation A cannot be decrypted with Organisation B's key
- [ ] A stored encrypted field is ciphertext when read with raw SQL
- [ ] Streaming encrypt then decrypt of a 10 MB file round-trips byte for byte without loading it fully into memory
- [ ] Deleting the wrapped key makes previously encrypted values fail to decrypt with a clear error

## Notes

- Spec sections: Encryption, Files
- Port from Domino: `apps/api/src/admin-export/services/token-encryption.service.ts`
