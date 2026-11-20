# 94 - Website: one header, section bar, footer and the links between the three parts

Status: in-progress
Stage: web
Episode: W2 Kit redesign
Blocked by: 86
Stories: -

## What to build

The marketing website becomes one site with three entrances: Campie (the product), Průvodce a vzory (the entrance from search, the most visited part) and Weby pro tábory (a side service). One header and one footer on every page, a section bar under the header on the kit's pages, breadcrumbs everywhere, and the bridges between the parts where the design places them. Design: artboards "Propojení: Campie, Průvodce a vzory, Weby pro tábory" (`WebStruktura`) and its mobile sheet (`WebStrukturaM`).

## Rules shared by issues 94-98

- **The design decides layout and look; the repository's content decides facts.** Where the design holds a placeholder ("[Doplnit ...]") or a simplified legal sentence, the page shows the content of `src/content/kit/` (Facts with their citations), never the design's wording. Marketing texts of the design are taken as written and go to `src/content/`.
- **The header and footer of `WebStruktura` replace** the headers and footers drawn inside the other artboards (`gh`/`foot` in the hub and template artboards, `w-top`/`w-foot` in Weby).
- **SEO comes first.** Every link of the menus is a plain `<a href>` in the HTML, shown without JavaScript (`details` or CSS). One `h1` per page, headings in order. Titles follow the design's table E: the year in the title, never in the address. Addresses do not change. Nothing that a search engine should read is rendered by script.
- The workspace's rules stand (`apps/web/AGENTS.md`): no inline script, no `style=` attribute, no raw colour in a component, no text outside `src/content/`, no logic in `.astro`, hyphen never em-dash. The design's `style="..."` attributes become classes.
- Both themes, phone and desktop. The design's `@container (max-width: 900px)` rules are the phone layout.

## Decisions

- **Header**: logo, "Co umí", "Průvodce a vzory" (opens the mega menu), "Weby pro tábory", then "Přihlásit se" and one button that follows the page's part: product pages "Vyzkoušet zdarma", kit pages the quiet "Co je Campie?" (to `/`), Weby "Chci návrhy zdarma" (to `#formular`). The home page's anchors (Pro rodiče, Co chystáme, Tábory s Campie, Časté otázky) leave the menu and stay as anchors on the home page.
- **Mega menu**: "Začněte tady" (Jaká akce to je -> `/pruvodce#akce`, Kdy co zařídit -> `/pruvodce#kdy`), the 11 guides in the four groups of `hub.guides.groups` (with `menu` as the short name), the templates with "Všechny vzory", and the foot line with the 2027 news linking `/pruvodce#novinky`. A `details` element; the links are in the HTML of every page. "Průvodce a vzory" itself must also be reachable as a link to `/pruvodce` (first link inside the panel when the trigger cannot be one).
- **Mobile**: the drawer of `WebStrukturaM` - the three parts, the kit's sub-list, the two actions at the bottom.
- **Section bar** on kit pages (`/pruvodce`, guides, `/vzory`, templates): "Průvodce a vzory", Jak začít (`/pruvodce`), Průvodci with the count (`/pruvodce#pruvodci`), Vzory with the count (`/vzory`), Co je nového 2027 (`/pruvodce#novinky`), and the search field. On phones a row of pills that scrolls sideways.
- **Search**: a field in the section bar that finds guides, their sections, Facts and templates. The index is one JSON file built from the content at build time and fetched on first focus; a small script filters it and lists links to the section anchors. Without JavaScript the field is not shown. No library.
- **Breadcrumbs** on every page but the home page, starting with "Campie", with `BreadcrumbList` data. `Base.astro` renders them from the page registry, the pages do not.
- **"Kdo za Průvodcem stojí"**: the block above the footer of every kit page. It replaces the "Letos to zkuste bez tabulek" band there; the product pages keep the band.
- **Footer**: four columns as drawn (brand line; Campie; Průvodce a vzory with the most searched pages and "Všichni průvodci a vzory"; Pro tábory), then the bottom line with the licence, the legal links and the source code. The operator's identity and e-mail stay in it.
- **Bridges**: the home page gets the band "Zdarma pro všechny pořadatele" between "Pro rodiče" and "Co chystáme", with three tiles (`/pruvodce#akce`, the bezinfekčnost template, the výpis guide). Co umí gets one sentence at the registrations linking Weby pro tábory. The kit's own bridges are built by issues 95-97.
- **Sitemap** split by part (product, guides, templates with their PDFs, Weby) behind one index, each entry with its `lastmod`.
- **Titles** of table E for `/`, `/co-umi`, `/pruvodce`, `/vzory`; guide and template titles keep their content's `seoTitle`, which must carry the year 2027 where the design's pattern does.
- The 1340px column stays for template pages only.

## Acceptance criteria

- [ ] Every page shows the same header and footer; the button on the right and the marked item follow the page's part.
- [ ] With JavaScript off, every link of the mega menu, the drawer, the section bar and the footer is in the HTML and can be opened.
- [ ] Every indexed page but the home page has breadcrumbs starting with "Campie" and matching `BreadcrumbList` data.
- [ ] The search finds "lékárnička" and links the guide's section; the index is not requested before the field is focused.
- [ ] The sitemap index lists the parts; every indexed page and blank PDF is in exactly one of them.
- [ ] Both themes, 390 px and 1440 px, no horizontal overflow; keyboard reaches and closes the menu.
- [ ] `check-types`, `lint`, `build` and `test` pass; `apps/web/AGENTS.md` describes the structure.

