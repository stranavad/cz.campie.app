# Development image for the API and the app: Node and the pnpm the repository pins. Docker Compose
# mounts the source instead of copying it.
FROM node:26.12.0-slim AS dev

COPY package.json /tmp/package.json
RUN npm install --global "$(node -p "require('/tmp/package.json').packageManager")" && rm /tmp/package.json

WORKDIR /repo
