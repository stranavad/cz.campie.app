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
