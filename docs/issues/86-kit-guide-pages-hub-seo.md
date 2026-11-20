# 86 - Starter kit: guide pages, hub and SEO plumbing

Status: in-progress
Stage: web
Episode: W1 Starter kit
Blocked by: 85
Stories: -

## What to build

Render the kit's content (issue 85) as pages of the marketing website: the hub `/pruvodce` and one page per guide at `/pruvodce/<slug>`. Every Fact shows what kind of statement it is and links its sources; every page ends with the list of sources it cites. The pages are static HTML: a search engine that runs no JavaScript reads all of it.

## Decisions

- **Routes.** `/pruvodce` (hub) and `/pruvodce/<guide.slug>` from `guides` in `src/content/kit/guides/index.ts`. Document templates will live at `/vzory` and `/vzory/<slug>` (issue 87); the hub and the guides already link them through `documentList`.
- **A Fact on the page**: its text, a badge for its `basis` (label from `kitLabels.basis`), its citations as links (`<source.short>, <cite.at>`, to `source.url` plus `#anchor` when the citation has one), "Platí od <date>" when it has `since`, "I menší akce" when `smallToo`, and the `quote` in a `<details>` labelled `kitLabels.quoteLabel`. External links open in the same tab and carry `rel="noopener"`; no `nofollow` on regulations and authorities.
- **A guide page**: hero (title, lead), the line "Ověřeno <verified> · Právní stav k 1. 1. 2027", a table of contents of its sections, the legend of the four kinds of statement, the sections, related guides and documents, the list of sources grouped by kind (only those the page cites), the disclaimer, the closing call to action.
- **The hub**: hero, the decision between zotavovací akce and jiná podobná akce (two columns with its citations and a link to the guide), the timeline, the guides as cards, the documents as cards, the changes, the disclaimer.
- **The changes are derived**: every Fact of every guide with `since >= hub.changes.from`, grouped by date under `hub.changes.headings`, newest first, each linking the guide and section it comes from; a Fact that appears in two guides is listed once. Then `hub.changes.pending`.
- **One registry of indexed pages.** Kit pages join `pages` in `src/content/seo.ts` (or a registry it is built from), so each gets a canonical URL, the sitemap entry with `lastModified` (the guide's `verified`), an Open Graph image, a Markdown twin and its line in `llms.txt`, like the four existing pages. The Markdown twin of a guide carries the Facts with their citations as links.
- **Structured data.** Breadcrumb Campie > Průvodce > guide; `Article` with `datePublished`/`dateModified` (the `verified` date), `inLanguage`, publisher the Organisation. No `FAQPage` on these pages (the home page keeps its own).
- **Navigation.** "Průvodce" joins the header navigation and the footer; the home page gets no new section in this issue.
- **Logic stays out of `.astro`.** Resolving a citation to a link, collecting a page's sources, collecting the changes: typed functions in `src/lib/kit/`.
- **Design.** No canvas exists for these pages. They use the existing tokens, type scale and components (`PageHero`, `card`, `eyebrow`, `ArrowLink`, `CtaBand`) and both themes. Long-form reading: a measure of about 70 characters for Fact texts, badges quiet enough that a page of twenty Facts does not look like a warning sign.

## Acceptance criteria

- [ ] `/pruvodce` and the eleven `/pruvodce/<slug>` pages build and render in both themes, at phone width and desktop width.
- [ ] Every Fact on every page shows its basis and at least one working citation link; a citation with an anchor links the paragraph.
- [ ] Every guide page lists the sources it cites and only those.
- [ ] The hub's changes list is derived from the Facts and names the guide each change comes from.
- [ ] Sitemap, canonical, Open Graph image, Markdown twin and `llms.txt` cover every kit page; `tests/dist.test.ts` knows the new pages and passes.
- [ ] The page works with JavaScript off (nothing here needs a script).
- [ ] `pnpm --filter web check-types`, `lint`, `build` and `test` pass; `apps/web/AGENTS.md` describes the kit (pages, where its content lives, the "no statement without a source" rule).

## Notes

- Content: `apps/web/src/content/kit/` (`types.ts`, `sources.ts`, `cite.ts`, `guides/`, `hub.ts`, `document-list.ts`). The guide texts and citations are not edited in this issue.
- The website's rules: `apps/web/AGENTS.md`, in particular no inline scripts, no `style=` attributes, no raw colours, no text outside `src/content/`, hyphen never em-dash.

## Comments

### 2026-11-19 - local proof of concept, not merged

Built: `/pruvodce` and the eleven `/pruvodce/<slug>` pages (`src/pages/pruvodce.astro`, `src/pages/pruvodce/[slug].astro`, components in `src/components/kit/`), logic in `src/lib/kit/` (`facts.ts`, `links.ts`, `pages.ts`). The kit pages join `pages` in `src/content/seo.ts` (keys `kit` and `guide:<slug>`), so sitemap with `lastModified`, canonical, Open Graph image (`/og/pruvodce/<slug>.png`), Markdown twin (`/pruvodce/<slug>.md`, Facts with their citations as links) and `llms.txt` cover them. The `.md` and OG endpoints became rest routes (`[...page]`) for the nested slugs. JSON-LD: breadcrumb Campie > Průvodce > guide and `Article` dated by `verified`. "Průvodce" is in the header and footer. `tests/dist.test.ts` derives the kit pages from `guides`; `tests/kit.test.ts` covers citation anchors, the sources a guide lists and the derived changes.

Assumed:

- The hub has no Article (breadcrumb only); its `lastModified` is the newest `verified` of the guides. The hub has no closing call to action, as the issue's list for the hub names none.
- A citation links its anchor only when its source has `anchors`. Citations and source links carry `rel="noopener"`, same tab.
- The changes list dedupes a Fact by its exact text; a Fact listed once links every guide section it appears in. Facts on the same change written differently in different guides are listed separately.
- Basis badges tell the four kinds apart by label and by a mark (filled dot, half, ring, dashed ring), not by colour. No new token was needed.
- The header navigation's link padding narrows between `lg` and `xl` so the extra item fits at 1024px.

Open: the changes list holds 22 Facts, several about the same 2027 rule, and some read oddly out of their section (for example "Posuzuje zdravotní stav dětí..." without its subject). A curated flag on the Facts that belong in the list may read better than deriving all of them.
