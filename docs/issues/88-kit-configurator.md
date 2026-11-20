# 88 - Starter kit: configurator

Status: in-progress
Stage: web
Episode: W1 Starter kit
Blocked by: 87
Stories: -

## What to build

On the page of a customisable template, the organiser makes the document theirs: logo and legal identity, the camp and its dates, which items the document holds, the wording of each item, and items of their own. The preview follows every change and "Stáhnout PDF" gives the document. Nothing is sent anywhere.

## Decisions

- **Preact, on these pages only.** The configurator is a form with lists that grow, shrink and reorder, which is what a component framework is for. It is mounted by hand from a script module (`render` into a placeholder), not through an Astro island: an island's hydration runs inline scripts, which the Content-Security-Policy forbids. No other page of the website loads it. `apps/web/AGENTS.md` records the exception to "no client framework".
- **The page works without it.** Without JavaScript the page still shows the preset preview and the blank PDF; the configurator's place is empty.
- **Settings.** `KitSettings` (organiser: name, IČO, address, e-mail, phone, logo; camp: name, term, place) are shared by all templates. Per template: which items are on, edited titles and texts, the organiser's own items (title, text, choice or statement).
- **Kept in the browser.** `localStorage` under one versioned key; a stored value that does not parse against the current schema (Zod) is dropped, not migrated. A "Vrátit výchozí nastavení" action clears the template's part. The page states that nothing leaves the browser.
- **Logo.** PNG or JPEG chosen from disk, downscaled in the browser to at most 600 px on the longer side, kept as a data URL. No SVG (a PDF library would need a rasteriser and SVG can carry script).
- **Fixed parts stay fixed.** The blocks in a template's `before` and `after` cannot be switched off or reworded; the configurator says why (`documentLabels.configurator.fixedNote`). That is what keeps a customised bezinfekčnost a bezinfekčnost.
- **Every item shows its `why`**: the basis badge and the citations, as on the guide pages. An organiser who switches an item on knows what it rests on.
- **Letterhead.** Printed when the organiser's name is filled in: logo, name, address, IČO, contacts. The camp's data go through the `event` block as "label: value" lines, never into a sentence.
- **The credit line** ("Vzor: campie.cz/vzory, ...") is on by default in the footer of a customised PDF and can be switched off.
- **After a download** the page shows the template's `inCampie` text and the signup link. Downloads are never gated.
- **Analytics.** One Umami event `kit-download` with the template's slug and `blank` or `custom`. Never any typed value.

## Acceptance criteria

- [ ] Filling in the organiser and the camp changes the preview at once and the downloaded PDF accordingly; the logo appears in both.
- [ ] Switching an item off removes it from the preview and the PDF; editing its text changes both; an added item appears in both and can be removed.
- [ ] Settings survive a reload and are shared between templates; the reset action returns the preset.
- [ ] A fixed block cannot be removed or edited.
- [ ] The page makes no network request with typed data (check the network panel while typing and downloading).
- [ ] With JavaScript off: preview and blank PDF are there, no broken controls are shown.
- [ ] The configurator is usable at phone width and with the keyboard alone; every control has a label.
- [ ] The built pages run no inline script and pass under the site's Content-Security-Policy (checked with `pnpm preview`, which serves the `_headers`).
- [ ] `check-types`, `lint`, `build` and `test` pass.

## Notes

- Labels: `documentLabels.configurator` in `src/content/kit/documents/index.ts`. Add what is missing there.
- No unit tests for the components. The pure functions (settings schema, building the block list from template and settings) may get a test where one proves a real behaviour.

## Comments

2026-11-19 - Framework decided with the owner: a framework is welcome where it makes the configurator simpler, as long as the rest of the website stays as fast as it is. Preact mounted by hand keeps both.

2026-11-19 - Implemented as a local proof of concept (not committed).

- **Preact 11.2.0** (latest), mounted by hand: `src/scripts/configurator.tsx` renders `src/components/kit/ConfiguratorForm.tsx` into the hidden `[data-configurator]` place of `Configurator.astro`, which only customisable templates render. JSX via `tsconfig.json` (`jsx: react-jsx`, `jsxImportSource: preact`); Vite 8 picked it up with no further config. No `@astrojs/preact`.
- Settings: `src/lib/kit/settings.ts`, key `campie-vzory-v1`, validated with `zod/mini` (the full Zod would have doubled the bundle); what does not parse is dropped. State updates are functional, so two changes in one event never undo each other.
- Logo: PNG or JPEG chosen, downscaled to at most 600 px, stored as a **JPEG** data URL on a white ground (see issue 87: a PNG would make pdfmake start a blocked worker). The schema accepts only a JPEG data URL.
- Custom items: title, text and kind (choice or statement); they follow the template's items. Reordering is not implemented.
- Bundle: the configurator script 88 kB, 30 kB gzip, plus a 3.8 kB gzip chunk it shares with the contact form; the PDF chunk loads only on download.
- Verified in headless Chrome against `dist/` served with the CSP header: typing organiser and camp, toggling items on and off, editing a text, adding and removing an own item, uploading a logo (1200x800 PNG stored as 600x400) all reach the preview; the downloaded PDF holds the letterhead with the logo, the camp lines, the edited text and the own item; settings survive a reload and appear on another template's page, which keeps its own items; reset returns the preset and keeps the organiser; every request went to the site itself and none carried a typed value; no CSP violation and no console error; with JavaScript off the configurator and its link stay hidden and the preset preview shows; no horizontal overflow at 390 px in both themes.
- Not verified: keyboard-only use was not driven key by key (all controls are native inputs, checkboxes, `summary` and buttons, each with a label); a screen reader; `pnpm preview`; Safari and Firefox (the print rules use `:has()`).
