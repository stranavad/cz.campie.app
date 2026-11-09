# 71 - Admin names

Status: ready-for-agent
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
