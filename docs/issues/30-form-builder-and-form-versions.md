# 30 - Form builder and form versions

Status: done
Stage: 1a
Episode: E2 Camp setup
Blocked by: 24, 28
Stories: 41, 42, 43, 44, 45, 47, 48, 49, 50

## What to build

The admin form builder for a Camp's registration form. A new Camp starts with a preset draft that can be published unchanged. An admin with Camp settings write sets each standard field to off, optional or required, adds, edits, removes and reorders custom fields, sets surcharges and the verification flag, and sets the maximum Participants per Registration. They preview the draft exactly as guardians will see it, then publish: publishing creates an immutable form version stored with all labels. The draft is separate from the published version so editing never affects live guardians until publish. The public form always uses the latest published version.

## Acceptance criteria

- [x] New Camp has a preset draft; publishing it without edits yields version 1.
- [x] Edits change only the draft; the public endpoint keeps serving the last published version until publish.
- [x] Each publish creates a new immutable version; previous versions remain readable and unchanged.
- [x] Publishing is blocked while the Organisation is not approved only for public visibility; the version itself can be created (preview before approval, story 17).
- [x] Validation through the form engine: no duplicate field ids, choice fields need options, reorder only within custom fields.
- [x] Camp settings read can view and preview; none gets 403.
- [x] Publish writes an audit entry naming the version.
- [x] Tenant isolation tests.
- [x] Admin UI: builder, preview rendering with the same components as the public form (issue 34 reuses them).

## Notes

- Spec sections: Form engine.
- Registrations keep the version they were submitted under; new and removed fields on existing Registrations are handled in issues 41 and 44.
- Health note switching off by default with the Health record module is stage 2.

## Comments

2026-11-07 - **From issue 28.** `formDefinitionSchema(catalogue)` validates a definition. `diffVersions` also answers `changed`: custom ids kept with another type or scope, whose earlier answers no longer fit. Publishing such a version should be refused (or the builder should give a changed field a new id).

2026-11-07 - **Implemented.** The Camp settings page has a Přihláška section: most children per Registration, the standard fields (none until issue 29 fills `REGISTRATION_FIELD_CATALOGUE`), custom fields added, edited, removed and moved within their own section, Save draft, Save and publish, and a preview.

- API: `GET /camps/:campId/registration-form` (draft, preset when never saved, and the latest version), `PUT .../registration-form/draft`, `POST .../registration-form/versions` (publish), `GET .../registration-form/versions/:version`; read with Camp settings read, changes with write. `GET /public-camps/:slug/registration-form` serves guardians the latest version, by a current or former slug, and nothing before the first publish or while the Organisation is not approved.
- Storage: `registration_forms` holds a Camp's draft and most children (default 4, at most 10); `registration_form_versions` holds published versions, which the API's role may insert and read but never change or remove (custom migration). Publishes of one Camp run one after another under a lock on its draft, numbered from 1.
- Publish re-checks the draft against the catalogue (409 `form_definition_invalid`) and refuses a custom field with another type or scope than in any earlier version (409 `form_field_changed`). Audit: `registration_form.update` with the old and new draft, `registration_form_version.create` naming the version.
- `RegistrationField` (`apps/app/src/core/registration-form`) renders one field as guardians see it; the builder's preview uses it, and the public form (issue 34) will too.
