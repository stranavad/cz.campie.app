# 97 - Starter kit: the template page and the configurator as designed

Status: in-progress
Stage: web
Episode: W2 Kit redesign
Blocked by: 94, 96
Stories: -

## What to build

The template page `/vzory/<slug>` and its configurator as the artboard "Vzor s konfigurátorem - Prohlášení o bezinfekčnosti" (`VzorBezinfekcnost`) draws them, for all four templates. The artboard's `stav` values are the states to build: prázdný, rozpracovaný, návrat, víc stran, připravuji PDF, chyba PDF, chyba loga, po stažení, and on phones "mobil: náhled". The shared rules of issue 94 apply.

## Decisions

- **Nothing of the document pipeline changes**: `document.ts`, `pdf.ts`, `preview.ts`, `sheet.ts`, `measure.ts`, the settings schema and the texts of the templates stay. This issue rebuilds the page around them and the configurator's form. A new field in the stored settings is added only where a designed state needs it, with the storage key's version raised.
- **The page reads top to bottom as drawn**: hero with the verification line and the two actions, the configurator beside the A4 preview, what the law says about the document (claim rows of issue 96), why each item is offered, related guides and templates, sources, disclaimer.
- **States**: the page shows the returning organiser that their data were found in this browser ("návrat") and offers to clear them; a document that runs to a second page says so beside the preview ("víc stran") with what would bring it back to one; "připravuji PDF" disables the button and says what happens; "chyba PDF" and "chyba loga" say what went wrong and what to do, in place; "po stažení" shows "A příští rok bez papírů?" with the template's `inCampie` text. A download is never held back by anything.
- **Phones**: the form first, the preview behind a bar fixed to the bottom that opens it ("mobil: náhled").
- **The prescribed form** (posudek) has the same page without the configurator: the preview, the download, and why it cannot be changed.
- **Without JavaScript** the page still shows the preset preview and the blank PDF.
- Analytics stay as they are (`kit-download`, never a typed value).
- **SEO**: the document's own text stays in the HTML of the static preview; the blank PDF is a plain link; `Article` data with `dateModified`; the page links its guide in the text.

## Acceptance criteria

- [ ] The page matches the artboard at 1440 px and 390 px in both themes, for a customisable template and for the form.
- [ ] Each designed state can be reached and looks as drawn; the PDF and the preview still agree on the page count for the preset, with letterhead and logo, and with everything switched on.
- [ ] Settings stored by the earlier version do not break the page.
- [ ] No inline script, no CSP violation, pdfmake not in the page's initial requests.
- [ ] `check-types`, `lint`, `build` and `test` pass; `apps/web/AGENTS.md` is current.

## Comments

### 2026-11-20

Built. `/vzory/<slug>` reads as the artboard: verification line, `h1`, lead, the rule the hero answers with (new `explain.answer` in the template model, a pointer to a Fact of a guide section or of the template's own; no text changed) and the two ways to the document (blank PDF with "PDF · 1 strana · 12 kB" from the build's own PDF, and "Upravit na svůj tábor", hidden without JavaScript; the posudek shows "Proč ho nejde upravit" in its place). The configurator beside the A4 preview from `xl` (form, then a 680 px preview column so the sheet stays above the 640 px reflow threshold of `sheetCss()`), then on a card band: what the law says (`Claims`), "Co který bod dělá", disclaimer, and beside them related guides and templates as small cards and the sources. No CtaBand. The form is three numbered cards over a sticky forest download bar; items are switches in "V dokumentu" / "Můžete přidat" with their why in the mark style of issue 96, an inline editor ("Upraveno", "Vrátit původní znění"), own items with kind as pressed buttons. Texts in `documentLabels` (`paths`, `formWhy`, `configurator.*`), icons in `src/content/icons.ts`.

States, each reached in headless Chrome against `dist/` served with the `_headers` CSP, at 1440 and 390 px, light and dark: prázdný; rozpracovaný (letterhead and an edited item reach the preview, the item card is marked); návrat (stored organiser found: "Vítejte zpět", keep or clear); víc stran (all items on, letterhead, logo and two long own items: 2 pages, the note beside the preview, downloaded PDF also 2 pages; the preset with letterhead and logo stays 1 = 1); připravuji PDF (PDF chunk held back via CDP Fetch: button disabled with a spinner, what is loading); chyba PDF (chunk blocked: the error, "Zkusit znovu" and the blank PDF link); chyba loga (an SVG: "Soubor logo.svg nejde použít..."); po stažení (file name, "A příští rok bez papírů?" with `inCampie`, scrolled into view); mobil: náhled (sticky "Upravit / Náhled · N strany" switch and a "Náhled" button above the download bar). Settings stored by issue 88's version load unchanged (same key and schema; nothing added to `settings.ts`), a value that no longer parses is dropped. Without JavaScript: preset preview full width, blank PDF, no configurator, no broken controls. No CSP violation, no console error, pdfmake not among the page's requests. check-types, lint, build and test pass.

Deviations from the design: the "návrat" banner does not name the template the data were last used on (that needs a new stored field; left out); own items have no switch (switching one off would delete what was typed), they have "Odebrat"; clicking an item in the preview does not open it in the form (`preview.ts` unchanged). Open: a borderline document can show 2 pages in the preview while the PDF fits on 1 (the 1.5% safety margin of `measure.ts`, by design); on phones the more-pages note is in the preview tab, the form shows the count in the tab and the download bar.
