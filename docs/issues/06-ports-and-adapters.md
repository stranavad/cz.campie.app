# 06 - Ports and adapters skeleton

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 02, 04
Stories: 190, 191

## What to build

Define the ports from the spec as interfaces in the API with two implementations each, selected by configuration at startup: Clock (system / controllable), Mail (Resend / log-only), File storage (Tigris / AWS SDK against RustFS) with only put, get, delete and exists, PDF renderer (Gotenberg / fake), Payment gateway (Comgate stub / fake) and Key provider (master key from a secret / fixed test key). The Database port is handled in issue 07. Configuration is validated on start and the API refuses to boot with an invalid or mixed combination. The log-only mail sender writes the full message to the log so local testing never mails a real address.

## Acceptance criteria

- [ ] Each port has a production and a local/test implementation selected by one configuration value
- [ ] Starting with missing or invalid configuration fails fast with a clear message
- [ ] With local configuration, sending mail writes subject, recipients and body to the log and calls no external service
- [ ] The controllable clock can be set and advanced from tests
- [ ] The Comgate adapter is only a stub that throws 'not implemented'; the real one is issue 48

## Notes

- Spec sections: Ports and adapters
- Port from Domino: `apps/api/src/storage/services/storage.service.ts`, `apps/api/src/email/services/email.service.ts` (behaviour, not structure)
- RustFS findings from issue 04 decide the local storage adapter
