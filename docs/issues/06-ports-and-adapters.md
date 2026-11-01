# 06 - Ports and adapters skeleton

Status: in-progress
Stage: 1a
Episode: E0 Foundation
Blocked by: 02, 04
Stories: 190, 191

## What to build

Define the ports from the spec as interfaces in the API with two implementations each, selected by configuration at startup: Clock (system / controllable), Mail (Resend / log-only), File storage (Tigris / AWS SDK against RustFS) with only put, get, delete and exists, PDF renderer (Gotenberg / fake), Payment gateway (Comgate stub / fake) and Key provider (master key from a secret / fixed test key). The Database port is handled in issue 07. Configuration is validated on start and the API refuses to boot with an invalid or mixed combination. The log-only mail sender writes the full message to the log so local testing never mails a real address.

## Acceptance criteria

- [x] Each port has a production and a local/test implementation selected by one configuration value
- [x] Starting with missing or invalid configuration fails fast with a clear message
- [x] With local configuration, sending mail writes subject, recipients and body to the log and calls no external service
- [x] The controllable clock can be set and advanced from tests
- [x] The Comgate adapter is only a stub that throws 'not implemented'; the real one is issue 48

## Notes

- Spec sections: Ports and adapters
- Port from Domino: `apps/api/src/storage/services/storage.service.ts`, `apps/api/src/email/services/email.service.ts` (behaviour, not structure)
- RustFS findings from issue 04 decide the local storage adapter

## Comments

2026-11-01 - **Done.** Six ports under `apps/api/src/core/ports/<port>/`, each an abstract class with a production and a local adapter, wired by a `@Global` module from one variable: `CLOCK_ADAPTER` (system / controllable), `MAIL_ADAPTER` (resend / log), `FILE_STORAGE_ADAPTER` (tigris / s3), `PDF_RENDERER_ADAPTER` (gotenberg / fake), `PAYMENT_GATEWAY_ADAPTER` (comgate / fake), `KEY_PROVIDER_ADAPTER` (secret / fixed).

- Configuration: each port's variables are a Zod discriminated union, so only the chosen adapter's variables are required, and the parsed config is nested per port (`config.get('mail')` is typed by its adapter). "Mixed" means production only: `APP_ENV=production` refuses any local adapter and names every one; local and test may mix freely (decided with the developer).
- `AppModule.forRoot()` reads the configuration per start instead of at import, so tests boot the app with different environments in one process (`src/testing/boot-app.ts`, the seed of issue 08's harness).
- Mail: Resend's SDK returns refusals instead of throwing; the adapter throws them. The log sender writes headers, text and HTML; `apps/api/AGENTS.md` records it as the one exception to the no-personal-data logging rule.
- File storage: put takes a stream with its exact length (issue 04: the SDK needs it), get streams, delete of a missing key succeeds, exists is a head. Storage holds ciphertext only, so no content type is stored. Both adapters, plus a health-only `ping(signal)`, were checked by hand against the Compose RustFS: a 10 MB streamed round trip byte for byte, a second delete, get after delete rejecting, and ping failing for a missing bucket. Tigris was checked by pointing the library at RustFS with path-style addressing; it has not met real Tigris yet.
- `ping()` widens "only put, get, delete and exists". The spec's limit is about presigning; the probe lets the health check go through the port instead of importing the S3 SDK. Issue 08's fakes implement it as a no-op.
- PDF renderer: `render(html)` to Gotenberg's Chromium HTML route, checked by hand against Compose Gotenberg. Header, footer and options come with issue 15.
- Payment gateway: `createPayment` and `getPaymentStatus` with per-Organisation credentials; this shape is provisional and belongs to issue 48. The Comgate adapter rejects every call with "not implemented"; the fake reports every payment pending.
- Key provider: `masterKey()` returns a `KeyObject`. The secret adapter requires `MASTER_KEY` as 32 bytes in base64; the fixed key is public and constant.
- Tests: config refusals (missing variable, unknown adapter, local adapters in production), adapter selection in production and test configuration, log mail with no `fetch`, the Comgate stub, and `ControllableClock` set and advance. The S3, Tigris and Gotenberg adapters have no CI test until issue 08 brings RustFS and Gotenberg to test runs.
- `@aws-sdk/client-s3` moved to ^3.1161.0, the version `@tigrisdata/storage`'s `lib-storage` needs as a peer.
