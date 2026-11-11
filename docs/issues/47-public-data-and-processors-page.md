# 47 - Public data and processors page

Status: in-progress
Stage: 1a
Episode: E6 Admin Registrations
Blocked by: 13
Stories: 10, 16

## What to build

A public page on the main host stating where data is stored, which providers process it (database, file storage, mail, PDF rendering, payment gateway, hosting), what is encrypted, and that the platform operator's lack of access is an application rule backed by Owner grants and the audit log, not a cryptographic guarantee. The human work is writing and approving the text, which depends on the backend hosting decision and the lawyer's terms and data processing agreement. An agent then publishes it as a static page linked from signup and the footer.

## Acceptance criteria

- [x] Text written and approved by the project lead (with the lawyer's input where it touches the data processing agreement).
- [x] Lists every production adapter's provider and region; matches the ports table in the spec.
- [x] States the encryption scope and the operator-access caveat.
- [x] Page reachable without login, linked from the signup page and the footer; strings through i18n.

## Notes

- Spec sections: Encryption (operator caveat); Non-code dependencies (legal texts, hosting).
- Blocked in practice by the hosting decision; publish with "to be decided" only if the pilot approval needs it earlier.

## Comments

2026-11-08 - **Drafts published, waiting for the operator and the lawyer.** Three pages on the main host, reachable without login and linked from signup (as before) and from a new footer on every main-host page: `/podminky` (Obchodní podmínky), `/zpracovatelska-smlouva` (Smlouva o zpracování osobních údajů, GDPR art. 28) and `/zpracovani-dat` (this issue's page). Each shows the notice "Návrh - čeká na právní kontrolu" and highlights every unfilled `[doplní provozovatel: ...]` gap. Texts live in the `legal` namespace (`apps/app/src/locales/cs/legal.json`): per document a `title`, `intro` paragraphs and `sections` of `heading` plus `paragraphs`, read typed with `returnObjects`; the processors are `processors.rows`. Contract articles and paragraphs are numbered by the page. `CURRENT_LEGAL_VERSIONS` stays `'draft'`; the lawyer-approved text bumps it.

Facts come from the code, not only the spec: one server managed with Dokploy runs the app, the job queue (Redis) and Gotenberg; PostgreSQL on Neon; files on Tigris; mail via Resend; card payments via each Organisation's own Comgate account (described as the Organisation's own provider, not the operator's subprocessor). Encrypted with the Organisation's data key today: every stored file and its name (uploads, Přihlášky, signed Consents, exports, logos) and the Comgate secret. Rodné číslo and the health note are not collected yet (issue 29 has no sensitive field), so the pages say they will be encrypted once collected; update that sentence when the catalogue ships them. The spec still says the frontend deploys to Vercel; the pages follow the project lead's one-server decision.

Left in progress because two criteria are open: approval of the text (project lead, lawyer for the agreement) and the regions. Gaps for the operator: legal identity and contact (terms 1.1, agreement 1.2, data page), price and payment terms, any guaranteed availability, liability cap, notice periods for termination, changes and new subprocessors, breach notification hours, deletion deadline after termination, backup method and retention, audit notice, effective dates, third-country safeguards per provider, the server provider and its location, Neon, Tigris and Resend regions, and whether Neon and Tigris encrypt at rest. Once filled, approved and the version bumped, this issue can close.

2026-11-08 - **Promises without code yet.** The drafts promise things the platform does not do on its own, to be built or done by hand before the first approval: deleting an Organisation's data at the end of the contract (destroying its data key, deleting its rows and stored files; today only rejecting a pending Organisation deletes anything), emailing the Owners about a suspension and its reason (suspension stores no reason and stops the Organisation's mail), and emailing the Owners ahead of changes to the terms or the subprocessors. The texts say plainly that support access reaches health data and that the audit log records entering, every change, health views and sensitive exports, not plain reads, as the code does.

2026-11-11 - **Version 1.0 published without a lawyer.** The project lead could not get a lawyer before the first camps, so the gaps were filled from his decisions and the draft notice, the placeholder highlighting and the `draft` version are gone: `CURRENT_LEGAL_VERSIONS` is `1.0`, effective 2026-11-11. No real Organisation accepted `draft`. A fourth page, `/ochrana-udaju` (Zásady ochrany osobních údajů), covers what the operator controls himself: admin accounts, Organisation records, the website contact form and mail. The website footer, the contact form and Bezpečnost a data link to it.

Decided: the operator is a sole trader (identity from ARES), no data protection officer; the price is agreed individually by email and invoiced, free until agreed; damages are capped at the fees of the last 12 months, at least 10 000 CZK, not for intent or gross negligence; no guaranteed availability; an Organisation leaves at any time, the operator with 3 months' notice; 30 days' notice for changed terms and new subprocessors and for an audit; a breach is reported within 48 hours; data is deleted within 30 days of the end. Providers: Hetzner (Germany), Neon and Tigris (Frankfurt), Resend (Ireland), Sentry (Frankfurt). Neon keeps 7 days of history.

Open for the operator: Sentry is listed but not in the code yet; when it is added it must use the EU region and send no personal data, as the pages promise. The promises without code from the comment above are done by hand in the pilot. Request logs with IP addresses are promised to live 30 days at most. A lawyer's review is still worth having, first on the liability cap and on whether a data protection officer becomes mandatory as the health data grows.
