# 29 - Standard field catalogue

Status: ready-for-human
Stage: 1a
Episode: E2 Camp setup
Blocked by: 28
Stories: 42, 46

## What to build

Freeze the list of standard fields of the registration form with their platform keys, Czech labels, validators and sensitivity: gender, rodné číslo (format and checksum, consistency with birth date, encrypted), zdravotní pojišťovna (code list), child address, guardian address, t-shirt size, health note (encrypted, treated as health data), Camp friend, transport (boarding places defined by the Camp), how did you hear. The human decision is which fields belong in the catalogue and their exact options; this needs the pilot camps' paper exercise mapping their přihlášky onto the design. After the decision an agent implements the catalogue as data plus validators consumed by the form engine, and the Camp's boarding-place list editor.

## Acceptance criteria

- [ ] Decision recorded: final field list with keys, option lists and which are encrypted (owner: project lead, input: pilot camps).
- [ ] Catalogue implemented as data in the schema package; each validator unit-tested (rodné číslo checksum and birth-date consistency, insurer codes).
- [ ] Boarding places are defined per Camp by an admin with Camp settings write; transport answers reference them.
- [ ] Sensitive fields are flagged so storage encrypts them and audit records only field names.

## Notes

- Spec sections: Form engine; Encryption; Non-code dependencies (pilot camps).
- Port from Domino: `apps/web/lib/birth-number.ts` (parseBirthNumber), `apps/web/app/prihlaska/components/` (field set reference), `apps/api/src/participant-export/` (column naming reference).
- Keys are stable forever once Registrations exist; renaming means migrations.

## Comments

2026-11-07 - **From issue 28.** The engine takes the catalogue as `StandardFieldCatalogue` (`@repo/schema/form-engine`): per stable key a scope, a label i18n key and a Zod schema. Rendering will also need each field's input kind and, for lists such as insurers or boarding places, its options; extend `StandardFieldSpec` with them. A key must not equal a core key (`CORE_FIELDS`).

2026-11-07 - **From issue 35.** Registrations store core answers as columns and every other answer as JSON (`registrations.answers`, `participants.answers`) under its key or field id; nothing is encrypted yet, since the catalogue has no sensitive field. With the catalogue, flag sensitive fields on `StandardFieldSpec`, store their answers in an `encrypted()` column beside `answers` (one per scope, sealed once per unit of work with `EncryptionService.cipher()`), split them in `RegistrationService.store`, and add the issue 35 test left open: encrypted answers are ciphertext in the database and only their names reach the audit entry (the submission's audit entry carries the answers today).

2026-11-07 - **From issue 36.** The Přihláška prints custom answers only (`rowsOf` in `modules/registrations/prihlaska/services/prihlaska.service.ts`); standard answers need their Czech labels for documents (the API has no i18n) and must leave out health data (the health note). Rodné číslo prints decrypted, read from its encrypted column only inside the Přihláška job and never logged; that issue 36 criterion waits for this catalogue.

2026-11-07 - **From issue 46.** The Participant export (`ParticipantExportService.build` in `modules/registrations/participant-export/services/participant-export.service.ts`) writes every non-core column of `columnCatalogue`, headed by the custom field's label or else the key: standard fields need Czech header labels there too. Its issue 46 criteria wait for this catalogue: leave the health note column out unless the starting admin holds Health read (store the decision on `participant_exports` when the export starts, since the job runs without the request's membership), decrypt rodné číslo into the file only inside the job, and the `export.create` audit entry should then name the sensitive columns included.
