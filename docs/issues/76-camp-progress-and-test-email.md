# 76 - Camp-wide Consent and document progress, test email

Status: done
Stage: 1b
Episode: E2 Camp setup
Blocked by: 32, 55, 58, 59
Stories: 56, 130, 135

## What to build

The redesigned Camp settings show how each Consent and each requirement Document type is doing across all the Camp's Turnusy: "32 z 38 dětí podepsáno" per Consent and "26 schváleno · 5 ke kontrole · 7 chybí" per requirement. Today this exists only per Turnus as a matrix (`GET /turnusy/:turnusId/consents`) and per Registration. The email texts page also gets "send a test email to myself": the text as edited, rendered with made-up data, sent to the signed-in admin.

## Decisions

- **Counts over Registered Participants** of every Turnus of the Camp; Cancelled Participants and Erased Registrations do not count. A Consent counts as signed when the child's current state is signed (not Withdrawn). A requirement counts as approved when approved or handed in on paper, to review when the latest upload is Pending, missing otherwise.
- **Where.** `GET /camps/:campId/consents` and `GET /camps/:campId/document-types` gain a `progress` per item, present only for admins with Registrations read and null otherwise, since Camp settings read alone gives no view of Registrations.
- **Test email.** `POST /camps/:campId/email-texts/:type/test` with the subject and text, Camp settings write (the same level that edits the text; a read-only admin cannot trigger mail), sent on the stream that email type uses to the signed-in admin's own email only, with the same made-up data as the preview. Rate limited per admin.

## Acceptance criteria

- [ ] In a fixture with two Turnusy, Cancelled Participants and a Withdrawn signature, the Consent counts are right.
- [ ] In a fixture with approved, paper, Pending, returned and missing documents, each requirement's three counts are right and add up to the Registered Participants.
- [ ] Without Registrations read, `progress` is null; with it, counts of Organisation A never include B's Turnusy.
- [ ] The test email reaches only the signed-in admin's address, with the given subject and text and no real Registration's data; nothing else in the body can pick another recipient.
- [ ] The test email is refused with Camp settings read only.
- [ ] The test email is refused past its limit, and refused for an unknown email type or a Camp of another Organisation.

## Notes

- Spec sections: Consents; Documents; Emails.
- Design: canvas "Campie - návrhy designu", artboards `B3-Souhlasy`, `B3-Dokumenty`, `B3-Emaily`. Consumed by the Camp settings Consent, Document type and email text pages.
- Applying one accent colour and logo to all Camps needs no endpoint: a Camp without its own uses the Organisation's (`PATCH /camps/:campId/branding` with null, `DELETE /camps/:campId/branding/logo`).

## Comments

- 2026-11-09: Implemented on `feat/76-camp-progress-test-email`. `GET /camps/:campId/consents` returns `progress: { signed, registered }` and `GET /camps/:campId/document-types` returns `progress: { approved, toReview, missing }` for requirements, each counted in one aggregate query over the Camp's Turnusy (Registered Participants of Registrations not Erased) and null without Registrations read (and for downloads). `POST /camps/:campId/email-texts/:type/test` (Camp settings write) checks placeholders, counts against `TEST_EMAIL_LIMIT_PER_IP` / `TEST_EMAIL_LIMIT_PER_ADMIN`, and queues a job that renders the draft with the preview's made-up data and sends it to the signed-in admin's own address, looked up by the session's admin id. The job payload carries ids and the draft sealed with the Organisation's key, so no typed text reaches Redis in the clear. The Souhlasy and Dokumenty cards show the progress, the E-maily editor has "Poslat zkušební e-mail mně" for writers. Integration tests cover the counts, permissions, tenant isolation, recipients, header injection, unknown type and placeholder, and the per-admin limit.
