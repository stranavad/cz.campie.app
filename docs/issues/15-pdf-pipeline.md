# 15 - PDF pipeline

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: 06, 11
Stories: 159

## What to build

Build one rendering pipeline for every generated document: a React template rendered to static markup and sent to the PDF renderer port. Branding (logo, accent colour, display name) and the Organisation's legal identity are inputs to every template, never hard-coded. Rendering runs as a background job and the result is stored through the encrypted file service once issue 12 exists (until then, returned directly in tests). Templates are phrased so camp data never needs Czech declension. Ship one sample template proving branding and legal identity flow through.

## Acceptance criteria

- [x] A sample template renders to a PDF through the fake renderer in tests and through Gotenberg locally
- [x] Changing the Organisation's logo, colour or legal name changes the rendered output
- [x] No Domino name, address or logo appears anywhere in templates
- [x] Rendering runs as a job and does not block the request

## Notes

- Spec sections: Generated documents and printouts
- Port from Domino: `packages/documents/src/render.tsx`, `packages/documents/src/pdf.ts`, `packages/documents/src/design-system/`, `apps/api/src/pdf/services/pdf.service.ts`
- One pipeline instead of Domino's separate documents and printouts packages (spec Further Notes)

## Comments

2026-11-02 - **Done.** `core/documents/` holds the one pipeline: a React template, static markup, the `PdfRenderer` port.

- Templates: a `DocumentTemplate<Props>` is a component wrapped in `DocumentLayout`; `DocumentService` gives it the `letterhead` (display name, accent colour, logo, legal name, IČO, address) of the current unit of work's Organisation, so no template can hard-code one. `documents.store(template, props, name)` renders and stores the PDF through the encrypted file service and returns the file id; features call it from their own job. `Fact` renders camp data as "label: value", so it never needs declension.
- Organisation columns, minimal for issues 17 and 23 to extend: `legal_name`, `ico`, `address` (one text), `display_name`, `accent_colour` (default `#2b8a4e`) and `logo_file_id`. A CHECK keeps `accent_colour` a lowercase `#rrggbb`, since it goes into CSS. The logo column has no foreign key to `files`, since that would be an import cycle between the schema files. Issue 23's logo replacement must clear or replace it; until then, a logo file that is gone or isn't an image renders without a logo and logs a warning, instead of failing every document. `OrganisationRepository` gained `getByIdOrThrow` and `update`; `FileService` gained `read(fileId)` for the logo's bytes.
- Gotenberg: the adapter now sends `preferCssPageSize` and `printBackground`, so the layout's `@page` rule (A4, margins) and the accent colour apply. The logo is inlined as a data URL.
- Tests: `core/documents/documents.integration.test.ts` renders the sample in a drained job (nothing renders before the job runs), checks the letterhead in the HTML the fake received, blind to another Organisation, downloads the stored PDF, shows that changing the logo, colour and legal name changes the output, renders past a missing logo and refuses a non-hex colour. The sample template is `src/testing/sample-document.tsx` and isn't shipped in the build.
- Rendered by hand through the Compose Gotenberg 8.38.1: one A4 page, logo, accent rule and Czech diacritics in Noto Sans. There's no automated Gotenberg test, since the spec allows only two test seams.
- Assumed, to confirm:
  - Address is one text column. Issue 17 or 23 may split it.
  - Template wording is Czech literals in the templates, not the translation layer: the spec fixes the wording per platform, and the API has no translation layer yet.
  - The letterhead appears once, at the top of the first page. No running header or footer, and no page numbers yet.
- Open for later: a job renders inside its unit of work, so the transaction stays open during the Gotenberg round trip. Revisit if batch rendering (printouts, archives) strains the connection pool.
- Local setup: the migration adds NOT NULL columns to `organisations`, so a local database that already holds Organisations needs a reset.

2026-11-08 - **Project lead follow-up.** The PDF jobs (`registrations.generate-prihlasky`, `registrations.regenerate-prihlaska`, `consents.generate-signed-consent`) alert the Platform operator when they give up (see issue 11); no fallback mail to the guardian. `FakePdfRenderer.failing` makes renders fail in tests.
