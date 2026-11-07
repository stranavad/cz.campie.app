# 24 - Camps, slugs, module switches

Status: in-progress
Stage: 1a
Episode: E2 Camp setup
Blocked by: 19
Stories: 19, 35, 36, 40

## What to build

An Organisation owns one or more Camps. Signup (issue 17) already creates the first Camp automatically; this issue adds the Camp entity's full management. An admin with Camp settings write can rename a Camp, set its slug, its website link and its contact (name, email, phone used as the reply address and shown to guardians), and create a second Camp. Each Camp has module switches (Consents, Documents, generated documents, Health record, Camp health log, Oddíly, Vedoucí); switching a module off hides it and keeps its data. The slug is unique within the Organisation and editable; every former slug is kept and resolves to the Camp so links on camp websites keep working. When the Organisation has only one Camp, the admin interface never shows a Camp picker.

## Acceptance criteria

- [x] Admin with Camp settings write can create, rename and edit a Camp; read can view; none gets 403.
- [x] Slug is validated (lowercase letters, digits, hyphens), unique within the Organisation, and the same slug may exist in another Organisation.
- [x] Changing a slug keeps the old one resolvable to the same Camp; reusing a former slug of another Camp in the same Organisation is rejected.
- [x] A public lookup by Organisation host + slug (old or new) returns the Camp; used later by issue 33.
- [x] Module switches persist per Camp; switching off and on again returns the module's data unchanged (verified with a stub row).
- [x] An admin of Organisation A cannot read or change Organisation B's Camps, including by guessed id; an unscoped query returns nothing (RLS).
- [x] Every change writes an audit entry with old and new values.
- [x] Admin UI: Camp settings page and, with several Camps, a Camp switcher; all strings through i18n.

## Notes

- Spec sections: Tenancy, Other (modules), Architecture (public addresses).
- Branding override per Camp is issue 23; this issue only stores Camp identity, slug, contact, link and switches.
- Domino has no Camp entity (ADR-0007 in this repo rejected it); nothing to port.

## Comments

2026-11-07 - **Implemented.** Camp settings at `/platform/tabory` (linked from the admin home for anyone with Camp settings read): name, slug, website, contact, module switches, the Camp's own logo and accent colour (issue 23's API), and adding a Camp. A Camp switcher shows only with several Camps; the chosen Camp is in the address (`?tabor=<id>`).

- API: `GET /camps` (every member: id, name and slug, for Camp pickers in every area, so not 403 for none; the names are public anyway), `GET /camps/:campId` (Camp settings read), `POST /camps` and `PATCH /camps/:campId` (write), each change audited with old and new values. New Camps start with every module off.
- Slugs: lowercase letters, digits and single hyphens, at most 80, not `api`, `portal`, `prihlaseni` or `odhlaseni` (paths at the subdomain's root). `camp_slugs` keeps every slug a Camp has had, its current one included, keyed by Organisation and slug: it alone makes slugs unique (the old unique on `camps` is dropped), so a former slug keeps leading to its Camp and no other Camp can take it, and create and slug change lock in the same order. The migration seeds the slugs of existing Camps.
- Public lookup: `GET /public-camps/:slug` on the Organisation's subdomain, by the current or a former slug, answering the current slug (for a redirect, issue 33) and the Camp's effective branding.
- Module switches are stored as the list of modules switched on; switching never touches a module's data (tested with a stored file as the stub row, off and on again).
- The account now carries each membership's permissions, so pages offer what the admin may do (`membershipAllows` in `core/account`); the logo picker and accent preview moved to `core/branding`.
