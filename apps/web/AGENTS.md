# Web

The marketing website on the bare domain `campie.cz`: four pages (`/`, `/co-umi`, `/bezpecnost`, `/kontakt`), built as static HTML by Astro, plus one small Cloudflare Worker that answers the contact form at `/api/kontakt`. It is outside the platform: no Organisation data, no session, no call to `apps/api`. Signup, login and the legal pages are the platform's (`app.campie.cz`), linked, never copied.

## Scripts

In `apps/web`, or from the root `pnpm --filter web <script>`.

| Script                   | Purpose                                                                           |
| ------------------------ | --------------------------------------------------------------------------------- |
| `pnpm dev`               | Astro dev server on `http://localhost:4321` (no Worker: the form cannot send)     |
| `pnpm build`             | static build into `dist/`, then a dry run of the Worker bundle                    |
| `pnpm preview`           | `wrangler dev`: the last build and the Worker together, as Cloudflare serves them |
| `pnpm check-types`       | TypeScript                                                                        |
| `pnpm lint`              | Oxlint, type-aware, warnings fail                                                 |
| `pnpm test`              | Vitest: the Worker, the pure modules and assertions over `dist/` (build first)    |
| `pnpm deploy:production` | builds with `SITE_ENV=production` and deploys `campie.cz`                         |
| `pnpm deploy:dev`        | builds with `SITE_ENV=dev` and deploys the preview on `dev.campie.cz`             |

`SITE_ENV` decides indexing and links: `production` is indexable and links `app.campie.cz`; `dev` and unset (local) send `noindex` everywhere and link `app.staging.campie.cz`. Canonical URLs always name `https://campie.cz`. Local builds use Turnstile's test key; `pnpm preview` needs `.dev.vars` (copy `.dev.vars.example`).

## Stack

| Area    | Tech                                                                                        |
| ------- | ------------------------------------------------------------------------------------------- |
| Pages   | Astro 7, static output, no adapter, no client framework                                     |
| Styling | Tailwind CSS 4, theme tokens in `src/styles/global.css`, dark theme from the system setting |
| Fonts   | Fontsource files, `@font-face` by hand in `src/styles/fonts.css`, latin and latin-ext only  |
| Worker  | `worker/`: plain `fetch` handler, Zod, Turnstile, Resend over HTTP, a rate limit binding    |
| Images  | Open Graph cards and icons rendered at build time with Satori and sharp (`src/lib/og.ts`)   |
| Hosting | Cloudflare Workers with static assets (`wrangler.jsonc`)                                    |

## Where things live

- `src/content/*.ts`: every text and link, page by page in section order, plus `seo.ts` (titles, descriptions, Open Graph). Texts may use `**bold**`, `` `code` `` and `[text](href)`; `src/lib/inline.ts` renders them. A platform link is written `app:/path`.
- `src/components/`: templates. `home/` the home page's sections, `illustrations/` the small drawings, `screens/` the four platform screens drawn in HTML. Demo values (names, prices, dates) live in these components, not in content.
- `src/lib/`: the logic, all typed: links, JSON-LD, the Markdown twins and `llms.txt`, `_headers`, `robots.txt`, images.
- `src/pages/`: thin pages and the generated files (`robots.txt`, `llms.txt`, `llms-full.txt`, `/<page>.md`, `/og/<page>.png`, icons).
- `src/scripts/`: the only client JavaScript: closing the mobile menu, and sending the contact form in place.

## What we deliberately do not do

- **No logic in `.astro` files.** `astro check` needs TypeScript 5 or 6 (ADR-0003 uses 7), so `.astro` frontmatter is not type checked. Templates import content and map over it; anything that computes lives in a `.ts` module.
- **No inline scripts and no `style=` attributes.** The Content-Security-Policy allows only this site's script files, the speculation rules and Turnstile. JSON-LD is a data block.
- **No client framework, no analytics, no third party** except Turnstile on `/kontakt`.
- **No raw colours in components.** Only the tokens of `global.css`, which carry both themes.
- **No text outside `src/content/`**, apart from demo values in illustrations. Hyphen "-", never an em-dash.
- **No screenshots of the platform.** The screens are HTML, so they follow the theme and stay sharp.

## Cloudflare setup (manual, once)

Nothing here is automated; the repository holds no Cloudflare credentials.

1. DNS: the `campie.cz` zone on Cloudflare. The Worker's custom domains (`campie.cz`, `dev.campie.cz`) create their records on the first deploy. A Redirect Rule sends `www.campie.cz` to `https://campie.cz`. The platform's records (`app`, `*`, `staging`, `*.staging`) keep pointing at the server.
2. Workers Builds (or a manual `pnpm deploy:*`): two projects, `campie-web` on branch `main` with deploy command `pnpm run deploy:production` and `campie-web-dev` on branch `dev` with `pnpm run deploy:dev`, build command `pnpm install --frozen-lockfile --filter web...` (the deploy scripts build with the right `SITE_ENV`; Cloudflare's default `wrangler deploy` would ship a noindex build). Root directory `apps/web`, build variables `NODE_VERSION` (26) and `PNPM_VERSION` (from `packageManager`), watch paths `apps/web/*` and `pnpm-lock.yaml`, non-production branch builds off.
3. Turnstile: a widget for `campie.cz` and `dev.campie.cz`; its site key replaces the placeholder in `src/content/site.ts`, its secret goes in with `wrangler secret put TURNSTILE_SECRET_KEY` (and `--env dev`).
4. Resend: a sending key for `posta.campie.cz`, set with `wrangler secret put RESEND_API_KEY` per environment.
5. Zone settings off: Block AI bots, Managed robots.txt, Rocket Loader, Email Address Obfuscation (each rewrites what this site serves).
6. After the first production deploy: submit `https://campie.cz/sitemap-index.xml` to Google Search Console, Bing Webmaster Tools and Seznam Webmaster.
