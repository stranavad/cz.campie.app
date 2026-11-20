# 96 - Starter kit: the claim row, the guide page and the list of templates

Status: in-progress
Stage: web
Episode: W2 Kit redesign
Blocked by: 86
Stories: -

## What to build

The design's "tvrzení" (claim) as the kit's shared component, and with it the guide page `/pruvodce/<slug>` and the list `/vzory`. The design draws no artboard for these two pages; they are built from the claim styles shared by every kit artboard (`.cl`, `.kind`, `.tag`, `.legend`, `.verified`, `.vtag`, `.disc` in `PruvodceRozcestnik`) and from the hub's and the template page's look. The shared rules of issue 94 apply.

## Decisions

- **Claim row**: three columns on desktop - the basis mark (§ Zákon, Ú Výklad úřadu, O Doporučení organizace, c Naše doporučení; told apart by the mark's border style, not by colour alone), the statement with its tags ("I menší akce", "Novinka 2027" / "Platí od") and the regulation's words in a `details`, then the citations in mono on the right. One column on phones. `Fact.astro`, `BasisBadge.astro`, `CiteLinks.astro` and `Legend.astro` are rebuilt to it; every page of the kit uses them.
- **Legend** is one compact line of the four marks with a `details` for what they mean, not a large box.
- **Guide page**: the verification line (season tag, "Ověřeno", "Právní stav k"), `h1`, lead, the count of rules and how many also bind a smaller event; a contents list of the sections (sticky beside the text on desktop, a `details` on phones); the sections as lists of claim rows with their `h2`; "Vzory k tématu" and "Související průvodci" as cards; the sources; the disclaimer. Previous and next guide in the order of `hub.guides.groups` at the end.
- **A filter "Jen pravidla pro menší akce"** on the guide page: CSS only (a checkbox and `:has()`), so every Fact stays in the HTML.
- **`/vzory`**: hero with the verification line, the four templates as large cards (sheet drawing, kind tag, what it is for, "Stáhnout prázdné PDF" and "Upravit na svůj tábor"), then the guides they belong to.
- **SEO**: `Article` data with `dateModified` stays; each guide section's heading is a link target (`id`), listed in the contents; a guide links its 2-3 related guides and its templates in the text column, not only in the footer. `FAQPage` data is not added (the page is not questions and answers).
- Breadcrumbs, the section bar and the closing block come from `Base.astro` (issue 94); these pages render none of their own, and no "Letos to zkuste bez tabulek" band.

## Acceptance criteria

- [ ] A claim row shows basis, statement, tags, quote and citations as the design's `.cl`, in both themes, at 390 px and 1440 px.
- [ ] Every guide page and `/vzory` build; headings are in order with one `h1`; section anchors work.
- [ ] The small-event filter hides the other rows without JavaScript and without removing them from the HTML.
- [ ] `check-types`, `lint`, `build` and `test` pass; `apps/web/AGENTS.md` describes the claim row.

## Comments

### 2026-11-20

Built. The claim row is `Fact.astro` (basis mark, statement with quote `details` and tags, citations in mono; three columns from 640px of the row's own width via a container query, one below), with `BasisBadge`, `Tag`, `CiteLinks`, `Claims`, `Legend` (one line, `details` for the meanings), `Verification`, `ContentsList`, `GuideCard`, `TemplateCard` and `SheetDrawing` in `src/components/kit/`. The guide page (`wide`) has the verification line, counts, sticky numbered contents (a `details` on phones), numbered sections, templates and related guides as cards in the text column, sources, disclaimer and previous/next in the order of `hub.guides.groups`. The small-event filter is a checkbox plus a `:has()` rule in `global.css`; rows stay in the HTML. `/vzory` has the verification line, four large template cards (drawn sheet, kind tag, summary, "Upravit na svůj tábor" or "Zobrazit vzor" for the official form, "Stáhnout prázdné PDF" counted as `kit-download`), then the guides the templates rest on. Guide icons are in `src/content/kit/icons.ts`. Checked at 390 and 1440 px in both themes; check-types, lint, build and test pass.

Open: the configurator's own badge in `ConfiguratorForm.tsx` still draws the old dots; it can take `fact.mark` when issue 97 rebuilds it.
