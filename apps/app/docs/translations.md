# Translations

[i18next](https://www.i18next.com) + [react-i18next](https://react.i18next.com) ([i18next LLM index](https://www.i18next.com/llms.txt), [react-i18next LLM index](https://react.i18next.com/llms.txt)). Czech is the only language in v1, and the source of truth for keys; the layer exists so adding Slovak or English is not a rewrite (story 193).

| Path                              | Holds                               |
| --------------------------------- | ----------------------------------- |
| `src/locales/cs/<namespace>.json` | translations                        |
| `src/lib/i18n/index.ts`           | setup, sync of dayjs and Zod locale |
| `src/lib/i18n/resources.ts`       | registers namespaces                |
| `src/lib/i18n/i18next.d.ts`       | typed keys                          |

## How it's designed

- Every user-facing text goes through `t()`; lint bans raw JSX text, so a new language never means touching components.
- Namespaces follow features (`common` for shared text), so a feature's texts move and change with it.
- Keys are typed: an unknown key is a type error.
- Czech plurals use one key per form (`_one`, `_few`, `_many`, `_other`) plus `count`.
- Errors from the API and the form engine arrive as keys or codes and are translated here, never shown raw.
- Camp-authored content (form labels, Consent texts, emails written by the camp) is single-language data, not translations.
- The product name and platform domain are configuration, interpolated into texts, never hard-coded.

## Extending

- Key: add it to the namespace JSON.
- Namespace: a JSON file in `src/locales/cs/`, registered in `resources.ts`.
