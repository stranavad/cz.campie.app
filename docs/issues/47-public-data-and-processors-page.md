# 47 - Public data and processors page

Status: ready-for-human
Stage: 1a
Episode: E6 Admin Registrations
Blocked by: 13
Stories: 10, 16

## What to build
A public page on the main host stating where data is stored, which providers process it (database, file storage, mail, PDF rendering, payment gateway, hosting), what is encrypted, and that the platform operator's lack of access is an application rule backed by Owner grants and the audit log, not a cryptographic guarantee. The human work is writing and approving the text, which depends on the backend hosting decision and the lawyer's terms and data processing agreement. An agent then publishes it as a static page linked from signup and the footer.

## Acceptance criteria
- [ ] Text written and approved by the project lead (with the lawyer's input where it touches the data processing agreement).
- [ ] Lists every production adapter's provider and region; matches the ports table in the spec.
- [ ] States the encryption scope and the operator-access caveat.
- [ ] Page reachable without login, linked from the signup page and the footer; strings through i18n.

## Notes
- Spec sections: Encryption (operator caveat); Non-code dependencies (legal texts, hosting).
- Blocked in practice by the hosting decision; publish with "to be decided" only if the pilot approval needs it earlier.
