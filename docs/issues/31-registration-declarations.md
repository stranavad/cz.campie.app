# 31 - Registration declarations

Status: done
Stage: 1a
Episode: E2 Camp setup
Blocked by: 12, 30
Stories: 51, 52, 70

## What to build

A per-Camp list of Registration declarations that guardians tick on the form. Each declaration has its text, a mandatory or optional flag, and optionally a link to a web page or an uploaded PDF (stored through the encrypted file service, served to guardians through a public short-lived link). A new Camp starts with a preset list: personal data notice, binding registration, terms and storno, truthfulness. Declarations are part of the form draft and are frozen into the form version on publish, so their wording is preserved per Registration.

## Acceptance criteria

- [x] Preset declarations exist on a new Camp's draft.
- [x] Add, edit, remove and reorder declarations with Camp settings write.
- [x] Uploaded PDF goes through the file service (PDF type and size checks, ciphertext in storage).
- [x] Publishing the form freezes declaration texts and attachments into the version; later edits do not change it.
- [x] Public form endpoint returns declarations with a way to open the attached PDF without a session.
- [x] Tenant isolation, audit.

## Notes

- Spec sections: Registration, placement and declarations; Further Notes divergence "Registration declarations".
- Domino has seven fixed checkboxes plus typed name, place and date (`packages/schema/src/registration.ts`, `consentsSchema`); here there is no typed name, place or date.
- Preset wording must contain no Domino-specific names.

## Comments

2026-11-07 - **Implemented.** The Přihláška builder edits the declarations: text, mandatory or not, and a web page or an uploaded PDF to read first, added, removed and reordered; the preview shows them as guardians tick them (`DeclarationCheckbox` in `apps/app/src/core/registration-form`).

- Declarations are part of the draft (`registration_forms.declarations`) and frozen with each version (`registration_form_versions.declarations`), as `{ id, text, mandatory, url, fileId }`; responses show them with a five-minute link to the PDF (`ShownDeclaration`). A new Camp starts with four mandatory declarations: personal data notice, binding registration, terms and storno, truthfulness.
- PDFs: `POST /camps/:campId/registration-form/files` stores one through the file service (PDF only, encrypted), audited, and records it in `registration_form_files`; a draft may name only such files (400 `declaration_file_unknown`). Saving a draft removes, audited, a PDF the previous draft named and the new one does not, and an upload nobody named for a day, but never one a published version names.
- The public form returns the declarations with fresh links on every request; the builder refetches the form every four minutes, so its links never expire on screen.
- New ids in the app are UUIDv7 (`uuidv7` in `lib/utils`).
