# 67 - TOTP for admins and enforcement

Status: done
Stage: 1b
Episode: E1 Organisations and identity
Blocked by: 18, 21
Stories: -

## What to build

Any admin can turn on two-step login with TOTP for their own account and receives one-time recovery codes. An Owner can enforce TOTP for the Organisation; members without it must set it up at their next login before reaching anything else. An Owner can reset a member's TOTP. A locked-out Owner is reset by the platform operator from the console after an identity check outside the platform. Reuse the TOTP implementation already built for operators (issue 21).

## Acceptance criteria

- [ ] Enabling requires a valid code; login then requires a code or an unused recovery code; a recovery code works once.
- [ ] With enforcement on, a member without TOTP can only reach the setup endpoints until set up.
- [ ] An Owner resetting a member's TOTP is audited and emails the member.
- [ ] The operator reset is available only in the console and is audited in the Organisation's log.
- [ ] Failed code attempts count toward the failed-attempt limit.

## Notes

- Spec sections: Identity, permissions and audit (Two-step login).
- Admin identity is global; enforcement applies when the member logs in to that Organisation.

## Comments

2026-11-07 - **Done.** Any admin sets TOTP up on "Můj účet" (`/platform/ucet`): confirming the first code answers ten recovery codes (`abcd-ef23`, from a 31-character alphabet, stored as an HMAC keyed by the master key and bound to the admin in `totp_recovery_codes`), shown once, held above every page until the admin confirms they saved them. `POST /sessions/current/totp` takes a code or an unused recovery code; a wrong recovery code counts toward `LOGIN_MAX_FAILURES_PER_ACCOUNT` like a wrong code. `AccessService` refuses an admin request whose session has not passed a code when the admin has TOTP on (`second_factor_required`), and, in an Organisation with `totp_required`, one of an admin without TOTP (`totp_setup_required`); account routes stay open. Owners toggle the requirement (`PUT /organisation-settings/totp`, audited as `organisation.update`) and reset a member's TOTP (`DELETE /members/:id/totp`, audited `member.reset_totp`, the member is emailed, their sessions end); an admin who is the Platform operator or a member of another Organisation is refused with 409 `totp_reset_elsewhere`, since the identity is global, and goes to the console. The operator resets an Owner by email from the console (`POST /console/organisations/:id/owner-totp-reset`); since the console's unit of work never enters an Organisation, the reset itself, its audit entry and the email commit together in the Organisation's own unit of work right after the console's. The frontend's platform shell asks for the code, or for the setup, before any page.

2026-11-08 - **Decision by the project lead: admins can make new recovery codes for their own two-step login.** `POST /account/totp/recovery-codes` takes a current six-digit code from the app (a recovery code is refused by the body schema), only for a session that passed the second step (403 `second_factor_required`) and with TOTP on (409 `totp_not_enabled`); the code is used up and counted like any other. Ten new codes replace the old ones, which stop working; the admin sees them once (`RecoveryCodes`, from "Můj účet", `/platform/ucet`). Audited in the platform's log (`admin.regenerate_recovery_codes`, the admin identity is global) and emailed to the admin from `admins.recovery-codes-regenerated`. Turning TOTP off by oneself stays impossible.
