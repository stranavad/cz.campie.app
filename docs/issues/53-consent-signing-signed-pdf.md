# 53 - Consent signing and signed PDF

Status: ready-for-agent
Stage: 1b
Episode: E7 Consents
Blocked by: 15, 39, 51
Stories: 91, 92, 93, 94, 95, 98

## What to build

In the portal, either guardian opens a Participant's Consent, reads it in full including any attached PDF, answers the yes/no items and signs by typing their name and place. Signing is refused unless every must-agree item is agreed. The API stores the Participant, the Consent version, typed name and place, answers, time, IP address, browser and the verified email of the guardian session, then generates a signed PDF (full wording, answers, evidence, the Organisation's legal identity and branding) through the PDF pipeline and stores it encrypted. The signed copy is emailed to both guardians when that email type is on. This is a simple electronic signature only.

## Acceptance criteria

- [ ] Signing without agreeing to a must-agree item returns a validation error naming the item.
- [ ] A signature stores version id, answers, typed name and place, time, IP, user agent and the session's email.
- [ ] A signed PDF is generated as a background job, handed to storage as ciphertext and linked to the signature.
- [ ] Either guardian of the Registration can sign; an access email can sign too; a guardian of another family gets 404.
- [ ] A guardian session of Organisation B cannot read or sign Organisation A's Consents.
- [ ] Signing is audited with actor guardian.
- [ ] The signed copy email goes to both guardians with the PDF attached and respects the Camp's switch.

## Notes

- Spec sections: Consents; Generated documents; Emails.
- Port from Domino: `apps/api/src/consent/parent-consent.controller.ts`, `apps/api/src/consent/services/consent.service.ts`, `apps/portal/src/pages/parent/ParticipantConsentSign.vue`.
- Branding and legal identity are template inputs (one PDF pipeline).
