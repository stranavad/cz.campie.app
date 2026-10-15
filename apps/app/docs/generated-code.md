# Generated code

Generated files are outputs: change the input and regenerate, don't hand-edit, or the next run silently undoes the change. shadcn components are the exception: generated once, then ours.

| File                      | Source                                | Regenerate                                | Committed | Prettier / Oxlint |
| ------------------------- | ------------------------------------- | ----------------------------------------- | --------- | ----------------- |
| `src/routeTree.gen.ts`    | TanStack Router plugin, `src/routes/` | `pnpm dev` / `pnpm build` (automatic)     | yes       | skipped           |
| `src/components/ui/*.tsx` | shadcn CLI, then ours                 | `pnpm dlx shadcn@latest add <component>`  | yes       | formatted         |

- **Route tree** is committed because `pnpm check-types` runs without Vite. After adding, renaming or removing a route file, run `pnpm dev` or `pnpm build` once, or the type check and pre-commit fail on a stale tree ([routing.md](routing.md)).
- **shadcn** files are editable app code. Re-running `add` offers to overwrite local changes, so review before accepting ([styling.md](styling.md)).
