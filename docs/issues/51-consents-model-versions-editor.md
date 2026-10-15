# 51 - Consents: model, versions, editor

Status: ready-for-agent
Stage: 1b
Episode: E7 Consents
Blocked by: 12, 24
Stories: 125, 127, 128, 129

## What to build

An admin with Camp settings write creates Consents for a Camp. A Consent has versions; each version has a title, an introduction, items of three kinds (information only, must agree, yes/no), a withdrawable flag and an optional attached PDF stored through the encrypted file service, whose fingerprint (hash) is recorded. Editing a published Consent creates a new version; existing signatures stay tied to the version they signed. Consents are visible to guardians only when the Consents module is on for the Camp. The admin UI lists Consents, shows versions and lets the admin preview what guardians will see.

## Acceptance criteria

- [ ] Creating and publishing a Consent stores version 1 with items and flags; editing creates version 2 and leaves version 1 unchanged.
- [ ] Attaching a PDF stores ciphertext in storage and the fingerprint on the version; replacing it creates a new version.
- [ ] Item kinds are validated: information-only items carry no answer, must-agree and yes/no do.
- [ ] Camp settings read can view but not change; none gets 403.
- [ ] Consents of Organisation A are invisible to Organisation B's admins.
- [ ] Every create and publish is audited.

## Notes

- Spec sections: Consents; Files.
- Port from Domino: `apps/api/src/consent/services/consent.service.ts`, `apps/api/src/consent/admin-consent.controller.ts`, `apps/api/src/consent/schema/`.
- Domino has two fixed Consent types; here they are data. Starter presets are issue 52.
