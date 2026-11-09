# 72 - Account self-service: name, email, password and TOTP

Status: ready-for-agent
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
