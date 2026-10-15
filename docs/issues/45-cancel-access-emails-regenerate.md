# 45 - Cancel, Cancel all, access emails, regenerate Přihláška

Status: ready-for-agent
Stage: 1a
Episode: E6 Admin Registrations
Blocked by: 37, 44
Stories: 112, 118, 119

## What to build
An admin with Registrations write cancels a Participant: the place is freed, the record stays, and no money changes; the admin settles storno fees, removed prices or refunds manually with Price adjustments and Correcting payments. "Cancel all" cancels every Participant of a Registration (offered as the keep-data choice when removing a Registration; Erase is issue 66). Guardians cannot cancel. The cancellation email to both guardians states the current balance. The admin adds and removes access emails (grandparent, other household) and removes a guardian. The admin regenerates and downloads a Participant's Přihláška PDF.

## Acceptance criteria
- [ ] Cancel frees capacity immediately (a new submission can take the place) and leaves price lines and ledger untouched.
- [ ] Cancel all cancels each Participant; the Registration has no separate state.
- [ ] Cancellation email to both guardians with the balance, skipped when switched off.
- [ ] No guardian endpoint can cancel.
- [ ] Access emails grant portal access and receive no automatic email.
- [ ] Removing a guardian is admin-only and audited; the removed address loses access.
- [ ] Regenerate creates a new stored PDF and keeps the previous object until replaced; download via short-lived link.

## Notes
- Spec sections: Registration (cancel); Removing a Registration; Emails.
