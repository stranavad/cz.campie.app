# 43 - Registration detail and change history

Status: ready-for-agent
Stage: 1a
Episode: E6 Admin Registrations
Blocked by: 38, 42
Stories: 108, 111, 120

## What to build

One admin screen answering any guardian question: everything submitted (rendered with labels from the Registration's form version, plus fields added later and removed fields marked), the guardians and access emails, the Participants and their states, the price breakdown with adjustments, the payment ledger with forms to add entries (issue 38), declaration answers, and the change history of this Registration from the audit log. Later modules (documents, Consents, health) add their panels. Read access shows everything read-only.

## Acceptance criteria

- [ ] Detail endpoint returns the data above; requires Registrations read.
- [ ] Labels come from the submitted form version; later-added fields shown as unanswered; removed fields marked.
- [ ] Encrypted fields are decrypted only for this response and their views are not logged unless they are health data (stage 2).
- [ ] History lists audit entries targeting the Registration and its Participants with actor, time and changes; encrypted fields show names only.
- [ ] Unverified Claimed discounts can be confirmed here (audited).
- [ ] Cross-tenant and guessed ids return 404.

## Notes

- Spec sections: Admin Registrations stories; Identity, permissions and audit.
- Port from Domino: `apps/portal/src/pages/admin/RegistrationDetail.vue`, `apps/api/src/admin-registration/services/admin-registration.service.ts`.

## Comments

2026-11-07 - **From issue 38.** The ledger API is ready without a UI: `GET /registrations/:id/ledger` (Registrations read) returns payments, Price adjustments, total, paid, balance, payment status, amount due now and Overdue; `POST /registrations/:id/payments` (`kind` payment or correction, amount, `paidOn`, note, required for a correction) and `POST /registrations/:id/price-adjustments` (Registrations write) return the ledger again. Refusals: 409 `correction_exceeds_paid`, `price_adjustment_below_zero`. Show and add them in the Registration detail.

2026-11-07 - **From issue 42.** The Participant list (`/platform/prihlasky`, `ParticipantListService`) flags `unverifiedClaimedDiscount` from the answers and form version; once Claimed discounts can be confirmed here, store the confirmations and leave confirmed ones out of the flag. Make the list's rows open the detail.
