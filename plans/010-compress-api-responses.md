# Plan 010: JSON from the API reaches the browser compressed

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report - do not improvise. When done, update the status row for this plan
> in `plans/README.md` - unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a44a934..HEAD -- docker/caddy/Caddyfile`
> If the file changed since this plan was written, compare the "Current state"
> excerpt against the live file before proceeding. Plan 005 adds a header line
> to the last `handle` block; that alone is fine.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `a44a934`, 2026-11-11

## Why this matters

The deployed frontend's Caddy compresses the static files it serves but passes `/api` responses through as they are, and the API (NestJS) has no compression of its own. The admin's participant list returns every Participant of a Turnus in one JSON response (a few hundred rows, fetched twice per page view: filtered and unfiltered), and the public form fetches its whole definition; guardians mostly do this on phones. JSON of this kind compresses to roughly a fifth. One line in the proxy fixes it for every endpoint.

## Current state

- `docker/caddy/Caddyfile` - the `/api` handler has no `encode`:

  ```
  # docker/caddy/Caddyfile:26-40
  handle /api/* {
  	# Traefik sets the edge secret on every request it routes here, replacing whatever the client sent. A
  	# request without it bypassed Traefik, from another container on the shared network, with an
  	# X-Forwarded-For of its choosing.
  	@notFromEdge not header X-Edge-Secret {$EDGE_SECRET}
  	respond @notFromEdge 403

  	# The API under its deployment's own name: this container also sits on Dokploy's shared network,
  	# where another project's service could be called plain `api`.
  	reverse_proxy {$API_UPSTREAM} {
  		# Replaces whatever the client sent under this name; the API refuses any request without it.
  		header_up X-Proxy-Secret {env.PROXY_SECRET}
  		header_up -X-Edge-Secret
  	}
  }
  ```

  while both static handlers have `encode zstd gzip` (lines 46 and 55).

- `apps/api/src/app.setup.ts` - the API's whole HTTP setup; no compression middleware, and none is wanted there (the proxy is the right layer).
- What else `/api` serves besides JSON: file downloads (`/api/downloads/<token>`: PDF, JPG, PNG, WebP, streamed with a `Content-Length`), logos and Camp photos. These are already compressed formats and must pass through untouched.
- The local stack (`compose.yaml`, service `app`) runs the Vite dev server, not Caddy, so this change is only observable in the built image or on staging.

Conventions: comments in the Caddyfile say why, in the file's voice; hyphen "-", never an em-dash.

## Commands you will need

| Purpose         | Command                                                                                                                                                                                                       | Expected on success   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Validate        | `docker run --rm -e EDGE_SECRET=x -e PROXY_SECRET=x -e API_UPSTREAM=localhost:3000 -v "$PWD/docker/caddy/Caddyfile:/etc/caddy/Caddyfile:ro" caddy:2.11.9-alpine caddy validate --config /etc/caddy/Caddyfile` | `Valid configuration` |
| Build the image | `docker build --target app -t campie-app-encode .`                                                                                                                                                            | exit 0                |

## Scope

**In scope**: `docker/caddy/Caddyfile`

**Out of scope**:

- `apps/api` (no compression middleware in NestJS).
- Pagination of the participant list: it is built and searched in memory by design, because encrypted columns are never filtered in the database.
- The static handlers.

## Git workflow

- Branch: `perf/compress-api-responses`
- Conventional Commits, lowercase imperative subject, at most 72 characters, no body, no AI attribution.
- Suggested subject: `perf: compress the API's JSON at the proxy`
- Do NOT push or open a PR unless instructed. Never `--no-verify`.

## Steps

### Step 1: Encode JSON on `/api`

In the `handle /api/*` block, after the `respond @notFromEdge 403` line and before the `reverse_proxy` comment, add:

```
		# Lists and form definitions are JSON that shrinks to a fraction; downloads and images are
		# compressed formats already and pass through as they are.
		encode {
			zstd
			gzip
			match {
				header Content-Type application/json*
			}
		}
```

**Verify**: the validate command -> `Valid configuration`.

### Step 2: Prove it against a stand-in upstream

Build the image and run it in front of a tiny JSON server (the container shares the host's network so `localhost:9911` is the stand-in):

```
docker build --target app -t campie-app-encode . && \
node -e "require('http').createServer((q,s)=>{const pdf=q.url.includes('pdf');s.setHeader('Content-Type',pdf?'application/pdf':'application/json');s.end(pdf?Buffer.alloc(5000,1):JSON.stringify({rows:Array(500).fill({name:'Jan Testovaci',status:'paid'})}))}).listen(9911)" & \
SERVER=$! ; sleep 1 ; \
docker run --rm -d --name campie-app-encode --network host -e EDGE_SECRET=x -e PROXY_SECRET=x -e API_UPSTREAM=localhost:9911 campie-app-encode ; sleep 1 ; \
curl -s -o /dev/null -D - -H "X-Edge-Secret: x" -H "Accept-Encoding: gzip" http://127.0.0.1:80/api/list | grep -i "content-encoding" ; \
curl -s -o /dev/null -D - -H "X-Edge-Secret: x" -H "Accept-Encoding: gzip" http://127.0.0.1:80/api/pdf | grep -ci "content-encoding" ; \
docker stop campie-app-encode ; kill $SERVER
```

Expected: the first `curl` prints `Content-Encoding: gzip`; the second prints `0` (the PDF is not encoded). If port 80 is taken on your machine (the local stack publishes it), stop the local stack first with `pnpm docker:down`, or STOP and report rather than editing the Caddyfile's port.

**Verify**: both expectations above hold.

## Test plan

The check in step 2 is the test. On staging afterwards, a human can confirm in the browser's network tab that the participant list response carries `content-encoding` and that a document download still opens.

## Done criteria

- [ ] Validate prints `Valid configuration`
- [ ] `docker build --target app .` exits 0
- [ ] Step 2: JSON is encoded, the PDF is not
- [ ] `git status` shows only `docker/caddy/Caddyfile` modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- Caddy 2.11.9 rejects the `match` block inside `encode` and the fix is not a syntax slip.
- The JSON response is not encoded although validation passes (the API may answer with a `Content-Type` that needs a different matcher; report the header you saw).
- Port 80 cannot be freed for the check.

## Maintenance notes

- Compression plus secrets in a response body that also reflects attacker-chosen input is the BREACH pattern. The API's sessions live in httpOnly cookies, not in bodies, and CSRF is a custom header, so nothing secret and reflected shares a response today. Keep it that way: do not put long-lived secrets into JSON bodies that also echo request input.
- If server-sent events or other streaming JSON is ever added under `/api`, exclude it from `encode` or it will be buffered.
