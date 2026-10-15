# 19 - Memberships, permission areas, Owners

Status: ready-for-agent
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 17, 18
Stories: 24, 111

## What to build

An admin's access to an Organisation is a membership holding a level (none, read or write) for each permission area: Registrations, Camp settings, Health, Oddíly and Vedoucí. Owner is a role on a membership that grants everything plus organisation settings, users, payment keys, support access and erasure. An Organisation may have several Owners and always keeps at least one. Provide guards that check area and level on every endpoint, and that hide all health data without Health read. V1 shows one Organisation per login, but the model allows several.

## Acceptance criteria

- [ ] An endpoint guarded for Registrations read rejects an admin with none and allows read and write
- [ ] A write endpoint rejects an admin with read
- [ ] The last Owner cannot be demoted or removed
- [ ] Permissions of Organisation A's membership grant nothing in Organisation B
- [ ] A test helper lets later issues assert all three levels per area

## Notes

- Spec sections: Identity, permissions and audit
- Port from Domino: `apps/api/src/guards/scope.guard.ts` (factory pattern); Domino's scopes are replaced by areas with levels
