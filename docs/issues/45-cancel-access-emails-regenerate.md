# 45 - Cancel, Cancel all, access emails, regenerate Přihláška

Status: done
Stage: 1a
Episode: E6 Admin Registrations
Blocked by: 37, 44
Stories: 112, 118, 119

## What to build

An admin with Registrations write cancels a Participant: the place is freed, the record stays, and no money changes; the admin settles storno fees, removed prices or refunds manually with Price adjustments and Correcting payments. "Cancel all" cancels every Participant of a Registration (offered as the keep-data choice when removing a Registration; Erase is issue 66). Guardians cannot cancel. The cancellation email to both guardians states the current balance. The admin adds and removes access emails (grandparent, other household) and removes a guardian. The admin regenerates and downloads a Participant's Přihláška PDF.

## Acceptance criteria

- [x] Cancel frees capacity immediately (a new submission can take the place) and leaves price lines and ledger untouched.
- [x] Cancel all cancels each Participant; the Registration has no separate state.
- [x] Cancellation email to both guardians with the balance, skipped when switched off.
- [x] No guardian endpoint can cancel.
- [x] Access emails grant portal access and receive no automatic email.
- [x] Removing a guardian is admin-only and audited; the removed address loses access.
- [x] Regenerate creates a new stored PDF and keeps the previous object until replaced; download via short-lived link.

## Notes

- Spec sections: Registration (cancel); Removing a Registration; Emails.

## Comments

2026-11-07 - **From issue 36.** `PrihlaskaService.regenerate(actor, participantId)` exists (replaces the file, removes the old one, audits `participant.generate_prihlaska`). It renders, so wire it through a job enqueued by the admin route, never call it in the request.

2026-11-07 - **Done.** `CancellationService` (Registrations write): `POST /registrations/:id/participants/:participantId/cancel` and `POST /registrations/:id/cancel` (every Registered child) mark Participants Cancelled, which frees their places at once (capacity counts Registered ones) and leaves price lines and the ledger untouched; each is audited and each guardian gets the Camp's `cancellation` email naming the cancelled children with the balance below it (`BalanceBlock`), from a job, skipped when switched off. No guardian route can cancel. Access emails (`registration_access_emails`): `POST`/`DELETE .../access-emails` give or take portal access; they receive no automatic email (they may ask for a login link) and may only see the Registration: portal edits stay with the guardians. `DELETE .../guardians/:position` removes one of two guardians (409 `guardian_last` otherwise), drops any email change still waiting, and the other becomes the first. `POST .../participants/:participantId/prihlaska` (202) audits the request and regenerates the Přihláška from a job, removing the old file once the new one is stored. Admin detail page: cancel (with a confirming second click), access emails, removing a guardian, regenerating the PDF. "Cancel all" as the keep-data choice of removing a Registration comes with erasure (issue 66).
