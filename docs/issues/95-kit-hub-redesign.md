# 95 - Starter kit: the hub `/pruvodce` as designed, with the deadline calculator

Status: done
Stage: web
Episode: W2 Kit redesign
Blocked by: 94, 96
Stories: -

## What to build

The hub as the artboard "Rozcestník /pruvodce" (`PruvodceRozcestnik`) draws it: the news strip, the hero with the verification line and the jump links, step 1 "Jaká akce to je?" as two cards side by side, step 2 "Kdy co zařídit" as a timeline with a date field, the guides in four groups, the templates, and "Co se změnilo". The shared rules of issue 94 apply. This replaces the calculator half of issue 92.

## Decisions

- **Sections and their anchors**: `#akce`, `#kdy`, `#pruvodci`, `#vzory`, `#novinky`. The menu and the section bar link them.
- **Step 1** is static: no question form. Two cards with the rule, an example, "Co z toho plyne" and the count of rules. The points of each card come from `hub.decision.columns`; the counts are computed from the guides (all Facts; Facts with `smallToo`). The two notes under the cards (the 5-day boundary, the camp run as a business linking the zájezd guide) and the link to the whole guide with its count follow.
- **Step 2**: the timeline is rendered at build time from `hub.timeline.steps` - every Fact with its basis mark and citation links, the step's links to guides and templates - and reads complete without JavaScript. The date field is an enhancement: a small script writes each step's date (from `offset`) and "za N dní" beside it, and the summary line; the chosen date is kept in `localStorage`. No date is preset. The step of the departure day is the marked one.
- **The bridge under the timeline** ("Posudky, bezinfekčnost a souhlasy ... Jak to funguje") links `/co-umi`. It is the page's only offer of Campie besides the closing block of issue 94.
- **Guide cards** from `hub.guides.groups`: icon, "Novinka 2027" where `isNew`, the guide's `nav`, `card`, the `chips`, the count of rules and of linked templates. A group of four is a 2x2 grid, others three in a row.
- **Templates**: four cards with the small sheet drawing and the kind tag (`kitLabels.documentKind`).
- **"Co se změnilo"**: the 2027 column lists every change of 2027 from `kitChanges()`, the first as the dark "Zpráva roku" card; the 2026 column is a `details` with all its changes, each linking its guide; then "Co se teprve chystá" from `hub.changes.pending`, dashed. All of it is in the HTML.
- **News strip** above the hero: the 2027 výpis sentence linking its guide.
- Structured data: `ItemList` of the guides, as today; the page's `dateModified` is the latest `verified`.

## Acceptance criteria

- [ ] The page matches the artboard at 1440 px and 390 px in both themes.
- [ ] No placeholder text of the design is on the page; every legal statement shows its basis and links its source.
- [ ] With JavaScript off the timeline shows every step and Fact; with it, a chosen date gives each dated step its date and distance, and survives a reload.
- [ ] The counts on the page equal the counts of Facts in the content.
- [ ] `check-types`, `lint`, `build` and `test` pass.

## Comments

### 2026-11-20

Built. `src/pages/pruvodce.astro` is six sections from `src/components/kit/hub/` (`Hero` with the news strip, `Decision`, `Timeline`, `GuideGroups`, `Templates`, `Changes`, plus `SectionHead` and `ClaimCard`, the compact Fact card of the timeline and the changes), over `hubPage()` in `lib/kit/pages.ts`. The design's texts are in `hub.ts`; `hub.decision` now carries each column's label, rule (with its § citation), examples and count line, and the two notes with their sources. The counts are computed from the Facts (all; `smallToo`), the "Zpráva roku" is the first 2027 change of `kitChanges()`, the 2026 changes are in a `details`, the proposals dashed. The timeline is complete in the HTML; `src/scripts/deadlines.ts` shows the date field, writes each step's date and "za N dní" and the summary line (a step's new optional `summary`), and keeps the day in `localStorage`; the date math is `lib/kit/deadlines.ts`, tested (month back to the month's last day, Czech plurals). JSON-LD: a `CollectionPage` with the guides' `ItemList`, `dateModified` the latest `verified` (there was none before). `CiteLinks` got an `inline` prop, `GuideCard` accepts `h4`. Markdown twin follows the page. Checked at 1440 and 390 px, light and dark, with a date, after a reload and with JavaScript off; check-types, lint, build and test pass.

Open: the news strip sits under the breadcrumbs of `Base.astro`, not directly under the header as drawn. The design's "Novinka 2027" tag on a "Co z toho plyne" point is left out (the points are plain strings). `KitCard.astro` has no user left.

### 2026-11-20 (design update)

Brought in line with the owner's new design. The news strip is gone: the hero starts with a chip ("Novinka 2027" from `kitLabels.newTag` and `hub.news`, linking `#novinky`), whose sentence stays legally narrow ("Vedoucí nově dokládají výpis z rejstříku pro práci s dětmi", not the design's "každý vedoucí"). Then the `h1`, the shorter lead, the verification line under it without the season tag (`Verification` takes `season={false}`) and three entry cards (`hub.entries`, icons `calendar` and `sheet` added to `content/kit/icons.ts`; the templates' line counts `documentList`) in place of the jump pills, one column on phones. The hero sits right under the breadcrumbs of `Base.astro` with a small top padding. Guides: "Průvodci · 11", "Každé téma do hloubky", no lead; the groups' `lead` is removed from the content and the type, the cards leave out their line (`GuideCard` prop `summary`, default on). Markdown twin follows (news line first, no guides lead, no group leads; card lines kept as link descriptions). Removed `hub.jump`, the news strip's tag and guide link.
