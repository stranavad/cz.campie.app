# State management

No state library: most "state" already has a better owner. Pick the first that fits:

| State                                         | Owner                                          |
| --------------------------------------------- | ---------------------------------------------- |
| API data                                      | TanStack Query ([api.md](api.md))              |
| Form values, validation                       | TanStack Form ([forms.md](forms.md))           |
| URL-worthy (filters, selected Turnus, paging) | route search params ([routing.md](routing.md)) |
| One component                                 | `useState` / `useReducer` in its hook          |
| Shared client state (host mode, Organisation) | React context                                  |

- Never copy API data into state or context: two copies drift, and the cache already shares it.
- If a user would expect a reload or a shared link to keep it, it belongs in the URL.

## Context

- One `<name>.context.tsx` holds the value type, context, provider and reading hook.
- Default `null`, and the hook throws outside its provider, so a missing provider fails loudly instead of rendering empty.
- Keep contexts small and single-purpose; separate fast-changing from rarely-changing data so updates don't re-render everything.
- No manual memoization of the value; the compiler handles it ([react-compiler.md](react-compiler.md)).
- Editing a context file reloads the page rather than hot-swapping; lint allows its extra exports.

Place the provider as low as it can go: a feature-only context wraps that feature's page; one several features need becomes a core module registered in `ApplicationProviders`.
