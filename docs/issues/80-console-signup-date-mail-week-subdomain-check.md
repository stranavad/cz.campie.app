# 80 - Console signup date, weekly mail stats and subdomain check

Status: in-progress
Stage: 1b
Episode: E1 Organisations and identity
Blocked by: 17, 21, 22, 68
Stories: 2, 11, 14

## What to build

The redesigned operator console shows when each Organisation signed up and its mail over the last 7 days, not only since the start. The signup form says whether the chosen subdomain is free ("Adresa je volná") while the Owner types, instead of only on submit.

## Decisions

- **Signup date.** Organisations gain `createdAt`; the migration fills existing ones from their UUIDv7 id. The console list returns it.
- **Mail over 7 days.** Mail statistics are counted per Organisation and Prague day instead of one running total; the console returns the totals and the last 7 days of sent, bounced and complained. Still no addresses.
- **Subdomain check.** `GET /subdomains/:subdomain/availability` on the main host, without a session: `available`, or the code signup would answer (malformed, reserved, taken). Rate limited per address under the signup limit's rules, so it cannot enumerate Organisations faster than signing up could.

## Acceptance criteria

- [ ] The console list returns `createdAt` for new and migrated Organisations; non-operators get 403 as before.
- [ ] Mail sent eight days ago counts in the totals but not in the last 7 days; existing totals survive the migration.
- [ ] The subdomain check answers exactly what signup would for a free, malformed, reserved and taken name, and refuses past its limit.

## Notes

- Spec sections: Tenancy; Identity, permissions and audit (operator).
- Design: canvas "Campie - návrhy designu", artboards `B3-Konzole`, `B3-RegistraceOrg`. Consumed by the operator console's Organisation list and the signup form's subdomain field.

## Comments

- 2026-11-09: Implemented. Organisations have `createdAt` (backfilled from the UUIDv7 id), `mail_statistics` counts per Organisation and Prague day (existing totals moved to the Organisation's signup day), and the console returns `createdAt` and `mail.total` / `mail.lastSevenDays`. `GET /subdomains/:subdomain/availability` answers `available` or signup's code, rate limited per address with the signup limit's numbers under its own counter, so checks never use up signups. The console table shows the signup date, the mail panel and warnings use the last 7 days, and signup checks the subdomain once typing pauses. Not yet checked in the browser.
