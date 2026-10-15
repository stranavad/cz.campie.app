# 54 - Withdraw, re-sign, Declined items

Status: ready-for-agent
Stage: 1b
Episode: E7 Consents
Blocked by: 53
Stories: 96, 97

## What to build

A guardian can withdraw a signature on a withdrawable Consent; the state becomes Withdrawn and the signed PDF is kept. A guardian can sign a Consent again to change answers; the new signature becomes current and earlier ones are superseded and kept. A new Consent version never invalidates existing signatures and nobody is forced to re-sign. Declined items (yes/no items answered no) are read from current signatures only, exposed as a per-Participant query that later printouts and filters use.

## Acceptance criteria

- [ ] Withdrawing a non-withdrawable Consent is refused.
- [ ] After withdrawal the state is Withdrawn and the previous signed PDF is still downloadable.
- [ ] Re-signing creates a new current signature; the previous one is marked superseded, not deleted.
- [ ] Publishing a new Consent version leaves existing signatures current and the state signed.
- [ ] Declined items reflect only current, non-withdrawn signatures.
- [ ] Withdrawal and re-signing are audited.

## Notes

- Spec sections: Consents.
- Port from Domino: `apps/api/src/consent/services/consent.service.ts`; Declined items logic near `apps/api/src/admin-registration/services/admin-registration.service.ts` and `apps/portal/src/pages/admin/DeclinedItems.vue`.
