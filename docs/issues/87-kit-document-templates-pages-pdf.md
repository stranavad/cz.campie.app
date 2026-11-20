# 87 - Starter kit: document templates, their pages and static PDFs

Status: in-progress
Stage: web
Episode: W1 Starter kit
Blocked by: 86
Stories: -

## What to build

The document templates of the starter kit as pages of the marketing website: the list `/vzory` and one page per template at `/vzory/<slug>`, each with the document shown as HTML, a blank PDF to download, and what the law says about the document. Four templates ship: prohlášení o bezinfekčnosti, posudek o zdravotní způsobilosti dítěte (the prescribed form, word for word), souhlas se zpracováním osobních údajů (photos), souhlasy rodičů k pobytu.

## Decisions

- **One model, three outputs.** A `DocumentTemplate` (`src/content/kit/documents/types.ts`) plus the organiser's `KitSettings` and the chosen items become a list of blocks through one pure function; the HTML preview, the PDF and (issue 88) the configurator all take that list. No renderer reads the template on its own.
- **The HTML renderer is a pure function to a string**, used at build time for the page's static preview and in the browser for the live one. The static preview is the template's preset (its `defaultOn` items) without letterhead.
- **PDFs are made without a server.** The marketing website stays outside the platform: no call to `apps/api`, no Gotenberg. What the organiser types never leaves the browser, which the page says. The same PDF builder runs in Node at build time for the blank PDFs (`/vzory/<slug>.pdf`, real files other sites can link) and in the browser for customised ones.
- **PDF library**: chosen by these criteria, in this order: works under the site's Content-Security-Policy as it stands (`script-src 'self'`, no `unsafe-eval`); embeds a font with full Czech diacritics; runs in Node and in the browser from one document definition; is loaded only when a download is asked for, never with the page. pdfmake is the first candidate; pdf-lib with our own layout is the fallback. The choice and what was verified goes under Comments.
- **A blank PDF is the preset**: default items, no letterhead, the `event` block as blank lines only where the template sets `blankWhenEmpty`.
- **The prescribed form is not customisable.** `kind: 'form'` prints as it stands, without letterhead and without the configurator.
- **A document page**: hero (`pageTitle`, `lead`), the two actions (download blank PDF; jump to the configurator, absent for a form), the preview, the configurator's place (issue 88), "what the law says" (the guide sections named in `explain.sections`, rendered as on the guide pages, then `explain.facts`), for each item its `why` Fact, related guides and documents, the list of sources, the disclaimer, the call to action with `inCampie`.
- **SEO plumbing as for the guides** (issue 86): indexed-page registry, sitemap, canonical, Open Graph image, Markdown twin, `llms.txt`, breadcrumb Campie > Vzory > document, `Article` structured data. The PDFs are in the sitemap too.
- **Print stylesheet.** Printing a document page prints the preview alone, so "Ctrl+P" gives a usable document even without the PDF.

## Acceptance criteria

- [ ] `/vzory` and the four `/vzory/<slug>` pages build and render in both themes, phone and desktop.
- [ ] `/vzory/<slug>.pdf` exists for each template after the build, opens in a PDF reader, shows Czech diacritics correctly and fits A4 with sensible page breaks (no heading left alone at the bottom of a page, no signature line split from its label).
- [ ] The posudek PDF matches příloha č. 3 of vyhláška č. 106/2001 Sb. in wording and order.
- [ ] Every item's `why` and every Fact on a document page shows its basis and its citations, as on the guide pages.
- [ ] The preview on the page and the blank PDF show the same content.
- [ ] No inline script; the PDF library is not in the page's initial requests.
- [ ] `check-types`, `lint`, `build` and `test` pass; `apps/web/AGENTS.md` describes the document pages and the PDF pipeline.

## Notes

- Content: `apps/web/src/content/kit/documents/` (`types.ts`, the four templates, `index.ts` with `documentsIndex` and `documentLabels`). The template texts are not edited in this issue.
- Texts printed in a document are plain text with `**bold**` only. `text` of an item may hold line breaks; a line "Label: value" is one paragraph.
- Campie's own PDF pipeline (issue 15, `apps/api/src/core/documents/`) stays as it is; nothing is shared with it in this issue.

## Comments

2026-11-19 - Implemented as a local proof of concept (not committed).

