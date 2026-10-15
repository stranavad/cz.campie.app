# Forms

[TanStack Form](https://tanstack.com/form) ([LLM index](https://tanstack.com/form/latest/llms.txt)) wrapped by the core module `src/core/form/`, validated with Zod schemas directly (no adapter).

## The form module

Features build forms with `useAppForm` / `withForm` from `@/core/form`, so every form shares the same field components and behaviour. Field and form components live in `src/core/form/components/`, registered in `hooks/use-app-form.hook.ts`; new ones build on shadcn. Their contexts sit in a separate `form.context.ts` to avoid a circular import between components and hook.

## Designing a form

- A hook owns setup and submit; the component just renders ([architecture.md](architecture.md)).
- The form schema is the contract's request schema plus form-only rules, in a `.schema.ts` next to the form. Starting from the contract means the form can't submit what the API rejects.
- Submit the parsed values so schema transforms (trim, ...) apply.
- Messages are translation keys; schemas with custom messages are built inside the hook, where `t()` is available ([translations.md](translations.md)).
- Submit through a mutation: reset on success; on failure keep the user's input and show the message ([error-handling.md](error-handling.md)).
- Field components own their error display and invalid state, so forms stay consistent without per-form wiring.

## The registration form

The public registration form is not hand-written: it is rendered from the Camp's form definition by the form engine in `@repo/schema/form-engine` (issues 28, 34), which also supplies its Zod schema and field errors as translation keys. The live price comes from `@repo/schema/pricing`, the same function the API stores the price with. The form never computes a price or validates an answer on its own.
