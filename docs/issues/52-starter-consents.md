# 52 - Starter Consents

Status: ready-for-human
Stage: 1b
Episode: E7 Consents
Blocked by: 51
Stories: 126

## What to build

Ship editable starter Consents derived from Domino's GDPR consent and Operational consent, offered when an admin creates a Consent so they adapt a working text instead of a blank page. Before this can be done, a person must confirm that the author of Domino's consent texts agrees to their publication under an open licence (the repository is public under AGPL-3.0). The texts must also be stripped of every Domino-specific name, address and detail and phrased so the camp's data never needs Czech declension.

## Acceptance criteria

- [ ] Written permission from the text author for open publication is recorded (who, when, which texts).
- [ ] Starter texts contain no Domino-specific names or details.
- [ ] An admin can create a Consent from each starter and gets a normal editable draft.
- [ ] Starter texts live in the repository as data, not hardcoded in components.

## Notes

- Spec sections: Consents; Further Notes - Dependencies that are not code (Starter Consent texts).
- Source texts: `packages/documents/src/documents/GdprSouhlas.tsx`, `packages/documents/src/documents/ProvozniSouhlasy.tsx`.
- Needs a human: licence confirmation and an editorial pass on the Czech texts.
