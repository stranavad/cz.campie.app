# 52 - Starter Consents

Status: done
Stage: 1b
Episode: E7 Consents
Blocked by: 51
Stories: 126

## What to build

Ship editable starter Consents derived from Domino's GDPR consent and Operational consent, offered when an admin creates a Consent so they adapt a working text instead of a blank page. Before this can be done, a person must confirm that the author of Domino's consent texts agrees to their publication under an open licence (the repository is public under AGPL-3.0). The texts must also be stripped of every Domino-specific name, address and detail and phrased so the camp's data never needs Czech declension.

## Acceptance criteria

- [x] Written permission from the text author for open publication is recorded (who, when, which texts).
- [x] Starter texts contain no Domino-specific names or details.
- [x] An admin can create a Consent from each starter and gets a normal editable draft.
- [x] Starter texts live in the repository as data, not hardcoded in components.

## Notes

- Spec sections: Consents; Further Notes - Dependencies that are not code (Starter Consent texts).
- Source texts: `packages/documents/src/documents/GdprSouhlas.tsx`, `packages/documents/src/documents/ProvozniSouhlasy.tsx`.
- Needs a human: licence confirmation and an editorial pass on the Czech texts.

## Comments

2026-11-08 - **Licence.** On 2026-11-08 the project lead confirmed in writing, in answer to the open-questions form, that they hold permission to publish Domino's consent texts under the repository's open licence (AGPL-3.0), being their author or having the author's written permission. It covers `packages/documents/src/documents/GdprSouhlas.tsx` (GDPR consent) and `packages/documents/src/documents/ProvozniSouhlasy.tsx` (Operational consent) in the Domino repository.

2026-11-08 - **Done.** `STARTER_CONSENTS` in `@repo/schema/consents` (`src/consents/starter/starter-consents.ts`) holds both starters as data: the GDPR consent (withdrawable; four yes/no items for photos in a closed parents' group, promotion, press and partners, names on diplomas and results; an information item on the guardian's rights) and the Operational consent (not withdrawable; seven yes/no items for the night game, moving without a leader on trips and health care; two must-agree declarations on the health data and on liability for damage). Every Domino name, address, web, Facebook group, e-mail and the Turnus interpolation is gone; the texts say "pořadatel" and "tábor" and insert no camp data, so nothing needs declining, and the Organisation's legal identity comes with the signed PDF. On the Camp page "Souhlasy", next to "Nový souhlas", an admin with Camp settings write picks a starter; the editor opens it with fresh item ids as an unsaved new Consent, and saving publishes version 1 through the existing create endpoint (permissions, tenant isolation and audit unchanged from issue 51). The schema test checks each starter is content the API accepts and that no text names the source camp or organiser or uses a dash other than a hyphen. Still for a human: the editorial pass on the Czech texts. Retention periods, the age rule for trips, anaphylaxis listed among the common complaints and the cited sections of law come from Domino as they were; the GDPR starter points to the organiser's own information on processing personal data, which the platform does not supply.
