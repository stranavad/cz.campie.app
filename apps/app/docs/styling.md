# Styling and UI components

## Tailwind

[Tailwind CSS 4](https://tailwindcss.com/docs) utilities only; no CSS modules or per-component CSS, so styles live with the markup they affect.

No `tailwind.config.js`: `src/index.css` holds the imports, theme variables, the `@theme` mapping and base styles; the Vite plugin is in `vite.config.ts`.

- **Light theme only, mobile-first.** Guardians fill the form on a phone; design for the narrow screen and widen from there.
- **Style through semantic theme tokens** (`bg-background`, `text-muted-foreground`, `bg-primary`), not raw colours or sizes. The tokens are the variables in `src/index.css`; a new token needs a variable and an `@theme` entry.
- **Organisation branding** (issue 23) sets token values at runtime on the Organisation's pages, so a component that uses tokens is branded for free and one with raw colours is not.
- Combine conditional classes with `cn` from `@/lib/utils`. It resolves conflicts, so a `className` passed from outside overrides a component's defaults.

## shadcn/ui

[shadcn/ui](https://ui.shadcn.com) ([LLM index](https://ui.shadcn.com/llms.txt)) on [Base UI](https://base-ui.com) ([LLM index](https://base-ui.com/llms.txt)). The CLI copies source into `src/components/ui/`; from then on it's our code, not a dependency.

- Install only what the app uses: from `apps/app`, `pnpm dlx shadcn@latest add <component>`. Review the diff, since it can pull in other components and packages.
- Import from `@/components/ui/<component>`.
- When the app needs a different look or behaviour, edit the component itself; re-running `add` offers to overwrite those edits.
- App-specific combinations (field with label and error, confirm dialog) are new components on top, keeping the primitives generic: form fields in `core/form/components/`, other shared ones in `src/components/`.
- `react/only-export-components` is off for `src/components/ui/`, because shadcn files export helpers such as variants.
