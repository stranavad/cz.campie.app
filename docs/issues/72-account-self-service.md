# 72 - Account self-service: name, email, password and TOTP

Status: done
Stage: 1b
Episode: E1 Organisations and identity
Blocked by: 67, 70, 71
Stories: 23

## What to build

The Účet page lets a signed-in admin manage their own identity; today only `GET /account` exists. The admin edits their name, changes their email, changes their password, and sees and manages two-step login: since when it is on, how many recovery codes are left ("Zbývá 8 z 10"), and moving it to a new phone while it stays on.

## Decisions

- **Name.** `PATCH /account` sets the first and last name (issue 71).
- **Email.** A change takes effect only after the link mailed to the new address is followed, as for guardians: single-use, expiring, only its hash stored, from the auth stream. The old address gets a notice. The new address must not belong to another admin. Following the link also counts as verifying the email (issue 70).
- **Password.** Changing it needs the current password and a session that passed the second step when TOTP is on. It ends every other session of the admin and emails them a notice. Rate limited like login.
- **TOTP metadata.** `GET /account` gains when TOTP was turned on and how many unused recovery codes remain out of how many were issued.
- **New phone.** While TOTP is on, starting an enrolment with a current code from the old app issues a new secret; confirming it with a code from the new app replaces the old secret in one step. Until then the old app keeps working, and recovery codes are untouched.
- **Audit.** The admin identity is global, so these changes go to the platform audit log, as TOTP enrolment does today (`recordForPlatform`), with new catalogue actions: the name and the email with old and new values, the password and the TOTP secret as the fact of the change only.

## Acceptance criteria

- [ ] Name changes show at once in `GET /account` and in `GET /members` of every Organisation the admin belongs to.
- [ ] An email change does nothing until the link is followed; afterwards login works with the new email only and the old address got the notice. A used or expired link is refused; an address of another admin is refused.
- [ ] A wrong current password is refused and counts towards the login limit; a correct one changes the password, another session of the admin is rejected and the current one stays.
- [ ] `GET /account` reports the TOTP start date and remaining recovery codes; using a recovery code lowers the count.
- [ ] Re-enrolling while TOTP is on needs a current code; until confirmed the old secret still logs in; after confirming only the new one does.
- [ ] Every change appears in the platform audit log as the admin; none appears in an Organisation's log.

## Notes

- Spec sections: Identity, permissions and audit.
- Issue 70 left changing an admin's own email out of scope; this issue brings it in with verification of the new address.
- Design: canvas "Campie - návrhy designu", artboard `B3-Ucet`. Consumed by the admin Účet page.

## Comments

2026-11-09 - **Implemented, awaiting merge.** Every account change needs a session that passed the second step while TOTP is on (403 `second_factor_required`).

- `PATCH /account` sets `firstName` and `lastName` with the shared name schema; `GET /account` replaces `totpEnabled` with `totp` (`enabledAt`, `recoveryCodesLeft`, `recoveryCodesIssued`, or null while off).
- `POST /account/password` takes `currentPassword` and `password`. The current one is checked as a login (`LoginService.confirmPassword`): a wrong one answers 400 `current_password_invalid` and counts against the login limits, past them 429 `login_throttled`. The new one meets the reset's strength rules; every other session ends, the admin is emailed.
- `POST /email-changes` takes the new `email` and `currentPassword`, checked the same way, and counts against the reset limit per IP and new address. It answers 204 whether or not another admin has the address; the job mails the link (auth stream, `/zmena-emailu?token=`, 24 hours, newest only, hash stored in `admin_email_changes`) only when nobody has it. `POST /email-changes/confirm` (platform access) changes and verifies the email, ends the admin's reset links, which went to the old address, and mails the old address a notice without the new one; a used, replaced or expired link answers 400 `email_change_invalid`, an address taken by now 409 `email_taken`. A password change, a reset and an invitation takeover end a waiting change, so whoever asked for it with the old password cannot take the account back through its link.
- `POST /account/totp/replacement` with a current app code (used up, never a recovery code) stores a second sealed secret (`totp_credentials.replacement_secret`); `/account/totp/replacement/confirm` with a code from it swaps it in one step. The old app logs in until then; `enabledAt` and the recovery codes stay; the admin is emailed.
- Platform log actions `admin.rename` and `admin.change_email` (old and new values), `admin.change_password` and `admin.replace_totp` (the fact only), as the admin; nothing in an Organisation's log.
- Issue 71's open item: a password reset that takes back an account never verified now clears the name its maker gave it, unless the account had no password yet, which only `pnpm operator grant` makes, so an operator account set up through a reset keeps the name the operator typed. The owner names themselves on Můj účet.
- UI: Můj účet edits the name, asks a new email and a new password with the current one, shows "Zapnuto od" and "zbývá X z Y" recovery codes, and moves two-step login to a new phone; `/zmena-emailu` confirms a new email with a button.
- Migrations: `totp_credentials.replacement_secret` (nullable) and the new `admin_email_changes` table; rolling back drops both. Housekeeping removes expired email changes.
