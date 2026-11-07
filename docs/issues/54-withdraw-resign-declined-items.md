# 54 - Withdraw, re-sign, Declined items

Status: done
Stage: 1b
Episode: E7 Consents
Blocked by: 53
Stories: 96, 97

## What to build

A guardian can withdraw a signature on a withdrawable Consent; the state becomes Withdrawn and the signed PDF is kept. A guardian can sign a Consent again to change answers; the new signature becomes current and earlier ones are superseded and kept. A new Consent version never invalidates existing signatures and nobody is forced to re-sign. Declined items (yes/no items answered no) are read from current signatures only, exposed as a per-Participant query that later printouts and filters use.

## Acceptance criteria

- [x] Withdrawing a non-withdrawable Consent is refused.
- [x] After withdrawal the state is Withdrawn and the previous signed PDF is still downloadable.
- [x] Re-signing creates a new current signature; the previous one is marked superseded, not deleted.
- [x] Publishing a new Consent version leaves existing signatures current and the state signed.
- [x] Declined items reflect only current, non-withdrawn signatures.
- [x] Withdrawal and re-signing are audited.

## Notes

- Spec sections: Consents.
- Port from Domino: `apps/api/src/consent/services/consent.service.ts`; Declined items logic near `apps/api/src/admin-registration/services/admin-registration.service.ts` and `apps/portal/src/pages/admin/DeclinedItems.vue`.

## Comments

2026-11-07 - **From issue 53.** Signatures are `consent_signatures` (`ConsentSignatureRepository`, `modules/consents/signature/`); the newest per Participant and Consent counts (`listNewestOf`), so signing again already supersedes. The API role may not update or delete signatures, so record a withdrawal in its own table rather than on the signature; the state then becomes withdrawn when the newest event is a withdrawal.

2026-11-07 - **Done.** `POST /portal/registrations/:id/participants/:participantId/consents/:consentId/withdrawal` withdraws the child's newest signature when the version it signed is withdrawable (409 `consent_not_withdrawable`, or `consent_not_signed` without a signature in force), recorded in `consent_withdrawals` (append-only: who, IP address, when) and audited `consent.withdraw`; the signature and its PDF stay, and a copy not yet sent is not sent. The state per child and Consent is `unsigned`, `signed` or `withdrawn` by the newest signature; signing again adds a signature that supersedes the earlier ones, all kept; a new version leaves signatures as they are. `ConsentSignatureService.declinedItemsOf(participantIds)` lists the yes/no items answered no by signatures in force (newest, not withdrawn), for printouts and filters. Anyone who may sign for the Registration (guardians and access emails) may withdraw. Portal: "Odvolat souhlas" with a confirming second click, and the Withdrawn state in the list.
