# 28 - Form engine pure module

Status: done
Stage: 1a
Episode: E2 Camp setup
Blocked by: 02
Stories: 42, 43, 44, 45, 47, 48, 50

## What to build

A pure form engine in the shared schema package, used for the registration form now and the Health record in stage 2. A form definition is an ordered set of fields in three tiers: locked core, standard fields (state off, optional or required, with platform-known keys and validators supplied by a catalogue, see issue 29) and custom fields. Custom field types: short text, long text, single choice, multiple choice, yes/no, number, date; each with label, hint, required flag, scope (per Participant or per Registration) and, for choice options and yes/no, a per-child surcharge that may be positive (Paid extra) or negative (Claimed discount, optionally flagged as needing verification). Sections have a fixed order; only custom fields are reorderable. The module validates a submission against a definition producing field-level errors with i18n keys, derives the export column catalogue, and compares two versions to report added and removed fields (needed for new fields on existing Registrations).

## Acceptance criteria

- [x] Pure tests: each field type's validation, required vs optional, per-Participant vs per-Registration answers, unknown answer keys rejected.
- [x] Standard field with state off is neither rendered nor accepted; required standard field is enforced.
- [x] Surcharge extraction returns per-child surcharge lines for given answers, including negative ones and the verification flag.
- [x] Version diff returns added and removed field ids between two definitions.
- [x] Column catalogue: union over a list of versions, removed fields marked as removed.
- [x] Errors are i18n keys plus params, never Czech literals.
- [x] The engine also exports a Zod schema built from a definition for API-side validation.
- [x] No I/O, no framework imports.

## Notes

- Spec sections: Form engine.
- No conditional logic, no file-upload fields (out of scope).
- Domino hardcodes its form (`packages/schema/src/registration.ts`, `apps/web/app/prihlaska/components/`); use them only as a reference for the standard field set.

## Comments

2026-11-07 - **Implemented** in `@repo/schema/form-engine`, pure.

- Definition: `FormDefinition` = `{ standard: [{ key, state }], custom: [field] }`; the core (child's first name, last name, birth date; guardian's first name, last name, email, phone) is locked in `CORE_FIELDS` and never named by a definition. `formDefinitionSchema(catalogue)` checks a definition for the builder: known standard keys (never a core key), no field or option twice, verification only on a discount, bounded sizes. The standard catalogue (`StandardFieldCatalogue`: scope, label i18n key, Zod schema per stable key) is an input, so issue 29 supplies it.
- Rendering: `formFields(definition, catalogue, scope)` lists a scope's fields in the fixed order (core, standard switched on, custom in the camp's order), each with tier, key, required and its label key or custom definition. A standard field switched off is neither listed nor accepted.
- Answers: `{ registration: answers, participants: answers[] }`, keyed by core key, standard key or custom field id. `checkSubmission` returns field-level errors (`{ path, code, params? }`, codes in `FORM_ANSWER_ERROR_CODES`) and the normalised submission (text trimmed, email lowercased, empty answers dropped). `submissionSchema(definition, catalogue)` is the same as a Zod schema for the API, the code as each issue's message with its params, and bounds the input (at most 20 children, 300 answers per scope, 10,000 characters per text, 50 chosen options).
- `surchargesOf(definition, submission)` gives each child's surcharge lines (field and option ids, label, amount, verification flag) in the shape pricing takes; a per-Registration answer's surcharge lands on every child.
- Versions: `diffVersions(earlier, later)` answers added, removed (a standard field switched off counts) and changed (a custom id kept with another type or scope) keys; `columnCatalogue(versions, catalogue)` lists the core, then every field the latest version asks, then fields only earlier ones asked, marked removed.
