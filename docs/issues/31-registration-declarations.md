# 31 - Registration declarations

Status: ready-for-agent
Stage: 1a
Episode: E2 Camp setup
Blocked by: 12, 30
Stories: 51, 52, 70

## What to build
A per-Camp list of Registration declarations that guardians tick on the form. Each declaration has its text, a mandatory or optional flag, and optionally a link to a web page or an uploaded PDF (stored through the encrypted file service, served to guardians through a public short-lived link). A new Camp starts with a preset list: personal data notice, binding registration, terms and storno, truthfulness. Declarations are part of the form draft and are frozen into the form version on publish, so their wording is preserved per Registration.

## Acceptance criteria
- [ ] Preset declarations exist on a new Camp's draft.
- [ ] Add, edit, remove and reorder declarations with Camp settings write.
- [ ] Uploaded PDF goes through the file service (PDF type and size checks, ciphertext in storage).
- [ ] Publishing the form freezes declaration texts and attachments into the version; later edits do not change it.
- [ ] Public form endpoint returns declarations with a way to open the attached PDF without a session.
- [ ] Tenant isolation, audit.

## Notes
- Spec sections: Registration, placement and declarations; Further Notes divergence "Registration declarations".
- Domino has seven fixed checkboxes plus typed name, place and date (`packages/schema/src/registration.ts`, `consentsSchema`); here there is no typed name, place or date.
- Preset wording must contain no Domino-specific names.
