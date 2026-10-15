# 55 - Admin Consent status and downloads

Status: ready-for-agent
Stage: 1b
Episode: E7 Consents
Blocked by: 53
Stories: 130, 131

## What to build

Admins with Registrations read see, per Participant and Consent, whether it is unsigned, signed or Withdrawn, including which version was signed and the Declined items, on the Registration detail and as a Turnus-level matrix. They can download any signed Consent PDF (current or superseded) through a short-lived download link. Reminder sending for unsigned Consents is part of the open-items reminder (issue 60).

## Acceptance criteria

- [ ] Status per Participant and Consent is correct for unsigned, signed, superseded and Withdrawn cases.
- [ ] Downloading a signed PDF returns a short-lived link to the API's decrypting endpoint; the link expires.
- [ ] Registrations none gets 403; a guessed signature id from another Organisation yields 404.
- [ ] Downloads are audited.

## Notes

- Spec sections: Consents; Files.
- Port from Domino: `apps/api/src/consent/admin-consent.controller.ts`.
