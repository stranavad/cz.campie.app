# 43 - Registration detail and change history

Status: done
Stage: 1a
Episode: E6 Admin Registrations
Blocked by: 38, 42
Stories: 108, 111, 120

## What to build

One admin screen answering any guardian question: everything submitted (rendered with labels from the Registration's form version, plus fields added later and removed fields marked), the guardians and access emails, the Participants and their states, the price breakdown with adjustments, the payment ledger with forms to add entries (issue 38), declaration answers, and the change history of this Registration from the audit log. Later modules (documents, Consents, health) add their panels. Read access shows everything read-only.

## Acceptance criteria

- [x] Detail endpoint returns the data above; requires Registrations read.
- [x] Labels come from the submitted form version; later-added fields shown as unanswered; removed fields marked.
- [x] Encrypted fields are decrypted only for this response and their views are not logged unless they are health data (stage 2).
- [x] History lists audit entries targeting the Registration and its Participants with actor, time and changes; encrypted fields show names only.
- [x] Unverified Claimed discounts can be confirmed here (audited).
- [x] Cross-tenant and guessed ids return 404.

## Notes

- Spec sections: Admin Registrations stories; Identity, permissions and audit.
- Port from Domino: `apps/portal/src/pages/admin/RegistrationDetail.vue`, `apps/api/src/admin-registration/services/admin-registration.service.ts`.

## Comments

2026-11-07 - **From issue 38.** The ledger API is ready without a UI: `GET /registrations/:id/ledger` (Registrations read) returns payments, Price adjustments, total, paid, balance, payment status, amount due now and Overdue; `POST /registrations/:id/payments` (`kind` payment or correction, amount, `paidOn`, note, required for a correction) and `POST /registrations/:id/price-adjustments` (Registrations write) return the ledger again. Refusals: 409 `correction_exceeds_paid`, `price_adjustment_below_zero`. Show and add them in the Registration detail.

2026-11-07 - **From issue 42.** The Participant list (`/platform/prihlasky`, `ParticipantListService`) flags `unverifiedClaimedDiscount` from the answers and form version; once Claimed discounts can be confirmed here, store the confirmations and leave confirmed ones out of the flag. Make the list's rows open the detail.

2026-11-07 - **Done.** `GET /registrations/:id` (Registrations read) returns the Registration in full: guardians, Participants (Age on start, state, Přihláška link), answers per scope labelled as the submitted form version asked them (`answered`), fields added later (`added`, unanswered or answered in the portal) and fields the latest form dropped (`removed`), chosen options by their labels (`withOptionLabels`), the frozen price lines, the ledger (issue 38), the declaration answers with their time, and the Claimed discounts needing verification with their confirmation. `GET /registrations/:id/history` lists the audit entries of the Registration and its Participants, newest first, admins by email; the submission's entry no longer repeats the guardian's IP address inside its changes. `POST /registrations/:id/claimed-discounts/verify` (write) confirms one, audited once (`claimed_discount_verifications`); the Participant list's unverified filter leaves confirmed ones out. Admin page `/platform/prihlasky/:id` with the ledger forms; list rows open it. Access emails do not exist yet (the spec's admin-added access emails need their own issue). Encrypted fields do not exist yet (issue 29), so nothing is decrypted here; the history shows encrypted field names only, as the audit stores them.
