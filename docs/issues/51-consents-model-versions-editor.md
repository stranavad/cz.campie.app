# 51 - Consents: model, versions, editor

Status: done
Stage: 1b
Episode: E7 Consents
Blocked by: 12, 24
Stories: 125, 127, 128, 129

## What to build

An admin with Camp settings write creates Consents for a Camp. A Consent has versions; each version has a title, an introduction, items of three kinds (information only, must agree, yes/no), a withdrawable flag and an optional attached PDF stored through the encrypted file service, whose fingerprint (hash) is recorded. Editing a published Consent creates a new version; existing signatures stay tied to the version they signed. Consents are visible to guardians only when the Consents module is on for the Camp. The admin UI lists Consents, shows versions and lets the admin preview what guardians will see.

## Acceptance criteria

- [x] Creating and publishing a Consent stores version 1 with items and flags; editing creates version 2 and leaves version 1 unchanged.
- [x] Attaching a PDF stores ciphertext in storage and the fingerprint on the version; replacing it creates a new version.
- [x] Item kinds are validated: information-only items carry no answer, must-agree and yes/no do.
- [x] Camp settings read can view but not change; none gets 403.
- [x] Consents of Organisation A are invisible to Organisation B's admins.
- [x] Every create and publish is audited.

## Notes

- Spec sections: Consents; Files.
- Port from Domino: `apps/api/src/consent/services/consent.service.ts`, `apps/api/src/consent/admin-consent.controller.ts`, `apps/api/src/consent/schema/`.
- Domino has two fixed Consent types; here they are data. Starter presets are issue 52.

## Comments

2026-11-07 - **Done.** New module `consents` (`@repo/schema/consents`, `apps/api/src/modules/consents`). `consents` per Camp, `consent_versions` (title, introduction, items with stable ids, withdrawable, PDF id with its SHA-256), and `consent_files` (every PDF uploaded for a Camp's Consents with the SHA-256 of its bytes); the API role can neither update nor delete versions or file records. `POST /camps/:campId/consents` creates and publishes version 1 (`consent.create`, `consent.publish`); `PUT /camps/:campId/consents/:consentId` publishes changed content as the next version under the Consent's lock (unchanged content publishes nothing); `POST /camps/:campId/consent-files` uploads a PDF (`consent_file.create`). Reads take Camp settings read, changes write. `checkConsentAnswers` in the schema module checks a signer's answers against a version's items (an information item takes none, must-agree takes agreement, yes/no either), for issue 53. Admin UI: "Souhlasy" on the Camp page with the list, the editor beside a preview of what guardians see, and every version. Guardians see nothing yet: showing Consents only when the Camp's `consents` module is on is issue 53's.
