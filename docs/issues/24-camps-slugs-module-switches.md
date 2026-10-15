# 24 - Camps, slugs, module switches

Status: ready-for-agent
Stage: 1a
Episode: E2 Camp setup
Blocked by: 19
Stories: 19, 35, 36, 40

## What to build

An Organisation owns one or more Camps. Signup (issue 17) already creates the first Camp automatically; this issue adds the Camp entity's full management. An admin with Camp settings write can rename a Camp, set its slug, its website link and its contact (name, email, phone used as the reply address and shown to guardians), and create a second Camp. Each Camp has module switches (Consents, Documents, generated documents, Health record, Camp health log, Oddíly, Vedoucí); switching a module off hides it and keeps its data. The slug is unique within the Organisation and editable; every former slug is kept and resolves to the Camp so links on camp websites keep working. When the Organisation has only one Camp, the admin interface never shows a Camp picker.

## Acceptance criteria

- [ ] Admin with Camp settings write can create, rename and edit a Camp; read can view; none gets 403.
- [ ] Slug is validated (lowercase letters, digits, hyphens), unique within the Organisation, and the same slug may exist in another Organisation.
- [ ] Changing a slug keeps the old one resolvable to the same Camp; reusing a former slug of another Camp in the same Organisation is rejected.
- [ ] A public lookup by Organisation host + slug (old or new) returns the Camp; used later by issue 33.
- [ ] Module switches persist per Camp; switching off and on again returns the module's data unchanged (verified with a stub row).
- [ ] An admin of Organisation A cannot read or change Organisation B's Camps, including by guessed id; an unscoped query returns nothing (RLS).
- [ ] Every change writes an audit entry with old and new values.
- [ ] Admin UI: Camp settings page and, with several Camps, a Camp switcher; all strings through i18n.

## Notes

- Spec sections: Tenancy, Other (modules), Architecture (public addresses).
- Branding override per Camp is issue 23; this issue only stores Camp identity, slug, contact, link and switches.
- Domino has no Camp entity (ADR-0007 in this repo rejected it); nothing to port.
