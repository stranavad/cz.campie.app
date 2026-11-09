# Styling and UI components

## Tailwind

[Tailwind CSS 4](https://tailwindcss.com/docs) utilities only; no CSS modules or per-component CSS, so styles live with the markup they affect.

No `tailwind.config.js`: `src/index.css` holds the imports, theme variables, the `@theme` mapping and base styles; the Vite plugin is in `vite.config.ts`.

- **Mobile-first.** Guardians fill the form on a phone; design for the narrow screen and widen from there. No horizontal page scroll: a wide table scrolls inside its own box (`Table`).
- **Light and dark theme.** `dark` on `<html>` switches every token (`@custom-variant dark` in `src/index.css`); `light` or `dark` on an element pins its subtree to one theme (a preview of both). `src/lib/theme` follows the system setting until the visitor picks one with `ThemeToggle` (kept in `localStorage`); an inline script in `index.html` applies it before the first paint, so keep the two in step.
- **Style through semantic theme tokens** (`bg-card`, `text-muted-foreground`, `bg-primary`, `bg-brand`), never raw colours or `dark:` overrides, so both themes and every accent work (`theme/no-raw-colours` in `oxlint/` rejects palette and hex classes). The tokens are the variables in `src/index.css`; a new token needs a light value, a dark value and an `@theme` entry.
- **Two actions colours.** `primary` is near-black (near-white in dark): the main action in the admin and on the platform's pages. `brand` is the Organisation's or Camp's accent: guardians' calls to action, the selected navigation tint (`brand-soft`), bars and dots. `campie` is the platform's own brand. `OrganisationShell` sets `data-actions="brand"`; a shared component whose main action follows that rule styles it `bg-primary in-data-[actions=brand]:bg-brand` (see the date pickers).
- **Organisation branding**: spread `brandAttributes(accent)` (`core/branding`) on an element to brand everything inside it. It sets the light and dark inputs from `brandColours` in `@repo/schema/organisations` (black or white text on the accent, the accent darkened until it reads on white, lightened until it reads on the dark surface); `src/index.css` derives `--brand`, `--brand-foreground`, `--brand-text`, `--brand-soft` and `--ring` from them for the current theme, so switching the theme needs no re-render.
- **Smooth on old phones.** Cards have borders, not shadows (`shadow-float` only for floating layers); no `backdrop-filter` or blur; transition only colours, `transform` and `opacity`, never `transition-all`; no scroll listeners or animation libraries. Fonts (Figtree, Bricolage Grotesque) are self-hosted variable fonts from `@fontsource-variable`, not a third-party CDN.
- **Our own pickers, never the browser's.** Choices, dates, times, colours and files open our components (`Select`, `DatePicker`, `DateTimePicker`, `AccentPicker`, `FileInput`, `FileButton`), so they look the same on every device and in both themes; Base UI brings keyboard and screen-reader support. `theme/no-native-pickers` in `oxlint/` rejects `<select>` and picker input types. Modals use `Dialog`.
- **Shape**: pill buttons and chips (`rounded-full`), cards `rounded-3xl`, inputs `rounded-2xl`, touch targets at least 44px. Page titles use `text-title`, a centred card's title `text-card-title`, card titles `text-heading`; `h1`-`h3` use the display face.
- **Shared kit**: primitives in `src/components/ui/` (button, input, textarea, select, popover, dialog, sheet (bottom sheet for phones), dropdown-menu, checkbox, field, card, badge, alert, table, segmented-control with counts, tab-nav, progress, meter, avatar, description-list, skeleton); compositions in `src/components/` (date-picker, page-header, settings-section, setting-switch, file-input, file-button, code-input, search-input, filter-pill, stat-tile, empty-state, count-pill, icon-tile, back-header, sticky-action-bar, step-progress, theme-toggle, campie-mark). Uploaded logos sit on `bg-logo-plate` (white in both themes). Reach for these before writing markup.
- Combine conditional classes with `cn` from `@/lib/utils`. It resolves conflicts, so a `className` passed from outside overrides a component's defaults.

## shadcn/ui

[shadcn/ui](https://ui.shadcn.com) ([LLM index](https://ui.shadcn.com/llms.txt)) on [Base UI](https://base-ui.com) ([LLM index](https://base-ui.com/llms.txt)). The CLI copies source into `src/components/ui/`; from then on it's our code, not a dependency.

- Install only what the app uses: from `apps/app`, `pnpm dlx shadcn@latest add <component>`. Review the diff, since it can pull in other components and packages.
- Import from `@/components/ui/<component>`.
- When the app needs a different look or behaviour, edit the component itself; re-running `add` offers to overwrite those edits.
- App-specific combinations (field with label and error, confirm dialog) are new components on top, keeping the primitives generic: form fields in `core/form/components/`, other shared ones in `src/components/`.
- `react/only-export-components` is off for `src/components/ui/`, because shadcn files export helpers such as variants.
