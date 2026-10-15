# 03 - Docker Compose local stack

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 02
Stories: 189, 194

## What to build

Provide a Docker Compose file that starts the full stack locally with one command and no cloud accounts: PostgreSQL, RustFS as the S3 server, Redis, Gotenberg, the API and the frontend. The API and frontend run in development mode with source mounted. Seed configuration selects the local adapters (pg driver, AWS SDK against RustFS, log-only mail, fake payment gateway, fixed test key). The platform runs on `*.localhost` so Organisation subdomains work in a browser without editing hosts files. This setup is meant to grow into the self-hosted deployment later, so it uses no development-only images where a production one exists.

## Acceptance criteria

- [ ] `docker compose up` (or one documented pnpm command) brings up all six services with health checks passing
- [ ] The API connects to PostgreSQL, Redis, RustFS and Gotenberg on start and reports their health on a health endpoint
- [ ] The frontend is reachable on `app.localhost` and on `<anything>.localhost`
- [ ] No step requires a cloud account, API key or network access beyond pulling images

## Notes

- Spec sections: Architecture, Ports and adapters
- Port from Domino: `apps/api/Dockerfile` (multi-stage build idea only)
