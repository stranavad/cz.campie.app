# 30 - Form builder and form versions

Status: ready-for-agent
Stage: 1a
Episode: E2 Camp setup
Blocked by: 24, 28
Stories: 41, 42, 43, 44, 45, 47, 48, 49, 50

## What to build
The admin form builder for a Camp's registration form. A new Camp starts with a preset draft that can be published unchanged. An admin with Camp settings write sets each standard field to off, optional or required, adds, edits, removes and reorders custom fields, sets surcharges and the verification flag, and sets the maximum Participants per Registration. They preview the draft exactly as guardians will see it, then publish: publishing creates an immutable form version stored with all labels. The draft is separate from the published version so editing never affects live guardians until publish. The public form always uses the latest published version.

## Acceptance criteria
- [ ] New Camp has a preset draft; publishing it without edits yields version 1.
- [ ] Edits change only the draft; the public endpoint keeps serving the last published version until publish.
- [ ] Each publish creates a new immutable version; previous versions remain readable and unchanged.
- [ ] Publishing is blocked while the Organisation is not approved only for public visibility; the version itself can be created (preview before approval, story 17).
- [ ] Validation through the form engine: no duplicate field ids, choice fields need options, reorder only within custom fields.
- [ ] Camp settings read can view and preview; none gets 403.
- [ ] Publish writes an audit entry naming the version.
- [ ] Tenant isolation tests.
- [ ] Admin UI: builder, preview rendering with the same components as the public form (issue 34 reuses them).

## Notes
- Spec sections: Form engine.
- Registrations keep the version they were submitted under; new and removed fields on existing Registrations are handled in issues 41 and 44.
- Health note switching off by default with the Health record module is stage 2.
