# 03 - Docker Compose local stack

Status: done
Stage: 1a
Episode: E0 Foundation
Blocked by: 02
Stories: 189, 194

## What to build

Provide a Docker Compose file that starts the full stack locally with one command and no cloud accounts: PostgreSQL, RustFS as the S3 server, Redis, Gotenberg, the API and the frontend. The API and frontend run in development mode with source mounted. Seed configuration selects the local adapters (pg driver, AWS SDK against RustFS, log-only mail, fake payment gateway, fixed test key). The platform runs on `*.localhost` so Organisation subdomains work in a browser without editing hosts files. This setup is meant to grow into the self-hosted deployment later, so it uses no development-only images where a production one exists.

## Acceptance criteria

- [x] `docker compose up` (or one documented pnpm command) brings up all six services with health checks passing
- [x] The API connects to PostgreSQL, Redis, RustFS and Gotenberg on start and reports their health on a health endpoint
- [x] The frontend is reachable on `app.localhost` and on `<anything>.localhost`
- [x] No step requires a cloud account, API key or network access beyond pulling images

## Notes

- Spec sections: Architecture, Ports and adapters
- Port from Domino: `apps/api/Dockerfile` (multi-stage build idea only)

## Comments

2026-10-16 - Stack committed. Verified locally on Docker Engine 29.1.3 (Compose 5.0):

- `pnpm docker:up` (`docker compose up --detach --build --wait`) brings up PostgreSQL 18.6, Redis 8.8.3, RustFS 1.0.1, Gotenberg 8.38.1, the API and the app, all healthy, from wiped volumes in under 10 s plus image pulls. Two one-shot helpers run first: `deps` (`pnpm install` and the schema build into volumes, so Linux packages never mix with the host's) and `storage-init` (creates the `campie` bucket with RustFS's own curl; creating it again succeeds).
- `GET /api/health` probes PostgreSQL (`SELECT 1`), Redis (`PING`), RustFS (`HeadBucket` on the configured bucket) and Gotenberg (`/health`), each within 2 s, and answers 200 or 503 with `up`/`down` per service. The API container is healthy only when it answers 200, so `--wait` succeeds only once the API reaches all four; that is how "connects on start" is met. Stopping Redis turned it into 503 with `redis: down` and a log line, and back on restart.
- `http://app.localhost`, `http://tabor-test.localhost` and `http://app.localhost/api/health` (through the Vite `/api` proxy, Host header kept) answered 200. The app takes port 80; the services are published on their port prefixed with 1 (15432, 16379, 19000/19001, 13000), because this machine already had other projects on 9000 and 3001.
- The integration test covers the all-down 503 path; the all-up path is covered by the Compose health check until the issue 08 harness brings test services.
- Network: no cloud account or API key anywhere. Besides image pulls, the stack downloads npm packages (`pnpm install` in `deps`, pnpm itself in the dev image), as any checkout needs; with the volumes in place a restart installs nothing.
- Stopgaps for later issues, deliberately minimal: the env schema and `AppConfigModule` hold only the service addresses (issue 06 adds adapter selection; no adapters exist yet to seed, so mail, payment gateway and key provider choices are not in the env); the health probes open their own `pg`, `ioredis` and S3 clients in `core/health` and should move behind the database (07), file storage and PDF renderer (06) and queue (11) adapters once those exist; the Dockerfile has only the `dev` stage, the production stages come with the self-hosted deployment.
