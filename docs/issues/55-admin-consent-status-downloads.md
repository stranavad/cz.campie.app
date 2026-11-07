# 55 - Admin Consent status and downloads

Status: done
Stage: 1b
Episode: E7 Consents
Blocked by: 53
Stories: 130, 131

## What to build

Admins with Registrations read see, per Participant and Consent, whether it is unsigned, signed or Withdrawn, including which version was signed and the Declined items, on the Registration detail and as a Turnus-level matrix. They can download any signed Consent PDF (current or superseded) through a short-lived download link. Reminder sending for unsigned Consents is part of the open-items reminder (issue 60).

## Acceptance criteria

- [x] Status per Participant and Consent is correct for unsigned, signed, superseded and Withdrawn cases.
- [x] Downloading a signed PDF returns a short-lived link to the API's decrypting endpoint; the link expires.
- [x] Registrations none gets 403; a guessed signature id from another Organisation yields 404.
- [x] Downloads are audited.

## Notes

- Spec sections: Consents; Files.
- Port from Domino: `apps/api/src/consent/admin-consent.controller.ts`.

## Comments

2026-11-07 - **Done.** Registrations read: `GET /registrations/:id/consents` shows each child's Consents with the state by the newest signature (unsigned, signed, withdrawn), the yes/no items the signature in force declined, and every signature newest first (version, signer, time, withdrawal, superseded, whether its PDF exists); `GET /turnusy/:turnusId/consents` is the Turnus matrix of Registered children against the Camp's Consents; `POST /consent-signatures/:signatureId/download` audits `consent_signature.download` and answers a five-minute link to any signed PDF, superseded ones included (another Organisation's id is a 404). UI: "Souhlasy" on the Registration detail with a PDF button per signature, and "Přehled souhlasů" on the participants page.
