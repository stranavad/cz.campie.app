# 36 - Přihláška PDF with QR platba

Status: done
Stage: 1a
Episode: E3 Public registration
Blocked by: 15, 35
Stories: 73, 83, 119

## What to build

A background job generates one Přihláška PDF per Participant after submission and stores it through the encrypted file service. The template is rendered by the PDF pipeline from the Registration's form version (labels as they were), the Participant and guardian data without health data, the frozen price breakdown of the whole Registration, payment instructions with the Variable symbol, the Organisation's bank account and a QR platba for the amount due now, the declarations as short labels, and the Organisation's legal identity and Camp branding. Wording is fixed by the platform and phrased so camp data needs no Czech declension. The document is a snapshot of the submission and never shows later payments. Exactly one A4 page; overlong text is cut.

## Acceptance criteria

- [x] Job renders through the PDF port fake in tests and stores ciphertext through storage; the Participant points to the stored file.
- [x] QR payload (SPAYD) contains the Organisation's account, amount due now, Variable symbol and a message; unit-tested.
- [x] Custom field labels come from the Registration's form version, not the current one.
- [x] Rodné číslo decrypted only during rendering; never logged.
- [x] A regenerate function exists for admin use (wired in issue 45).
- [x] Job carries the Organisation in its payload and runs inside its unit of work.

## Notes

- Spec sections: Generated documents and printouts; Payments.
- Port from Domino: `packages/printouts/src/printouts/Prihlaska.tsx`, `apps/api/src/pdf/services/pdf.service.ts` (qrcode + spayd), `apps/api/src/pdf/services/prihlaska.helpers.ts` and its spec.

## Comments

2026-11-07 - **From issue 35.** Submission enqueues `registrationSubmittedJob` (`modules/registrations/registration/registration-submitted.job.ts`, payload `{ registrationId }`); its handler only tells the Camp's team today (`RegistrationService.notifyTeam`). Generate the PDFs from that job or a job it enqueues. The frozen price lines are `price_lines` (ordered by `position`, a Participant's by `participant_id`), the Deposit owed first is `registrations.deposit_total`, the form version is `registrations.form_version_id`, the declaration answers `declaration_answers`.

2026-11-07 - **Done.** Submission enqueues `registrations.generate-prihlasky` (`modules/registrations/prihlaska/`), which renders one Přihláška per Participant through the PDF pipeline, stores it encrypted and points `participants.prihlaska_file_id` to it; a failed attempt rolls back its files. The page shows the Camp's branding (`DocumentService` takes an optional `DocumentBranding`) and the Organisation's legal identity, the Turnus, the Participant, the other children, guardians, custom answers with the labels of the Registration's form version, the frozen price lines, the payment (account, Variable symbol, the Deposit or whole price due now with its date, the rest and the whole outstanding amount as the other option, and the QR platba of the amount due now) and the declarations as one-line labels. One A4 page: payment and price come first and the content box is cut at the foot, so a cut only takes answers or declarations. QR platba and payment instructions are pure (`@repo/schema/payments`: `qrPlatbaOf`, `ibanOf`, `paymentInstructionsOf`), unit-tested. `PrihlaskaService.regenerate` replaces one Participant's file under a row lock and removes the old one. Czech date and money formats moved to `@repo/schema/shared` (`czechDate`, `czechDateTime`, `czk`). Not done: rodné číslo, since the standard field catalogue has none yet (issue 29).

2026-11-08 - **Decision by the project lead: a second QR platba for the whole outstanding amount.** While the amount due now differs from all outstanding (the Deposits are owed), the Přihláška prints two QR codes side by side, "Záloha" for the amount due now and "Vše najednou" for everything outstanding (`PaymentInstructions.balance.qrPlatba`, drawn as SVG in `PrihlaskaService`); paying in full or once the Deposits are covered there is only one. The portal already showed the second QR the same way (issue 40). The payment block of the emails still shows the whole amount as a row without its own QR.

2026-11-08 - **Closed by issue 29.** The criterion that waited for the standard field catalogue is met there; see its comment.
