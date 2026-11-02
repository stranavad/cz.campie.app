# 20 - Invitations and user management

Status: done
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 19
Stories: 23, 25

## What to build

An Owner invites admins by email; the invitee sets their own password through the invitation link, or links the invitation to an existing global identity. The Owner sets, changes and removes each member's permission levels and can promote a member to Owner or demote another Owner. Every Owner change is audited and emailed to all Owners. Removing a member ends their access immediately.

## Acceptance criteria

- [x] An invitation email is sent on the auth stream; accepting it creates a membership with the chosen levels
- [x] An invitee who already has an account joins without a new password
- [x] Changing or removing access takes effect on the member's next request
- [x] Promoting or demoting an Owner is audited and emails all Owners
- [x] Only Owners can manage users

## Notes

- Spec sections: Identity, permissions and audit
- Port from Domino: `apps/api/src/admin-user/` (user management endpoints)

## Comments

2026-11-02 - **Implemented.** An Owner manages the Organisation's admins at `/uzivatele` on the main host (linked from the admin home for Owners): the members with their levels and the Owner role, pending invitations, and an invite form. The invitee opens `/pozvanka?token=...`.

- Endpoints (`@repo/schema/admins`), all `@Requires('owner')` unless platform: `GET /members`, `PATCH /members/:memberId` (levels and/or `owner`; an empty body is 400), `DELETE /members/:memberId`, `GET /invitations`, `POST /invitations`, `DELETE /invitations/:invitationId`; on the main host without a session `POST /invitations/lookup` and `POST /invitations/accept` (token in the body, never in a URL the API logs).
- Invitations are a new platform table (`invitations`, like memberships: the invitee arrives before any Organisation is current), one per Organisation and email, holding the five levels. The request stores the invitation and enqueues an Organisation job with its id; the handler makes the token (only its SHA-256 is stored) and mails the link on the auth stream, valid 7 days from sending. Inviting the same email again replaces the levels and kills the earlier link at once; a revoked invitation's job sends nothing. Inviting a current member is 409 `already_member`.
- Accepting runs in a platform unit of work that enters the invitation's Organisation (the second user of `unitOfWork.enter`, after signup). A new email chooses a password (`password_required`, the strength codes) and the account is created and signed in; an existing account joins without a new password and no cookie is set, since the link proves the email but a login is still the way in. The link is used up with `DELETE ... WHERE token_hash = ... RETURNING`, so it works once and a link replaced meanwhile opens nothing, and the membership gets the levels of the row as removed. Audited as the new admin: `admin.create` (new accounts), `invitation.accept`, `membership.create`; the Owner's side: `invitation.create`, `invitation.update`, `invitation.remove`.
- Changing or removing access needs nothing extra to take effect on the next request, since the guard reads the membership on every request; tests prove both. Removing a member leaves their global account and sessions alone; they are refused in this Organisation only.
- Owners: `PATCH` with `owner` promotes or demotes, audited as `membership.update` (a change that changes nothing writes no entry). Each promotion, demotion or removal of an Owner enqueues one notification job per recipient: every current Owner plus the admin whose role changed, so a demoted or removed Owner is told too. The mail goes on the notification stream under the product's name and names the Organisation, the admin, the change and its author.
- Last Owner: after a membership change the service runs `SET CONSTRAINTS memberships_keep_an_owner IMMEDIATE` (`MembershipRepository.keepsAnOwner()`), so the trigger from issue 19 fires inside the route and the API answers 409 `last_owner` instead of a 500 at commit. `unique-violation.ts` became `constraint-violation.ts` (`violatedConstraint(error, 'unique' | 'check')`).
- Tenancy: memberships and invitations have no row-level security, so their repositories filter by the current Organisation in every query except the token lookup; `expectIsolated` tests both, and mutating the filter away fails them.
- App: `apiClient.request(..., { organisationId })` sends the Organisation header (docs/api.md updated; the header was not sent anywhere before), `useCurrentMembership()` in `core/account`, the `members` and `invitation` features, and the admin home now tells a signed-in admin with no membership left that they belong to no Organisation instead of showing a load error.
- Tests: `invitation.integration.test.ts` (link on the auth stream, new account joins with the levels and can log in, existing account joins without a new password, link works once, expiry, re-invite replaces levels and link, revoke, password refusals keeping the link usable, `already_member`, Owner-only, isolation, audit) and `member.integration.test.ts` (levels effective on the next request, removal, promotion and demotion audited and mailed to every Owner, removing an Owner mailed, last Owner 409 changing nothing, stepping down after a promotion, empty and no-op changes, Owner-only, isolation). Checked by hand on the local stack in headless Chromium: invite, a weak and a valid password, landing signed in, a used link, level change, promote and demote, the last-Owner message, removal, re-inviting the removed admin as an existing account, and the `already_member` error.
- Assumed, to confirm:
  - Invitations are valid 7 days. They carry levels only; an invitee becomes an Owner by promotion after joining.
  - A demoted Owner keeps whatever levels their membership held before the promotion; the Owner sets them in the same screen.
  - An Owner may remove themselves or step down while another Owner remains.
  - Owner-change and invitation mail go out under the product's name (like the password reset), not the Organisation's, since they are about the platform account.
- Open from review, not changed:
  - The app acts in the first membership only (v1 rule from issue 19), so an existing admin who joins a second Organisation cannot reach it in the UI yet.
  - Re-inviting before the first job ran sends two emails, of which only the newer link works.
  - Two simultaneous invitations of one email to one Organisation, or a signup racing the acceptance of a new account's email, end as a 500 on the unique constraint rather than a coded refusal.
  - Expired invitations stay listed (marked as expired) until revoked or sent again; no cleanup job.
  - `admins.password_hash` stays nullable with its comment about invited admins, although accounts are now created only with a password (operators from the command line, issue 21, may still need it).