- PDF library: **pdfmake 0.3.14** (latest on npm on this date), with `@types/pdfmake` 0.3.3. Checked against the criteria in order: (1) CSP: the browser build contains no `eval`/`new Function`, and generating a document in headless Chrome under the site's CSP (`script-src 'self' ...`, no `unsafe-eval`) reports no violation. One trap found and avoided: pdfmake decodes a **PNG** image with fflate's async inflate, which starts a Web Worker from a blob URL; the CSP blocks it (`worker-src` falls back to `script-src`) and the PDF never finishes. The configurator therefore keeps the logo as a JPEG (a PNG is drawn on white and re-encoded), which pdfmake embeds without decoding. (2) Czech: Figtree's static TTFs from `@expo-google-fonts/figtree` 0.4.1 (Google Fonts, OFL), Regular and Bold, embedded and subset; `pdffonts` shows both as embedded CID TrueType, and the rendered PDFs show ě š č ř ž ý á í é ú ů ď ť ň correctly. The Fontsource files of the site are split into latin and latin-ext subsets and the Fontsource Figtree is variable, so neither works for one embedded font. (3) One definition: `src/lib/kit/pdf.ts` is a pure function to a pdfmake definition; `pdf-node.ts` writes it at build time (fonts from disk, URL access denied, local access limited to the two font files), `pdf-browser.ts` in the browser (fonts fetched from this site's `/_astro/`). (4) Lazy: `pdf-browser.ts` is a dynamic import on "Stáhnout PDF"; the page's scripts never contain pdfmake (asserted in `tests/dist.test.ts`). The chunk is 772 kB, 287 kB gzip; the two fonts are 40 kB each.
- Layout: A4, margins 54/48/54/58 pt, body 10.5 pt (the form 9.5 pt, denser lines, so it keeps to two pages like the original), items and the signature block unbreakable, a heading travels with the block after it, write-on lines are bottom-ruled table cells so they span whatever width they stand in, framed boxes for the form (allowed to break across pages; the break falls between part A and part B of box 3), footer with the credit line and "n / m" when there is more than one page. Rendered all four blank PDFs with `pdftoppm` and checked them by eye: bezinfekčnost 1 page, souhlas s údaji 1, souhlasy k pobytu 2, posudek 2.
- Pages: `/vzory`, `/vzory/<slug>` and `/vzory/<slug>.pdf`, in the page registry (`documents` and `document:<slug>` keys) with canonical, sitemap (the PDFs via `customPages`), OG image, Markdown twin with the document's text, `llms.txt`, breadcrumb Campie > Vzory > document and `Article` JSON-LD. Print stylesheet prints the sheet alone (checked with Chrome's print to PDF).
- Small changes outside the kit: `ogImageUrl` in `src/lib/href.ts` now takes the page's slug, so `href.ts` no longer imports the page registry (the configurator imports it in the browser); `astro.config.ts` defines `process.env.SITE_ENV` for the browser bundle.
- Added labels to `documentLabels` (`itemsWhy`, `itemsWhyLead`, `defaultOn`) and `documentsIndex.guides`. No template text, item, `why` or citation was changed; `documents/types.ts` is unchanged.
- Not verified: `pnpm preview` (wrangler) was not run; the CSP was checked with a small static server sending the `Content-Security-Policy` of `dist/_headers`. The posudek's wording was rendered from `posudek.ts` as it stands; it was not compared against the Sbírka text in this issue.

2026-11-19 - Follow-up after the owner's review: A4 preview, fit to one page, pagination.

- Layout made more economical without costing usability: "souhlasím / nesouhlasím" on the item's title row, right-aligned; a full-width field followed by a lone half-width one share a row 2:1 (child's name and date of birth, IČO beside the address in the posudek); tighter gaps. Fill-in lines stay at least 15 pt (over 5 mm).
- Fit-to-page ladder (`src/lib/kit/sheet.ts`): four densities, 10.5 pt body down to a 9 pt floor. The PDF takes the roomiest density at which it is one page, found by pdfmake itself (each unit carries an id that `pageBreakBefore` reports; the footer's page count catches an empty trailing page). A template that never fits uses the roomiest density and runs on; the form uses the roomiest density with the fewest pages. Blank presets: bezinfekčnost, souhlas se zpracováním and souhlasy k pobytu each one page at the roomiest density. The posudek does not fit one page even at the floor, so it is two pages at 9.5 pt: page 1 the title and boxes 1-3, page 2 boxes 4-5 and the doctor's part, with no box split.
- Pagination: an item, the signature block, a framed box and a heading with the block under it are kept together, and every break falls between them. The preview is a stack of true A4 pages (210:297, growing instead of clipping) scaled from the same constants as the PDF, with the PDF's footer and "1 / 2" in the same place. The static preview is paginated at build time from the blank PDF's own pdfmake layout; the configurator paginates live by measuring the units in an unseen 794 px page, with a 1.5 % safety margin, without loading pdfmake. Checked for each template's preset, preset with letterhead and logo, and everything switched on plus two long own items: the preview and the downloaded PDF agree on the page count in every case.
- Phones: below 640 px of page width a scaled A4 would set text at 6-8 px, so the sheets keep the PDF's page split and footer but reflow at a readable fixed size (1 pt = 1.4 px: about 14.7 px body, 12 px labels); the A4 aspect ratio applies from 640 px up.
- Ctrl+P prints the A4 pages alone, one per sheet at real size (checked with Chrome's print to PDF: 2 A4 pages for a 2-page document).
- The template pages opt into a wider column (`Base.astro` `wide`, `--wrap-max: 1340px`, header and footer included) so the form and the A4 preview stand side by side; at 1440 px the form is 460 px and the A4 page 766 px wide.

2026-11-20 - The posudek now fits one A4 page (was two at 9.5 pt), with no word, label, option, footnote or part changed, dropped or reordered: the model's strings of `posudek.ts` before and after are identical, and the PDF's words (pdftotext) match the old PDF's except the gone "1 / 2", "2 / 2".

- Layout only, PDF and preview alike: `DocField.inline` (label on its line's left; off by default) for "Evidenční číslo posudku", "Název poskytovatele...", the five lines of 3 B, and box 5's name and relation; the three options of 3 A in one row; "2. Účel vydání posudku" on its own line (`titleOnLine`: a box holding only one unlabeled line); the child's address on one line; "převzala... dne" and "Podpis oprávněné osoby" side by side; the doctor's part a third / two thirds (`fieldRows` now pairs a half-width field with a full-width one after it too) with two lines instead of three; the Poučení as small print (a `note`, 8 pt).
- Tighter form at every density (`FORM` in `sheet.ts`: field gap 3 pt, gap between parts 4 pt); box padding 5 pt, box title and heading gaps smaller (boxes are the form's only); the title-to-form gap 6 pt for a form.
- Result: one page at density 2 (body 9.5 pt, labels and small print 8 pt, fill-in lines 16 pt), about 13 pt to spare. On phones (below 640 px of page width) an inline label that leaves no room for its line puts the line under it.
- The other three blank PDFs render pixel-identical to before (`pdftoppm -r 60`), each 1 page. `tests/dist.test.ts` now expects every blank PDF to be 1 page.
