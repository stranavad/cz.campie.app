# syntax=docker/dockerfile:1
# Images for the API and the app. `dev` is the local stack's: Docker Compose mounts the source instead of
# copying it. `api`, `migrate` and `app` are the deployed ones (deploy/compose.yaml).

# Node and the pnpm the repository pins.
FROM node:26.12.0-slim AS node

COPY package.json /tmp/package.json
RUN npm install --global "$(node -p "require('/tmp/package.json').packageManager")" && rm /tmp/package.json

WORKDIR /repo

FROM node AS dev

# The manifests alone, so dependencies install again only when they change. No install script is needed
# (pnpm-workspace.yaml allows none to build) and husky has no repository here.
FROM node AS manifests

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/app/package.json apps/app/
COPY apps/web/package.json apps/web/
COPY packages/schema/package.json packages/schema/
COPY packages/oxlint-config/package.json packages/oxlint-config/

# Every workspace's dependencies, development ones included, for building.
FROM manifests AS deps

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --store-dir /pnpm/store

# Only what the API runs with: its production dependencies and the schema's.
FROM manifests AS api-deps

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --prod --filter "api..." --store-dir /pnpm/store

FROM deps AS api-build

COPY packages/schema packages/schema
COPY apps/api apps/api
RUN pnpm --filter "api..." run build

# Applies the migrations as the role that owns the tables (MIGRATION_DATABASE_URL), with drizzle-kit, before
# the API starts. The operator command line runs here too: `pnpm operator grant <email>`.
FROM api-build AS migrate

# The dependencies are installed and the store they came from was a build cache: pnpm must not try again.
ENV pnpm_config_verify_deps_before_run=false
WORKDIR /repo/apps/api
USER node
CMD ["pnpm", "db:migrate"]

FROM node:26.12.0-slim AS api

ENV NODE_ENV=production
WORKDIR /repo
COPY --from=api-deps /repo ./
COPY --from=api-build /repo/packages/schema/dist packages/schema/dist
COPY --from=api-build /repo/apps/api/dist apps/api/dist

WORKDIR /repo/apps/api
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]

# The frontend's settings are baked in at build time; staging builds with its own domain.
FROM deps AS app-build

ARG VITE_PLATFORM_DOMAIN=campie.cz
ARG VITE_PRODUCT_NAME=Campie
COPY packages/schema packages/schema
# The type check covers the app's lint config, which imports the shared rule groups.
COPY packages/oxlint-config packages/oxlint-config
COPY apps/app apps/app
RUN pnpm --filter "app..." run build

# Serves the built frontend for the main host and every Organisation subdomain, and proxies /api to the API.
FROM caddy:2.11.9-alpine AS app

COPY docker/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=app-build /repo/apps/app/dist /srv
EXPOSE 80
