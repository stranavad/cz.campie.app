# 71 - Admin names

Status: in-progress
Stage: 1b
Episode: E1 Organisations and identity
Blocked by: 20, 63, 69, 70
Stories: 13, 23, 25, 28, 29, 30

## What to build

Admins are known only by their email today. Give every admin a first and last name and show it wherever the redesign names a person: the sidebar, the greeting on Přehled ("Dobrý den, Jano"), the Tým member rows, the invitation page ("Jana vás zve"), the support grant row ("povolila Jana Nováková") and the actor of every Audit entry.

## Decisions

- **Two fields on the admin identity.** `firstName` and `lastName`, nullable in the database: admins created before this issue have none until they set it (issue 72), and every view falls back to the email.
- **Where a name is given.** Signup asks the first Owner's name. Accepting an invitation asks it whenever a password is asked (a new account or the takeover of an unverified one, issue 70); a verified account joins with its name as it is. `pnpm operator grant` takes an optional name.
- **Greeting in the vocative.** A pure `vocativeOf(firstName)` in `packages/schema` covers the common patterns of Czech first names (Jana → Jano, Petr → Petře, Tomáš → Tomáši, Marek → Marku, Lucie → Lucie) and returns the name unchanged where no rule applies. The API returns the nominative only.
- **Names resolved at read time.** Audit entries keep the actor's id; the audit log and the record history name the actor as they are named now, as issue 69 does for targets. Nothing is snapshotted into the append-only log.
- **Invitations.** The list gains `sentAt` (when the link was last emailed; inviting the same address again updates it, which is how an invitation is resent) and `invitedBy` (the inviting Owner's name and email). The preview behind the invitation link gains the inviter's name and the levels the invitation grants.
- **Support grants.** The list gains `grantedBy` with the granting Owner's name and email, from the grant's existing `grantedByAdminId`.

## Acceptance criteria

- [ ] Signup without a first or last name is refused with a field code; with one, `GET /account` returns it.
- [ ] Accepting an invitation as a new account or as a takeover requires a name; a verified account joins without one and keeps its own.
- [ ] `GET /members`, `GET /invitations`, `GET /support-access` and `GET /audit-log` return names, null for an admin without one.
- [ ] The invitation preview returns the inviter's name and the invited levels, and still nothing beyond the invitation's own Organisation.
- [ ] Re-inviting an address updates `sentAt` and emails a new link; the old link stops working.
- [ ] Renaming an admin changes the actor name on their past Audit entries without changing the entries.
- [ ] Member and audit names of Organisation A never appear in B, including for an admin who is a member of both.
- [ ] `vocativeOf` is tested directly against a table of common names and leaves an unknown name unchanged.

## Notes

- Spec sections: Identity, permissions and audit.
- Design: canvas "Campie - návrhy designu", artboards `B3-Prehled` (greeting), `Sidebar`, `B3-Tym`, `B3-Prihlaseni` (invitation), `B3-Organizace` (support access), `B3-Historie`, `B3-RegistraceOrg` (signup). Consumed by the admin shell's sidebar and Přehled, the Tým and support access pages, the invitation page, the audit log and the signup form.
- No new resend endpoint: `POST /invitations` for the same address already replaces the invitation and sends a fresh link.

## Comments

2026-11-09 - **Implemented, awaiting merge.** Admins have nullable `first_name` and `last_name`; signup (`firstName`, `lastName` in the body), accepting an invitation with a password (a new account or a takeover, which also replaces the name the planted account had; a verified account ignores any name sent) and `pnpm operator grant <email> [<first name> <last name>]` (new accounts only) set them. Names are trimmed, at most 100 characters, and refuse control and invisible formatting characters (`\p{C}`, line and paragraph separators), so a bidi override cannot disguise a name. `personSchema` / `fullNameSchema` live in `@repo/schema/shared`, `vocativeOf` in `@repo/schema/admins`.

- The global validation pipe now answers each custom check's message (an i18n key) as a field code at its path (`fields`), so signup and acceptance name errors arrive as `name_required`, `name_too_long`, `name_invalid`. Accepting without a name where one is needed answers the code `name_required`.
- `GET /account` and `GET /members` return the names; `GET /invitations` returns `sentAt` and `invitedBy` (email and names of the Owner who last sent the link); `GET /support-access` returns `grantedBy`; audit entries name their actor as `{ email, firstName, lastName }`, read when the log is, so a rename shows on past entries without touching them. The invitation preview returns the inviter's first and last name only (null when they have none), never their email, and the invited levels.
- `sentAt` moves with `expiresAt`: set on inviting and again when the job makes the link. Migrations: the name columns are nullable; `invitations` gains `sent_at` (added nullable, backfilled as `expires_at - 7 days`, the link's fixed validity, then made NOT NULL) and `invited_by_admin_id` (nullable, `ON DELETE SET NULL`; unknown for existing invitations). Rolling back means dropping the three columns; nothing else reads them.
- The admin and membership audit fields gain the names, the invitation's gain `sentAt`. A takeover records only the name the invitee gave: the one it replaces was typed by whoever made the account, perhaps in another Organisation.
- UI: the sidebar and Tým rows name members (email beside the name, email alone without one), Přehled greets "Dobrý den, Jano" (plain "Dobrý den" without a first name rather than greeting an email), the invitation page says who invites and with which levels and asks the name with the password, the invitation list shows when and by whom it was sent, support grants say who granted them, and the audit log and history name actors. Gendered verbs use the existing "(a)" form ("Povolil(a)", "Odeslal(a)"). Where a reader must tell people apart (the audit actor, who invited, who let support in, the member dialog) the email stands beside the name, since anyone invited chooses their own name and could choose an Owner's.
- `vocativeOf` keeps a short list of women's names ending in a consonant (Dagmar, Nikol, Carmen, ...) as they are, and answers a name typed in capitals in capitals.
- Names in audit changes: the creation of an admin and the removal of a member record the name as they record the email, since a removed record has no other name in the log; the actor of an entry is never recorded, only resolved.
- Open: a password reset that takes back an account never verified keeps the name its maker gave. Clearing it there would also clear the name `pnpm operator grant` gives a new operator account, which is set up through a reset; the admin sees the name at once and changes it through `PATCH /account` (issue 72).
