# 19 - Memberships, permission areas, Owners

Status: done
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 17, 18
Stories: 24, 111

## What to build

An admin's access to an Organisation is a membership holding a level (none, read or write) for each permission area: Registrations, Camp settings, Health, Oddíly and Vedoucí. Owner is a role on a membership that grants everything plus organisation settings, users, payment keys, support access and erasure. An Organisation may have several Owners and always keeps at least one. Provide guards that check area and level on every endpoint, and that hide all health data without Health read. V1 shows one Organisation per login, but the model allows several.

## Acceptance criteria

- [x] An endpoint guarded for Registrations read rejects an admin with none and allows read and write
- [x] A write endpoint rejects an admin with read
- [x] The last Owner cannot be demoted or removed
- [x] Permissions of Organisation A's membership grant nothing in Organisation B
- [x] A test helper lets later issues assert all three levels per area

## Notes

- Spec sections: Identity, permissions and audit
- Port from Domino: `apps/api/src/guards/scope.guard.ts` (factory pattern); Domino's scopes are replaced by areas with levels

## Comments

2026-11-02 - **Implemented.** A membership holds a level (none, read, write) per permission area, and routes declare what they need; there are no admin endpoints yet, so the guard is proven with test-only controllers.

- Areas and levels are const tuples in `@repo/schema/admins` (`PERMISSION_AREAS`, `PERMISSION_LEVELS`, `levelIncludes`), one source for the `permission_level` enum and the five level columns on `memberships` (default none).
- `@Requires('registrations', 'read')`, `@Requires('owner')` or `@Requires('member')` on every admin route or its controller. The `AccessGuard` checks it against the membership of the Organisation the request names and answers 403 `permission_denied` (new in `ACCESS_ERROR_CODES`). An Owner meets every requirement. The app refuses to boot with an admin route that declares nothing, or with `@Requires` on a non-admin route.
- Health data: `@RequestMember()` gives the route the membership, and `allows(member, { area: 'health', level: 'read' })` decides whether health fields go into the response at all.
- At least one Owner: a deferred constraint trigger, `memberships_keep_an_owner`, refuses to commit a demotion or removal of the last Owner, an admin deletion included, and lets the Organisation's own deletion through. A transaction lock per Organisation (advisory, so it cannot deadlock against a change to the Organisation's row) serialises the check, so two Owners demoting each other at once can't both commit (tested with two concurrent transactions). Issue 20 maps this check violation to a 409 on its endpoints.
- Testing: `createAdmin(app, { memberOf, owner, permissions })`, and `useTestApp().expectPermission(['registrations', 'read'], organisationId, (headers) => request)`, which sends the request at none, read and write in the area (every other area at write) and as an Owner, and asserts who is refused with `permission_denied` (changing nothing) and who is admitted. `vitest/expect-expect` counts `expectIsolated` and `expectPermission` as assertions.
