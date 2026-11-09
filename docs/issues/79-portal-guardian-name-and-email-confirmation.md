# 79 - Portal: guardian name and confirmed email

Status: done
Stage: 1b
Episode: E5 Guardian portal
Blocked by: 39, 41, 71
Stories: 80, 84

## What to build

The redesigned portal greets the guardian by name ("Dobrý den, Jano"), and the page behind an email change link says which address was confirmed. Today `GET /portal/registrations` names no one, and `POST /portal/email-changes/confirm` returns nothing.

## Decisions

- **Guardian name.** `GET /portal/registrations` gains `guardian: { firstName, lastName } | null`: the name of the signed-in email as a guardian on its newest Registration, null when the email only has access as an access email. The greeting's vocative comes from `vocativeOf` (issue 71).
- **Confirmed email.** The confirmation returns the new address it confirmed.

## Acceptance criteria

- [ ] A guardian named on two Registrations with different spellings gets the newer one; an access-email-only login gets null.
- [ ] The name never comes from a Registration of another Organisation, even for the same email.
- [ ] Confirming an email change returns the new address; a used or expired link is refused as before.

## Notes

- Spec sections: Identity, permissions and audit (guardians).
- Design: canvas "Campie - návrhy designu", artboards `M-Portal` (greeting), `M-PortalLogin` (confirmation page). Consumed by the portal home and the email confirmation page.

## Comments

2026-11-09 - **Implemented, awaiting merge.** `GET /portal/registrations` returns `guardian: { firstName, lastName } | null`, taken from the guardian row with the signed-in email on the newest of the listed Registrations (newest first, as the list), so an access email alone gets null and RLS keeps every other Organisation out. `POST /portal/email-changes/confirm` answers 200 `{ email }` with the confirmed new address, which only the link's own mailbox received; a used, expired or unknown link, or one followed on another Organisation's subdomain, stays 400 `email_change_invalid` and names no address. `vocativeOf` moved from `@repo/schema/admins` to `@repo/schema/shared`, since guardians use it too. The portal home greets "Dobrý den, <vocative>" and the confirmation page names the confirmed address. Not checked in the browser: the local stack was not running.
