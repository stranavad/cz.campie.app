# 09 - Encryption core: per-Organisation data keys

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: 08
Stories: -

## What to build

Give each Organisation its own data key, generated at Organisation creation and stored wrapped by the master key from the key provider. Provide field-level encrypt and decrypt helpers for values stored in the database and streaming encrypt and decrypt for files. Encrypted values carry a version marker so the scheme can evolve. Encrypted fields are never filtered or sorted in the database. Destroying an Organisation's wrapped key makes all its encrypted data unreadable.

## Acceptance criteria

- [x] Creating an Organisation creates a wrapped data key; the unwrapped key never touches the database
- [x] A value encrypted for Organisation A cannot be decrypted with Organisation B's key
- [x] A stored encrypted field is ciphertext when read with raw SQL
- [x] Streaming encrypt then decrypt of a 10 MB file round-trips byte for byte without loading it fully into memory
- [x] Deleting the wrapped key makes previously encrypted values fail to decrypt with a clear error

## Notes

- Spec sections: Encryption, Files
- Port from Domino: `apps/api/src/admin-export/services/token-encryption.service.ts`

## Comments

2026-11-01 - **Done.** `EncryptionService` in `apps/api/src/core/encryption/` creates each Organisation's data key and hands out an `OrganisationCipher` for the current unit of work's Organisation; the crypto itself is the pure `cipher.ts`.

- Keys: `organisation_keys` (platform table, one row per Organisation, cascading from `organisations`) holds a random 256-bit data key sealed with AES-256-GCM under the `KeyProvider` master key, with the Organisation id as associated data, so a wrapped key moved to another Organisation does not unwrap. `OrganisationService.create()` makes the Organisation and its key in one platform unit of work; the `createOrganisation` fixture now goes through it. A custom migration revokes UPDATE from `campie_app`: the API may delete a key (destroying the data) but never replace it.
- Fields: `cipher.encrypt(string)` gives `Encrypted`, a branded `Buffer` that is the only type an `encrypted()` column (`db/helpers/encrypted.ts`, `bytea`) accepts, so plaintext cannot be stored there by mistake and `eq(column, 'plaintext')` does not compile. Layout: version byte, 12-byte random IV, ciphertext, 16-byte tag. Diverges from Domino's token service, which put the tag first and had no version.
- Files: `cipher.encryptStream()` and `decryptStream()` are Node transforms using segmented AES-256-GCM: a 17-byte header (version, 16-byte salt), a per-file key from HKDF-SHA256 over the data key and salt, and 64 KiB segments whose nonce is the segment index plus a last-segment flag. Each segment is verified before it is emitted, and reordering, dropping or cutting at a boundary fails. Proven on 10 MB with the first plaintext out before 1 MiB was read; removing the last-segment flag was caught.
- Errors: a wrong key or altered value says "failed to decrypt: wrong key, or altered ciphertext"; a destroyed key says "The Organisation's data key is destroyed; its encrypted data cannot be decrypted"; an unknown version says so.
- For issue 12: `decryptStream` emits verified segments before it knows the file is complete, so the download endpoint must abort the response on a stream error rather than end it cleanly. Get one cipher per unit of work; it keeps the key in memory, so streaming outlives the transaction.
- Not done, on purpose: no binding of a value to its row or column (a ciphertext copied to another row of the same Organisation still decrypts); no lint rule against filtering or sorting encrypted columns beyond what the type prevents; no key rotation or destroy endpoint until something needs one.
- Caveat for the spec's "backups included": the wrapped key lives in the same database, so a restore from before its deletion brings it back until Neon's history window passes. True crypto-shredding of backups would need the keys outside the database or a master key rotation.
