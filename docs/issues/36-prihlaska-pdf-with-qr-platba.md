# 36 - Přihláška PDF with QR platba

Status: ready-for-agent
Stage: 1a
Episode: E3 Public registration
Blocked by: 15, 35
Stories: 73, 83, 119

## What to build

A background job generates one Přihláška PDF per Participant after submission and stores it through the encrypted file service. The template is rendered by the PDF pipeline from the Registration's form version (labels as they were), the Participant and guardian data without health data, the frozen price breakdown of the whole Registration, payment instructions with the Variable symbol, the Organisation's bank account and a QR platba for the amount due now, the declarations as short labels, and the Organisation's legal identity and Camp branding. Wording is fixed by the platform and phrased so camp data needs no Czech declension. The document is a snapshot of the submission and never shows later payments. Exactly one A4 page; overlong text is cut.

## Acceptance criteria

- [ ] Job renders through the PDF port fake in tests and stores ciphertext through storage; the Participant points to the stored file.
- [ ] QR payload (SPAYD) contains the Organisation's account, amount due now, Variable symbol and a message; unit-tested.
- [ ] Custom field labels come from the Registration's form version, not the current one.
- [ ] Rodné číslo decrypted only during rendering; never logged.
- [ ] A regenerate function exists for admin use (wired in issue 45).
- [ ] Job carries the Organisation in its payload and runs inside its unit of work.

## Notes

- Spec sections: Generated documents and printouts; Payments.
- Port from Domino: `packages/printouts/src/printouts/Prihlaska.tsx`, `apps/api/src/pdf/services/pdf.service.ts` (qrcode + spayd), `apps/api/src/pdf/services/prihlaska.helpers.ts` and its spec.
