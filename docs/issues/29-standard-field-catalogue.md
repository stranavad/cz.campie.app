# 29 - Standard field catalogue

Status: done
Stage: 1a
Episode: E2 Camp setup
Blocked by: 28
Stories: 42, 46

## What to build

Freeze the list of standard fields of the registration form with their platform keys, Czech labels, validators and sensitivity: gender, rodné číslo (format and checksum, consistency with birth date, encrypted), zdravotní pojišťovna (code list), child address, guardian address, t-shirt size, health note (encrypted, treated as health data), Camp friend, transport (boarding places defined by the Camp), how did you hear. The human decision is which fields belong in the catalogue and their exact options; this needs the pilot camps' paper exercise mapping their přihlášky onto the design. After the decision an agent implements the catalogue as data plus validators consumed by the form engine, and the Camp's boarding-place list editor.

## Acceptance criteria

- [x] Decision recorded: final field list with keys, option lists and which are encrypted (owner: project lead, input: pilot camps). Draft decided by the project lead on 2026-11-08; pilot camp review pending, see the comments.
- [x] Catalogue implemented as data in the schema package; each validator unit-tested (rodné číslo checksum and birth-date consistency, insurer codes).
- [x] Boarding places are defined per Camp by an admin with Camp settings write; transport answers reference them.
- [x] Sensitive fields are flagged so storage encrypts them and audit records only field names.

## Notes

- Spec sections: Form engine; Encryption; Non-code dependencies (pilot camps).
- Port from Domino: `apps/web/lib/birth-number.ts` (parseBirthNumber), `apps/web/app/prihlaska/components/` (field set reference), `apps/api/src/participant-export/` (column naming reference).
- Keys are stable forever once Registrations exist; renaming means migrations.

## Comments

2026-11-07 - **From issue 28.** The engine takes the catalogue as `StandardFieldCatalogue` (`@repo/schema/form-engine`): per stable key a scope, a label i18n key and a Zod schema. Rendering will also need each field's input kind and, for lists such as insurers or boarding places, its options; extend `StandardFieldSpec` with them. A key must not equal a core key (`CORE_FIELDS`).

2026-11-07 - **From issue 35.** Registrations store core answers as columns and every other answer as JSON (`registrations.answers`, `participants.answers`) under its key or field id; nothing is encrypted yet, since the catalogue has no sensitive field. With the catalogue, flag sensitive fields on `StandardFieldSpec`, store their answers in an `encrypted()` column beside `answers` (one per scope, sealed once per unit of work with `EncryptionService.cipher()`), split them in `RegistrationService.store`, and add the issue 35 test left open: encrypted answers are ciphertext in the database and only their names reach the audit entry (the submission's audit entry carries the answers today).

2026-11-07 - **From issue 36.** The Přihláška prints custom answers only (`rowsOf` in `modules/registrations/prihlaska/services/prihlaska.service.ts`); standard answers need their Czech labels for documents (the API has no i18n) and must leave out health data (the health note). Rodné číslo prints decrypted, read from its encrypted column only inside the Přihláška job and never logged; that issue 36 criterion waits for this catalogue.

2026-11-07 - **From issue 46.** The Participant export (`ParticipantExportService.build` in `modules/registrations/participant-export/services/participant-export.service.ts`) writes every non-core column of `columnCatalogue`, headed by the custom field's label or else the key: standard fields need Czech header labels there too. Its issue 46 criteria wait for this catalogue: leave the health note column out unless the starting admin holds Health read (store the decision on `participant_exports` when the export starts, since the job runs without the request's membership), decrypt rodné číslo into the file only inside the job, and the `export.create` audit entry should then name the sensitive columns included.

2026-11-08 - **Decision (project lead).** The catalogue is drafted from Tábor Domino's přihláška and the spec; the pilot camp, Šťastné a veselé tábory (stastneaveseletabory.cz), adjusts it before it is frozen. The acceptance criterion on the decision is ticked as this draft decision, the pilot review still pending. Keys are stable once real Registrations exist, so renames and removals must land before the first one. Also decided: a Camp may mark a custom field as health data; it is encrypted like the health note, stays off the Přihláška, needs Health read to be seen (admin detail, exports) and Health write to be changed by an admin, and the audit records only its name.

2026-11-08 - **Draft field list.** `REGISTRATION_FIELD_CATALOGUE` in `@repo/schema/camps`, by key: how it is filled in, its options, its sensitivity.

- Per child: `gender` choice `boy`, `girl`; `birthNumber` rodné číslo (format, checksum, agrees with the birth date; stored as `RRMMDD/XXXX`), **encrypted**; `insurer` choice of the Czech public insurers `111`, `201`, `205`, `207`, `209`, `211`, `213`; `participantAddress` text on one line; `tshirtSize` choice `116`, `128`, `140`, `152`, `164`, `xs`, `s`, `m`, `l`, `xl`, `xxl`; `healthNote` long text, **health data**; `campFriend` text.
- Per Registration: `guardianAddress` text; `transport` own transport (`own`) or one of the Camp's boarding places; `howDidYouHear` choice `friends`, `returning`, `internet`, `social`, `school`, `print`, `other`.
- Preset draft of a new Camp: gender, rodné číslo, insurer, child's address, health note, Camp friend and how did you hear optional; t-shirt, guardian's address and transport off.

2026-11-08 - **Done.** Form engine: `StandardFieldSpec` carries `input` (`text`, `long_text`, `birth_number`, `choice`, `camp_choice`), the platform's options by i18n key, a `sensitivity` (`plain`, `encrypted`, `health`) and an optional `agrees` check against the scope's other answers (rodné číslo against birth date, code `form_birth_number_mismatch`; `checkAnswersTo` takes the stored answers for it). A definition's standard entry may carry `options`, the Camp's own options of a `camp_choice` field: transport's boarding places live in the Camp's form, edited in the builder (Camp settings write) and frozen with each version, so a removed place keeps its label on the Registrations that chose it; a transport answer is the place's id. Custom fields carry `health`; a health field takes no surcharge (`form_health_surcharge`, since a price line would tell it) and cannot change its mark under its id (`form_field_changed`); a migration marks every earlier custom field `health: false`. `sensitiveKeys`, `fieldSensitivity`, `chosenOption` and `FormColumn.sensitivity` tell the rest. `parseBirthNumber` is ported into `@repo/schema/camps` with unit tests.

API: encrypted and health answers are sealed together as one `encrypted_answers` value beside `answers` on `registrations` and `participants` (`sealAnswers` and `openAnswers` in `modules/registrations/answers/`), on submission, admin create and edit, and guardian answers in the portal, and cleared on erasure. Audit entries hold plain answers by value and the encrypted ones by name only (`AuditEvent.encryptedFields`). The admin detail shows health answers only with Health read and audits each such view (`health_answers.view`); the history names health fields only with Health read; an admin's change of health data needs Health write (403 `permission_denied`). The Přihláška prints standard answers in Czech (`standard-field-texts.ts`, the API's copy of the app's texts), decrypts the rodné číslo inside its job and leaves health data out. The Participant export heads standard columns in Czech, keeps `include_health` on `participant_exports` from the starting admin's Health read, decrypts only when a sensitive column is chosen, and its `export.create` entry names `sensitiveColumns`. App: standard fields render by how they are filled in, in the public form, the portal, admin create and edit; the builder edits boarding places and the health mark; the detail shows chosen options by name.

Open for the pilot review: a surcharge per boarding place (only custom fields carry one now), a split address (street, town, postcode), how-did-you-hear as a choice versus free text, and children without a Czech rodné číslo or insurer (leave those fields optional).
