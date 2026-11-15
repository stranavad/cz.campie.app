# Plan 005: The frontend is served with a Content-Security-Policy

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report - do not improvise. When done, update the status row for this plan
> in `plans/README.md` - unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a44a934..HEAD -- docker/caddy/Caddyfile apps/app/index.html`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (an over-strict policy breaks the app in production; hence the report-only first stage)
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `a44a934`, 2026-11-11

## Why this matters

The platform holds children's health data and rodná čísla. `docs/adr/0001-cookie-sessions-behind-same-origin-proxy.md` chose httpOnly cookies "because ... token theft through XSS is the main risk". Cookies stop token theft, but a script injected into the page can still call the API as the signed-in admin or guardian. The deployed frontend sends HSTS, `nosniff`, `X-Frame-Options` and a referrer policy, but no Content-Security-Policy, so nothing limits what an injected script may load or where it may send data. A policy that allows only same-origin scripts closes that gap at the edge with no application change.

This plan ships the policy in two stages: first as `Content-Security-Policy-Report-Only` (cannot break anything), then, after a human has checked the browser console on staging, as the enforcing header.

## Current state

- `docker/caddy/Caddyfile` - the deployed frontend: Caddy serves the built app and proxies `/api`. Its site-wide headers:

  ```
  # docker/caddy/Caddyfile:17-24
  :80 {
  	header {
  		Strict-Transport-Security "max-age=31536000"
  		X-Content-Type-Options nosniff
  		X-Frame-Options SAMEORIGIN
  		Referrer-Policy strict-origin-when-cross-origin
  		-Server
  	}
  ```

  and the handler that serves the app's HTML:

  ```
  # docker/caddy/Caddyfile:51-58
  # Every other path is the app's: the router decides by host and path. Asked for again on every load,
  # so a deployment reaches the browser at once.
  handle {
  	root * /srv
  	header Cache-Control "no-cache"
  	encode zstd gzip
  	try_files {path} /index.html
  	file_server
  }
  ```

- `apps/app/index.html:8-22` - one inline, non-module `<script>` that applies the dark theme before first paint. It is the only inline script; the app itself is `<script type="module" src="/src/main.tsx">`, built to `/assets/*.js`.
- `Dockerfile:79-83` - the `app` image is `caddy:2.11.9-alpine` with this Caddyfile and `apps/app/dist` at `/srv`.
- The local stack (`compose.yaml`, service `app`) runs the Vite dev server, NOT Caddy. The policy therefore never applies locally; it can only be observed in the built image or on staging.

What the app loads, established by reading `apps/app/src` (the policy must allow exactly this):

| Resource                                                                                                                  | Where                                                                              | Directive needed                                   |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| Scripts: built bundles under `/assets/`                                                                                   | `index.html`                                                                       | `script-src 'self'`                                |
| The inline theme script                                                                                                   | `apps/app/index.html:8-22`                                                         | its SHA-256 hash in `script-src`                   |
| Styles: built CSS, plus style elements and attributes set by UI libraries; the email preview's HTML carries inline styles | `src/index.css`, `features/camps/components/email-texts-section/email-preview.tsx` | `style-src 'self' 'unsafe-inline'`                 |
| Fonts: self-hosted (`@fontsource-variable/*`)                                                                             | `src/index.css:2-3`                                                                | `font-src 'self'`                                  |
| Images: logos and Camp photos from `/api/logos/...`, `/api/camp-photos/...`; QR codes as `data:` URLs                     | `src/components/qr-code.tsx` (`QRCode.toDataURL`)                                  | `img-src 'self' data:`                             |
| API calls: same-origin `/api` only                                                                                        | `src/lib/api/`                                                                     | `connect-src 'self'`                               |
| One sandboxed `<iframe srcDoc>` for the email preview                                                                     | `email-preview.tsx:16-21`                                                          | covered by `default-src 'self'`; verify in stage 2 |
| Card payments: a top-level navigation to Comgate                                                                          | `features/registration`, `features/portal`                                         | none (CSP does not restrict navigations)           |

Conventions that apply:

- Comments in the Caddyfile explain why, in the file's existing voice. Hyphen "-", never an em-dash.
- No new documentation files. No secrets in the repository.

## Commands you will need

| Purpose                   | Command                                                                                                                                                                                                                       | Expected on success                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Build the frontend        | `pnpm --filter app build`                                                                                                                                                                                                     | exit 0, writes `apps/app/dist/` (git-ignored) |
| Hash of the inline script | `node -e "const h=require('fs').readFileSync('apps/app/dist/index.html','utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);console.log('sha256-'+require('crypto').createHash('sha256').update(m[1]).digest('base64'))"` | prints `sha256-...`                           |
| Validate the Caddyfile    | `docker run --rm -e EDGE_SECRET=x -e PROXY_SECRET=x -e API_UPSTREAM=localhost:3000 -v "$PWD/docker/caddy/Caddyfile:/etc/caddy/Caddyfile:ro" caddy:2.11.9-alpine caddy validate --config /etc/caddy/Caddyfile`                 | `Valid configuration`                         |
| Build the image           | `docker build --target app -t campie-app-csp .`                                                                                                                                                                               | exit 0                                        |
| Format check              | `pnpm format:check`                                                                                                                                                                                                           | exit 0                                        |

## Scope

**In scope**:

- `docker/caddy/Caddyfile`
- `apps/app/index.html` (a comment only, see step 2)

**Out of scope**:

- The API (`apps/api`): its JSON responses are not documents; `core/files/public-image.ts` already sets its own policy for images.
- `apps/web` (the marketing site on Cloudflare).
- Removing `'unsafe-inline'` from `style-src`. Styles cannot run code; tightening it needs nonces through the UI libraries and is not worth it now.
- Moving the theme script to a file: it would add a render-blocking request on every load.
- Adding a CSP report endpoint.

## Git workflow

- Branch: `feat/content-security-policy`
- Conventional Commits, lowercase imperative subject, at most 72 characters, no body, no AI attribution.
- Two commits: `feat: report content security policy violations of the app` (stage 1), later `feat: enforce the app's content security policy` (stage 2).
- Do NOT push or open a PR unless instructed. Never `--no-verify`.

## Steps

### Step 1: Compute the inline script's hash

Run the build command, then the hash command from the table. Keep the printed `sha256-...` value.

**Verify**: the command prints one line starting with `sha256-` and 44 base64 characters.

### Step 2: Add the policy, report-only

In `docker/caddy/Caddyfile`, inside the last `handle { ... }` block (the one with `try_files {path} /index.html`), add after the `Cache-Control` line, with `<HASH>` replaced by the value from step 1:

```
		# Only this origin's scripts run, and the one inline script of index.html (the theme, before the
		# first paint) by its hash: a changed script needs a new hash here, or the theme flashes. Styles
		# may be inline, since UI libraries and the email preview set them and a style runs no code.
		# QR codes are drawn as data: images.
		header Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self' '<HASH>'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"
```

The header goes in this block only, so it rides on the HTML document (which is what a browser's policy comes from) and not on `/api` or `/assets` responses.

In `apps/app/index.html`, extend the comment inside the inline script by one line:

```js
// Its hash is in the Content-Security-Policy of docker/caddy/Caddyfile: change both together.
```

Adding this comment changes the script's bytes, so re-run step 1 AFTER this edit and put the new hash in the Caddyfile.

**Verify**: the Caddy validate command -> `Valid configuration`. Then:

```
docker build --target app -t campie-app-csp . && \
docker run --rm -d --name campie-app-csp -p 127.0.0.1:8089:80 -e EDGE_SECRET=x -e PROXY_SECRET=x -e API_UPSTREAM=localhost:3000 campie-app-csp && \
sleep 1 && curl -sI http://127.0.0.1:8089/ | grep -i content-security-policy-report-only ; \
curl -s http://127.0.0.1:8089/ | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const m=s.match(/<script>([\s\S]*?)<\/script>/);console.log('sha256-'+require('crypto').createHash('sha256').update(m[1]).digest('base64'))})" ; \
docker stop campie-app-csp
```

Expected: the header line is printed, and the hash printed from the served HTML equals the hash inside the header. Also `curl -sI http://127.0.0.1:8089/assets/` style requests must NOT carry the header (optional check).

### Step 3: Gates and first commit

**Verify**: `pnpm format:check` -> exit 0; `git status` shows only the two in-scope files. Commit stage 1.

### Step 4 (HUMAN GATE): Check staging, then enforce

This step needs a person with a browser on the staging deployment. If you are an automated executor, STOP here, mark the plan `BLOCKED (awaiting staging check of report-only policy)` in `plans/README.md` and report.

The human opens the browser console on staging and walks: the main host (login, Přihlášky, a Registration detail, Tábory with the form builder and the email preview, organisation settings with the accent picker and logo upload, account settings with the TOTP QR code) and an Organisation subdomain (landing, a Camp page, the whole registration form through to the payment details with the QR platba, the portal with a document upload). Any console line starting with `[Report Only]` is a violation to resolve: either the policy needs one more source (add it with a comment saying what needs it) or the app does something it should not.

When the console is clean, change `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in the Caddyfile and commit stage 2.

**Verify**: Caddy validate -> `Valid configuration`; `grep -c "Report-Only" docker/caddy/Caddyfile` -> `0`.

## Test plan

- The image check in step 2 proves the header is served and the hash matches the served script.
- The staging walk in step 4 is the functional test. There is no automated browser test in this repository by design.

## Done criteria

- [ ] Caddy validate prints `Valid configuration`
- [ ] `docker build --target app .` exits 0
- [ ] `grep -n "Content-Security-Policy" docker/caddy/Caddyfile` shows the header once, inside the final `handle` block
- [ ] The hash in the header equals the hash computed from `apps/app/dist/index.html` after a fresh `pnpm --filter app build`
- [ ] Stage 2 only: no `Report-Only` left in the Caddyfile, after the human gate
- [ ] `git status` shows only `docker/caddy/Caddyfile` and `apps/app/index.html` modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The built `apps/app/dist/index.html` contains more than one inline `<script>` without `src`, or the inline script differs from the source's in a way that changes between builds (the hash would not be stable).
- Caddy rejects the header line and the fix is not a quoting mistake.
- The staging walk shows violations from a third-party origin nobody can explain: report them, do not allow-list them.
- You are asked to enforce (stage 2) without the human check having happened.

## Maintenance notes

- The hash couples `apps/app/index.html` to the Caddyfile. A reviewer of any change to the inline script must see the Caddyfile change in the same diff. If this bites once, add a CI step after `pnpm build` that recomputes the hash and greps the Caddyfile for it.
- Anything new the app loads from another origin (an analytics script, a map, a font CDN, an embedded video) needs a deliberate policy change here.
- `Strict-Transport-Security` has no `includeSubDomains`; every Organisation subdomain gets the header on its own first visit. Adding it is a separate decision because it binds every subdomain of the platform domain.
