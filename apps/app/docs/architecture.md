# Architecture

The app is organized by feature, with shared code layered underneath so dependencies only flow one way.

## Folders

```
src/
├── components/          shared components; ui/ = shadcn
├── config/              config + validated env
├── core/<module>/       app-wide modules (application shell, host mode, form, session)
├── features/<feature>/  one folder per feature
├── lib/<library>/       third-party setup, small shared helpers (api, i18n)
├── locales/cs/          translations
├── routes/              route files
├── main.tsx             entry
├── index.css            Tailwind + theme
└── routeTree.gen.ts     generated
```

Folders appear with their first file.

## Layers

Shared (`components/`, `lib/`, `config/`) → `core/` → `features/` → `routes/`; each layer builds only on those before it. Deleting or rewriting one feature can't break another.

- Shared code knows nothing about the domain, so it stays reusable.
- `core/` holds what several features rely on: the application shell, host mode, form building blocks, the session.
- Features don't reach into each other. When two need the same thing, move it down: to `core/` if it's domain, to shared if generic.
- Imports go through `@/`, never `../`, so a boundary can't be sidestepped by a relative path.

`oxlint/boundaries.ts` enforces this. Features are picked up from `src/features/` automatically; a new top-level shared folder must be added to the shared list there, or its imports go unchecked.

## Modules and features

A core module and a feature share the same shape. `index.ts` is the public surface: outside code uses only that, internal code imports by full path (going through its own index invites cycles).

- Export only what routes render, usually the page; everything else stays private so it can change freely.
- A routed feature has a `<feature>-page.tsx` that lays out and composes; the work sits in the components below it.
- Group by area: `components/<area>/` keeps one area's components, hooks and schemas together, named after its main component. Feature-wide code gets a root folder named after what it holds (`api/`, `hooks/`).
- API shapes come from `@repo/schema`; a local `schemas/` holds only frontend-only shapes.
- Features are named with `CONTEXT.md` terms: `registrations`, `turnusy`, `consents`.

## Naming

kebab-case `<name>.<kind>.ts` (`use-turnus-list.hook.ts`, `registration.schema.ts`); components carry no suffix. Reuse existing kinds; a new kind is named after its contents. Route files and `components/ui/` follow their tools' conventions.

## Components and files

Every file does one thing and reads in one go, so a change touches the file you'd expect and nothing else.

- **A file holds one kind of thing**, named by its suffix. What a component needs (helpers, constants, schemas) sits in its own file next to it.
- **A component file is just the component**: imports, its `<Component>Props` type, a named `function` export. One component per file; sub-components get their own file beside the parent.
- **Around 100 lines** is the signal a component does too much; split out a hook or sub-components before it grows.
- **Components render, hooks decide.** Components map data to JSX; fetching, state, derived values and handler logic live in a hook next to them. Trivial UI-only state (a menu being open) can stay in the component.
- **Keep JSX flat**: early returns for loading, error and empty states, named sub-components instead of commented blocks, growing conditions as named booleans in the hook.
- Text comes from `t()` ([translations.md](translations.md)), classes from theme tokens ([styling.md](styling.md)).