## Comments

### 2026-11-20

Built: one `Header` (logo, Co umí, the "Průvodce a vzory" mega menu as a `details`, Weby pro tábory, Přihlásit se, the part's button) and the phone drawer of `WebStrukturaM`; `SectionBar` with counts, "Co je nového 2027" and the search; `Breadcrumbs` and `KitAbout` rendered by `Base.astro`; the four-column `Footer` with the licence, legal links and source code; the home band "Zdarma pro všechny pořadatele" (`home/FreeKit.astro`, before Co chystáme); the Co umí sentence linking Weby (`bridge` on the first group of `features.ts`); the search index `/hledani.json` with `scripts/search.ts`; the sitemap split into produkt, pruvodce, vzory (with PDFs) and weby behind `sitemap-index.xml`; table E titles for `/`, `/co-umi`, `/pruvodce` (`hub.seoTitle`) and `/vzory` (`documentsIndex.seoTitle`). Dist tests: every menu link on every page, breadcrumbs from "Campie" matching `BreadcrumbList`, the split sitemap, "lékárnička" in the index linking `#lekarnicka`.

Decisions:

- The part comes from the page's path (`partOfPath` in `lib/nav.ts`); no page passes it. `pageFrame(page)` gives Base the part, breadcrumbs, section bar and whether `KitAbout` closes the page.
- The mega menu's trigger is a `summary`, so its first link is "Rozcestník Průvodce a vzory" to `/pruvodce`; the drawer links "Průvodce a vzory" directly.
- The mega menu's news line uses the výpis guide's own `nav` and `summary`, not the design's simplified sentence.
- The drawer keeps the design's two actions; "Kontakt" moved to the footer only.
- The search field sits in the section bar on desktop and as a full-width row under the pills on phones (the design's header search button is not built). Search ranks title matches first, max 8 results.
- The home band links `/pruvodce#akce`, `/pruvodce#kdy` and `/pruvodce#novinky`, `#pruvodci`; these anchors are issue 95's (today's hub still has `#typ-akce`, `#co-kdy`, `#zmeny`).

Not verified / left open:

- `src/pages/pruvodce/[slug].astro` (issue 96) still renders its own `CtaBand` and the `up` link; it should drop both, since Base now adds `KitAbout` and breadcrumbs. Removed only the `up` link of `vzory/[slug].astro`.
- Guide and template `seoTitle`s with the year (table E pattern) are content of issues 96/97.
- Checked in headless Chrome at 1440 and 390 px, light and dark (header, mega menu, drawer, section bar, search, footer, home band, Co umí sentence); JavaScript off only through the dist HTML test, not visually.

### 2026-11-20 - one bar, nothing unfolds

The owner's redesign of `WebStruktura` section B ("Jedna lišta, žádné patro navíc") and `WebStrukturaM`: header, section bar, breadcrumbs and news strip were four stacked bars.

Built:

- `Header` is four plain links: Co umí, Průvodce (`/pruvodce`), Vzory (`/vzory`), Weby pro tábory; `/pruvodce*` marks Průvodce, `/vzory*` Vzory. The mega menu, its content (`header.mega`, `header.drawer`, `kitPlaces`) and `megaMenu`/`drawerMenu` are gone.
- `SectionBar` is deleted with `sectionBar` in `site.ts` and the CSS only it and the mega menu used (`section-pill`, `menu-label`, `tag-new`).
- Search: a magnifier button "Hledat v průvodcích a vzorech" before "Přihlásit se", on kit pages only (the design's "Co dělá lupa": on the product it would not make sense). It opens a panel under the header with `SearchForm` (same index, lazy fetch, result links); Escape, a click outside or a followed link close it and return the focus. Hidden without JavaScript. On phones the magnifier stays in the bar and the drawer holds a second field.
- Drawer: the four links as rows, the search (kit pages), then "Vyzkoušet Campie zdarma" and "Přihlásit se". `menu.ts` handles the one `details` left.
- Breadcrumbs: no band, `pt-5 pb-0`, the first quiet line of the top block; over a forest `PageHero` (Co umí, Bezpečnost) they take the forest colour and the hero starts 16px under them (`:has()` rule in `global.css`). Tightened the top padding of the guide page, `/vzory`, `/kontakt` and `/weby-pro-tabory` so the heading follows the crumbs closely.
- SEO: the footer's "Průvodce a vzory" column now lists all 11 guides (`menu`/`nav` names in the order of `hub.guides.groups`) with "Všichni průvodci" and all 4 templates with "Všechny vzory", in two sub-columns (`footerNav` in `nav.ts`). The dist test asserts the four header links and the footer's guide and template links on every page.

Checked in headless Chrome at 1440 and 390 px, light and dark: home, Co umí, Bezpečnost, Kontakt, `/pruvodce`, a guide, `/vzory`, a template, `/weby-pro-tabory`, the search panel with results, the drawer on product and kit pages, the footer.
