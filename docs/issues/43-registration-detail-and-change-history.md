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
