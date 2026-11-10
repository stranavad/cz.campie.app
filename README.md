# Campie

Camp registration platform for Czech camp organisations: registration forms, payments, consents, documents and health records, hosted for many organisations at once. The interface is in Czech.

## Running locally

Requirements: Docker, Node.js 26 (`.nvmrc`) and pnpm 12. No cloud account or API key is needed.

```sh
pnpm install
pnpm docker:up
```

This starts the whole platform in Docker Compose: PostgreSQL, Redis, RustFS (S3), Gotenberg (PDF), the API and the frontend, the last two in development mode from the mounted source. Open `http://app.localhost` for the main host or `http://<anything>.localhost` for an Organisation's pages; browsers resolve `*.localhost` without hosts file entries. `http://app.localhost/api/health` reports whether the API reaches every service. `pnpm docker:down` stops it all.

The frontend takes port 80. The services are published for tools and for running the apps on the host with `pnpm dev`, on their usual ports prefixed with 1: PostgreSQL 15432, Redis 16379, RustFS 19000 (console 19001), Gotenberg 13000.

The marketing website on `campie.cz` lives in `apps/web` and runs on its own with `pnpm --filter web dev`; it is not part of the Docker Compose stack.

`pnpm build`, `pnpm check-types`, `pnpm lint` and `pnpm test` run the same checks as CI. How the repository is organised and how to work in it: [`AGENTS.md`](AGENTS.md).

## License

[GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only).
