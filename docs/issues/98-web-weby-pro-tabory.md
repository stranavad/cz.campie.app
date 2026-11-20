# 98 - Website: the page Weby pro tábory with its form

Status: in-progress
Stage: web
Episode: W2 Kit redesign
Blocked by: -
Stories: -

## What to build

The page `/weby-pro-tabory` as the artboard "Weby pro tábory" (`WebyProTabory`) draws it: hero with the form and the old-site/three-proposals drawing, the six steps, what the organiser gets, the price, the fair rules, questions and answers, and the form again. The form takes the address of the current website and an e-mail and sends them to us. The shared rules of issue 94 apply; the header and footer are the site's.

## Decisions

- **Texts and prices are the design's**, moved to `src/content/weby.ts`. The drawing is an illustration component with its demo values inside it, as the site's other drawings.
- **The form** posts to the Worker at `/api/weby`, built like `/api/kontakt`: Zod schema, Turnstile, the rate limit, a mail through Resend to the site's address. The address field accepts "www.tabor-priklad.cz" without a scheme. It is sent in place by a small script, with the designed states: errors at the fields, the send error with the e-mail fallback, and the thanks with the typed e-mail and "Poslat jinou adresu". Without JavaScript it posts as a plain form and lands on a result page, as the contact form does. The page holds the form twice; both work.
- **In the registry of indexed pages**: canonical, sitemap, Open Graph image, Markdown twin, `llms.txt`, breadcrumb "Campie > Weby pro tábory". Title: "Weby pro dětské tábory - tři návrhy zdarma".
- **Structured data**: `Service` with its `Offer`s (the one-off price and the monthly one) and `FAQPage` from the questions.
- **Link to the product**: "Turnusy, ceny a volná místa přímo z Campie" links `/co-umi`. The page does not link the guides.
- Analytics: one event `weby-sent`, no typed value.

## Acceptance criteria

- [ ] The page matches the artboard at 1440 px and 390 px in both themes.
- [ ] The Worker's tests cover the new endpoint: a valid request sends one mail, an invalid address or e-mail is refused, a failed Turnstile check is refused.
- [ ] Each form state can be reached; with JavaScript off the form still sends.
- [ ] The page is in the sitemap and `llms.txt` and has its Open Graph image and Markdown twin.
- [ ] `check-types`, `lint`, `build` and `test` pass; `apps/web/AGENTS.md` lists the page and the endpoint.

## Comments

### 2026-11-20

Built: `src/pages/weby-pro-tabory.astro` with its result pages `weby-pro-tabory/odeslano` and `/chyba`, texts in `src/content/weby.ts`, `src/components/weby/` (the form, twice on the page, and the drawing with its demo values), `src/scripts/weby-form.ts`, the Worker endpoint `POST /api/weby` (`worker/weby.ts`, `weby.schema.ts`, `weby.fields.ts`; it reuses the contact form's Turnstile check, Resend call and rate limit binding under the key `weby:<ip>`), the registry entry `weby` in `seo.ts` (canonical, sitemap, OG image, Markdown twin `src/lib/markdown-weby.ts`, `llms.txt`), JSON-LD `Service` with two `Offer`s and `FAQPage` (`src/lib/jsonld-weby.ts`), the event `weby-sent`, tests in `tests/weby.test.ts`. Dark theme derived from tokens: a new `--mark` token (forest in light, cream in dark) for buttons, step numbers and ticks; the phone layout is a `phone` custom variant (`@container (max-width: 900px)`).

Checked in headless Chrome at 1440 and 390 px, light and dark: default, field errors, send error with the e-mail fallback, thanks with the typed e-mail.

Open: without JavaScript the form posts as a plain form (the address field checked by its `pattern`), but Turnstile needs JavaScript, so the Worker refuses it and the visitor lands on `/weby-pro-tabory/chyba` with the e-mail fallback, as on `/kontakt`; a `noscript` note says so. A truly script-free send would mean accepting posts without Turnstile.
