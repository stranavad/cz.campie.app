# Error handling

## API errors

`apiClient` turns every failure into an `ApiError` subclass (`src/lib/api/errors.ts`): one per kind (network, timeout, HTTP status, schema mismatch), each with a `kind`; the HTTP one carries the status and the `ErrorResponse` body with its stable `code`. Callers branch on the kind and code instead of parsing messages; `isApiError()` narrows an unknown error. A request the caller cancelled (`AbortError`) isn't a failure, so it passes through untouched and TanStack Query ignores it.

## Retries

Retry only what can fix itself: queries retry network, timeout and 5xx errors; client errors and invalid responses fail at once. Mutations never retry, to avoid repeating side effects (a submitted Registration, a payment). Policy lives in `shouldRetry` (`src/core/application/query-client.ts`).

## Showing errors

Users see a translated message from the feature's namespace, chosen by the error's `code`, never `error.message` (backend text). Place it where the user is looking: a query error where the data would render, a mutation error next to the control that triggered it. On form submit, catch the failed `mutateAsync` so there's no unhandled rejection; the form keeps its values for a retry. Field validation: [forms.md](forms.md).

## Other errors

- Render errors: TanStack Router's error boundary replaces the page while the app shell stays; a route can set its own `errorComponent`.
- Invalid env: throws before render, so the page stays blank and the console names the variable ([config-and-env.md](config-and-env.md)).
- Unknown or offline Organisation subdomain: a dedicated page from `core/host`, not a generic error.
