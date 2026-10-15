# Backend layering: controller, service, repository, with ports and the unit of work

The API follows the layering of the artspect backends instead of the Koala42 template's clean architecture: Controller → Service → Repository → Database, one way only. Controllers inject only services. Repositories inject only the unit of work's transaction-scoped database handle, never a pool, so every query runs with the current Organisation set and RLS active. Services hold the business rules, permission checks and audit entries, and are the only layer that talks to the outside world, always through a port (Clock, MailSender, FileStorage, PdfRenderer, PaymentGateway, KeyProvider) whose adapter is chosen by configuration. Entities are plain row wrappers whose `toDto()` is the single place a row becomes wire data; rules both apps need live in pure modules of `packages/schema`. The full conventions are in `apps/api/AGENTS.md`.

## Considered Options

- Koala42 template clean architecture (domain, application, infrastructure and presentation layers; use cases; rich entities; a repository port per aggregate): stronger isolation of the domain, but more files and indirection per feature than a team of one with a fixed v1 scope needs, and the developer prefers the artspect style.
- Tábor Domino's structure (services querying Drizzle directly, no repositories): the fastest to write, but database access spreads everywhere and tenant scoping would have to be remembered in every service.

## Consequences

- Layer rules are lint-enforced (`apps/api/oxlint/boundaries.ts`): controllers import no repositories or Drizzle, repositories import no services or ports.
- Code ported from Tábor Domino is restructured into these layers rather than copied in its shape.
- A service may use the database handle directly for reads spanning entities (joins, exports); plain CRUD always goes through a repository.
- How the unit of work hands its transaction to repositories is decided in issue 07; whatever the mechanism, no application code obtains a connection any other way.
