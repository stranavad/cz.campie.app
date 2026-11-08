# 47 - Public data and processors page

Status: in-progress
Stage: 1a
Episode: E6 Admin Registrations
Blocked by: 13
Stories: 10, 16

## What to build

A public page on the main host stating where data is stored, which providers process it (database, file storage, mail, PDF rendering, payment gateway, hosting), what is encrypted, and that the platform operator's lack of access is an application rule backed by Owner grants and the audit log, not a cryptographic guarantee. The human work is writing and approving the text, which depends on the backend hosting decision and the lawyer's terms and data processing agreement. An agent then publishes it as a static page linked from signup and the footer.

## Acceptance criteria

- [ ] Text written and approved by the project lead (with the lawyer's input where it touches the data processing agreement).
- [ ] Lists every production adapter's provider and region; matches the ports table in the spec.
- [x] States the encryption scope and the operator-access caveat.
- [x] Page reachable without login, linked from the signup page and the footer; strings through i18n.

## Notes

- Spec sections: Encryption (operator caveat); Non-code dependencies (legal texts, hosting).
- Blocked in practice by the hosting decision; publish with "to be decided" only if the pilot approval needs it earlier.

## Comments

2026-11-08 - **Drafts published, waiting for the operator and the lawyer.** Three pages on the main host, reachable without login and linked from signup (as before) and from a new footer on every main-host page: `/podminky` (Obchodní podmínky), `/zpracovatelska-smlouva` (Smlouva o zpracování osobních údajů, GDPR art. 28) and `/zpracovani-dat` (this issue's page). Each shows the notice "Návrh - čeká na právní kontrolu" and highlights every unfilled `[doplní provozovatel: ...]` gap. Texts live in the `legal` namespace (`apps/app/src/locales/cs/legal.json`): per document a `title`, `intro` paragraphs and `sections` of `heading` plus `paragraphs`, read typed with `returnObjects`; the processors are `processors.rows`. Contract articles and paragraphs are numbered by the page. `CURRENT_LEGAL_VERSIONS` stays `'draft'`; the lawyer-approved text bumps it.

Facts come from the code, not only the spec: one server managed with Dokploy runs the app, the job queue (Redis) and Gotenberg; PostgreSQL on Neon; files on Tigris; mail via Resend; card payments via each Organisation's own Comgate account (described as the Organisation's own provider, not the operator's subprocessor). Encrypted with the Organisation's data key today: every stored file and its name (uploads, Přihlášky, signed Consents, exports, logos) and the Comgate secret. Rodné číslo and the health note are not collected yet (issue 29 has no sensitive field), so the pages say they will be encrypted once collected; update that sentence when the catalogue ships them. The spec still says the frontend deploys to Vercel; the pages follow the project lead's one-server decision.

Left in progress because two criteria are open: approval of the text (project lead, lawyer for the agreement) and the regions. Gaps for the operator: legal identity and contact (terms 1.1, agreement 1.2, data page), price and payment terms, any guaranteed availability, liability cap, notice periods for termination, changes and new subprocessors, breach notification hours, deletion deadline after termination, backup method and retention, audit notice, effective dates, third-country safeguards per provider, the server provider and its location, Neon, Tigris and Resend regions, and whether Neon and Tigris encrypt at rest. Once filled, approved and the version bumped, this issue can close.
