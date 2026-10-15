# 28 - Form engine pure module

Status: ready-for-agent
Stage: 1a
Episode: E2 Camp setup
Blocked by: 02
Stories: 42, 43, 44, 45, 47, 48, 50

## What to build
A pure form engine in the shared schema package, used for the registration form now and the Health record in stage 2. A form definition is an ordered set of fields in three tiers: locked core, standard fields (state off, optional or required, with platform-known keys and validators supplied by a catalogue, see issue 29) and custom fields. Custom field types: short text, long text, single choice, multiple choice, yes/no, number, date; each with label, hint, required flag, scope (per Participant or per Registration) and, for choice options and yes/no, a per-child surcharge that may be positive (Paid extra) or negative (Claimed discount, optionally flagged as needing verification). Sections have a fixed order; only custom fields are reorderable. The module validates a submission against a definition producing field-level errors with i18n keys, derives the export column catalogue, and compares two versions to report added and removed fields (needed for new fields on existing Registrations).

## Acceptance criteria
- [ ] Pure tests: each field type's validation, required vs optional, per-Participant vs per-Registration answers, unknown answer keys rejected.
- [ ] Standard field with state off is neither rendered nor accepted; required standard field is enforced.
- [ ] Surcharge extraction returns per-child surcharge lines for given answers, including negative ones and the verification flag.
- [ ] Version diff returns added and removed field ids between two definitions.
- [ ] Column catalogue: union over a list of versions, removed fields marked as removed.
- [ ] Errors are i18n keys plus params, never Czech literals.
- [ ] The engine also exports a Zod schema built from a definition for API-side validation.
- [ ] No I/O, no framework imports.

## Notes
- Spec sections: Form engine.
- No conditional logic, no file-upload fields (out of scope).
- Domino hardcodes its form (`packages/schema/src/registration.ts`, `apps/web/app/prihlaska/components/`); use them only as a reference for the standard field set.
