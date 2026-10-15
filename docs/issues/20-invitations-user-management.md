# 20 - Invitations and user management

Status: ready-for-agent
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 19
Stories: 23, 25

## What to build

An Owner invites admins by email; the invitee sets their own password through the invitation link, or links the invitation to an existing global identity. The Owner sets, changes and removes each member's permission levels and can promote a member to Owner or demote another Owner. Every Owner change is audited and emailed to all Owners. Removing a member ends their access immediately.

## Acceptance criteria

- [ ] An invitation email is sent on the auth stream; accepting it creates a membership with the chosen levels
- [ ] An invitee who already has an account joins without a new password
- [ ] Changing or removing access takes effect on the member's next request
- [ ] Promoting or demoting an Owner is audited and emails all Owners
- [ ] Only Owners can manage users

## Notes

- Spec sections: Identity, permissions and audit
- Port from Domino: `apps/api/src/admin-user/` (user management endpoints)
