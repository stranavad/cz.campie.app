# Shared endpoint contracts that also shape every response

Every API route is defined once in `packages/schema` with `defineEndpoint` (method, path, params, query, body, response, status). The API routes by it (`@Endpoint`), validates input with NestJS 12's built-in `StandardSchemaValidationPipe`, and passes every response through the endpoint's response schema, which drops keys the schema doesn't declare; the frontend calls the same endpoint through its typed client and validates the response. Because the platform holds health data and rodná čísla, a field must be declared in a response schema to leave the server at all: the typed `toDto()` keeps shapes right, and the schema strip stops a field that slipped into an entity anyway. A response that doesn't match its schema is a server bug and fails as 500.

## Considered Options

- Hand-written routes with schemas per parameter (`@Post()`, `@Body({ schema })`), as in the artspect backends: simpler, but the frontend repeats every path and parameter and they can drift.
- No runtime check on responses, relying only on typed `toDto()`, as in artspect: cheaper per request, but one careless spread or added column could leak personal data with nothing to stop it.
- OpenAPI generated from the schemas, or decorators on every route: no consumer besides our own frontend in v1, so it is left out until one appears.

## Consequences

- No DTO classes, no `nestjs-zod`, no class-validator, no Swagger in v1.
- No API versioning in v1: there is one frontend, and a shape change updates the API and the app in the same change.
- Response validation costs a schema parse per response, accepted for the safety it buys.
- Naming, layout and REST conventions for contracts are in `packages/schema/AGENTS.md`.
