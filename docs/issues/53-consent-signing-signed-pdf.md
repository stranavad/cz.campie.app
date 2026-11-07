# 53 - Consent signing and signed PDF

Status: done
Stage: 1b
Episode: E7 Consents
Blocked by: 15, 39, 51
Stories: 91, 92, 93, 94, 95, 98

## What to build

In the portal, either guardian opens a Participant's Consent, reads it in full including any attached PDF, answers the yes/no items and signs by typing their name and place. Signing is refused unless every must-agree item is agreed. The API stores the Participant, the Consent version, typed name and place, answers, time, IP address, browser and the verified email of the guardian session, then generates a signed PDF (full wording, answers, evidence, the Organisation's legal identity and branding) through the PDF pipeline and stores it encrypted. The signed copy is emailed to both guardians when that email type is on. This is a simple electronic signature only.

## Acceptance criteria

- [x] Signing without agreeing to a must-agree item returns a validation error naming the item.
- [x] A signature stores version id, answers, typed name and place, time, IP, user agent and the session's email.
- [x] A signed PDF is generated as a background job, handed to storage as ciphertext and linked to the signature.
- [x] Either guardian of the Registration can sign; an access email can sign too; a guardian of another family gets 404.
- [x] A guardian session of Organisation B cannot read or sign Organisation A's Consents.
- [x] Signing is audited with actor guardian.
- [x] The signed copy email goes to both guardians with the PDF attached and respects the Camp's switch.

## Notes

- Spec sections: Consents; Generated documents; Emails.
- Port from Domino: `apps/api/src/consent/parent-consent.controller.ts`, `apps/api/src/consent/services/consent.service.ts`, `apps/portal/src/pages/parent/ParticipantConsentSign.vue`.
- Branding and legal identity are template inputs (one PDF pipeline).

## Comments

2026-11-07 - **From issue 51.** Versions are `ConsentRepository.listVersionsOf` / `listNewestVersionsOf` (`repositories/consents/consent/`); a signature names the `consent_versions.id`. Validate answers with `checkConsentAnswers(version.items, answers)` from `@repo/schema/consents`. Show a Camp's Consents to guardians only while the Camp's `consents` module is on; the version's PDF is `file_id` with `file_sha256`, which the signed PDF should print as evidence.

2026-11-07 - **Done.** Portal: `GET /portal/registrations/:id/consents` lists every Consent of the Camp (newest version) for each Registered child with its state (unsigned or signed, the version signed, the signed PDF's link); empty while the Camp's Consents module is off. `GET .../participants/:participantId/consents/:consentId` shows the newest version in full; `POST .../signatures` signs it by typed name and place for guardians and access emails alike: refused with 409 `consent_version_outdated` when a newer version was published since it was read (the Consent is locked while signing), and 400 `consent_answers_invalid` with a field per item (`['answers', itemId]`) from `checkConsentAnswers`. `consent_signatures` keeps the version, answers, name, place, the session's email, IP address, user agent and time; the API role can only add signatures and attach the PDF once (`file_id` column grant). Signing is audited `consent.sign` (actor guardian, target the Participant). `consents.generate-signed-consent` renders `SignedConsentDocument` (full wording, answers, the attached PDF's SHA-256, the evidence, Camp branding with the Organisation's legal identity), stores it encrypted, and enqueues `consents.send-consent-copy` per guardian (the Camp's `consent_copy`, PDF attached). Portal: "Souhlasy" on each Registration, a page per Registration with each child's Consents and the form to read and sign.
