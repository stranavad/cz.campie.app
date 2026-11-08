# 70 - Email verification and safe invitation acceptance

Status: ready-for-agent
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 17, 20, 67
Stories: 23

## Problem Statement

An admin account can be created for any email without proving the address is the creator's: signup takes the email and password as typed and signs the creator in. Accepting an invitation then treats an existing account for the invited email as the invitee's own and adds the membership to it, on the strength of the link alone.

Together these let an attacker take over a future membership. The attacker signs up with the email of someone likely to be invited (a known camp leader), with their own password and a throwaway Organisation. When a real Owner later invites that email, the invitee sees "you already have an account", clicks accept, and the membership lands on the attacker's account. The attacker logs in with their own password and reads Registrations, Participants, Health records and rodná čísla up to the invited levels. The attacker can also enrol TOTP first, which survives a password reset and locks the real person out.

The invitation link proves who owns the email. It does not prove who owns the account. Nothing in the platform currently records whether an account's email was ever proven.

## Solution

Every admin account carries whether its email has been verified. An account proves its email by a verification link sent at signup, by accepting an invitation, or by completing a password reset.

An invitation accepted for an account whose email was never verified treats that account as unowned. The invitee sets a new password. Any TOTP enrolment is cleared, every session of the account ends, and the account becomes verified and signed in as the invitee. An invitation accepted for a verified account joins as it does today.

Signup keeps working as now. The Owner is signed in and can set up the Organisation. A verification email is sent from the auth stream, and the admin interface asks the Owner to confirm their email until they do.

## User Stories

1. As an invited admin, I want accepting an invitation to give me control of the account for my email, so that nobody who planted an account under my address gets my access.
2. As an invited admin whose email has an unverified account I never created, I want to be asked for a new password as if I had no account, so that I am not told to log in with a password I never set.
3. As an invited admin taking over an unverified account, I want every existing session of that account ended, so that whoever created it is signed out immediately.
4. As an invited admin taking over an unverified account, I want any TOTP enrolment on it removed, so that a second factor someone else enrolled cannot lock me out.
5. As an invited admin taking over an unverified account, I want to be signed in right after accepting, so that I can start working like any new admin.
6. As an invited admin who already has a verified account, I want to join without setting a new password, so that I keep using the one I know.
7. As an Owner who signed up, I want to receive a link that confirms my email, so that my account is protected against takeover.
8. As an Owner who signed up, I want to keep setting up my Organisation before I confirm my email, so that verification does not block my first steps.
9. As an Owner whose email is not verified, I want the admin interface to tell me so and let me resend the link, so that I can finish it when the first mail got lost.
10. As an Owner, I want the verification link to work once and expire, so that an old mail cannot be replayed.
11. As an admin who completes a password reset, I want my email to count as verified, so that a reset proves the account is mine.
12. As an admin who completes a password reset on an unverified account, I want any TOTP enrolment on it cleared, so that a second factor set by someone else cannot keep me out.
13. As an Owner who invites a colleague, I want the invitation page to describe the colleague's situation correctly, so that a takeover case does not read as "you already have an account".
14. As an Owner, I want the takeover of an unverified account by an invitation to show in the audit log, so that I can account for who holds access.
15. As the platform operator, I want verification and takeover recorded, so that a reported incident can be traced.
16. As the platform operator, I want verification mails to go out on the auth sending subdomain, so that bulk sending reputation never delays them.
17. As an attacker who created an account under someone else's email, I want nothing: the account's credentials stop working the moment the real owner accepts an invitation or resets the password.

## Implementation Decisions

- **Verified state on the admin identity.** Admins gain a nullable "email verified at" timestamp. Null means the email was never proven. Nothing else on the admin changes.
- **What verifies an email.** Three things, and nothing else: completing the signup verification link, accepting an invitation, and completing a password reset. Each sets the timestamp if it is unset.
- **Signup verification link.** It works like invitation and password reset tokens: a random token in the mail, only its hash stored, single-use, expiring, sent from the auth mail stream. Signup still starts a session at once. A signed-in unverified admin can ask for the link again, under the existing rate limiter.
- **Confirmation page.** The page lives on the main host and is reached from the mail. It confirms without asking for the password, since the token proves the email.
- **Invitation lookup.** `hasAccount` is true only for a verified account. An unverified account reads as no account, so the page shows the new-password form.
- **Invitation accept on an unverified account.** In the same transaction it:
  - requires and checks the password as for a new account;
  - replaces the account's password hash;
  - removes its TOTP enrolment and recovery material;
  - ends all its admin sessions;
  - sets the verified timestamp;
  - creates the membership;
  - starts a session for the invitee.

  The account keeps its id and any other memberships.

- **Invitation accept on a verified account.** No change from today: it joins without a password and starts no session.
- **Password reset on an unverified account.** Completing it also removes the TOTP enrolment, besides setting the password, ending sessions and setting the verified timestamp. On a verified account a reset behaves as today.
- **Audit.** New catalogue actions for an email verified and for an account's credentials replaced by an invitation. Both go into the audit catalogue with Czech translations, as issue 69 requires. The takeover is recorded in the inviting Organisation as the invitee. A verification by signup link is recorded in the signup Organisation.
- **Unverified prompt.** The admin interface shows a persistent notice with a resend action while the signed-in admin is unverified. All texts go through the translation layer, in Czech.
- **Existing accounts.** The migration leaves every existing admin unverified except the platform operator. Before launch there are no real Organisations. A genuine existing admin who is later invited simply sets a password through the invitation, which proves the email.
- **Login stays unchanged.** Unverified admins log in as before. Verification guards takeover; it does not gate access to the admin's own signup Organisation.

## Testing Decisions

- **One seam: the API over HTTP** against real PostgreSQL with RLS, fakes at the mail port. The existing invitation, signup and password-reset integration tests are the prior art; new cases sit beside them.
- **What a good test proves.** Only external behaviour: which credentials log in, which sessions still resolve, what lookup reports, what mail went out and what the audit log shows. Never column values directly.
- **Cases.**
  - The attack itself. Sign up with email X and password P, enrol TOTP, invite X and accept with password Q. Afterwards P fails, the old session is rejected, Q logs in without TOTP, and the membership has the invited levels. This test must fail against today's code.
  - Lookup reports `hasAccount: false` for an unverified account and `true` once it is verified.
  - A verified account joins without a password and keeps its password. This is the existing case, now with the account verified first.
  - The signup verification link is mailed from the auth stream and works once. It is refused after expiry, and resend issues a new one.
  - A password reset on an unverified account clears TOTP and makes lookup report the account as existing.
  - Audit entries for verification and takeover appear in the right Organisation as the right actor.
- **Unit tests.** None. There is no new pure domain module.

## Out of Scope

- Making approval of an Organisation wait for its Owner's verified email.
- Removing the memberships an unverified account held before a takeover. The planted Organisation stays attached and is handled by the operator's existing rejection.
- Changing an admin's own email.
- Verification for guardians, who already prove their email through login links.
- Expiring or deleting stale unverified accounts.

## Further Notes

- Found in a whole-codebase security review on 2026-11-08. Severity medium, with high impact, since it exposes Health records and rodná čísla. The attacker must know the invitee's email in advance.
- Spec sections: Identity, permissions and audit; the two sending subdomains (verification mail goes on the auth one).
- After this issue, the "existing account joins as it is, since the link proves the email is theirs" reasoning in invitation acceptance applies only to verified accounts. Its doc comment changes with the code.

## Comments
