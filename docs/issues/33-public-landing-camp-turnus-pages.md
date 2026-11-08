# 33 - Public landing, Camp and Turnus pages

Status: done
Stage: 1a
Episode: E3 Public registration
Blocked by: 13, 23, 25
Stories: 59, 60, 61, 62

## What to build

The public pages on an Organisation's subdomain. `/` is the Organisation landing: it goes straight to the Camp when there is only one, otherwise it shows Camp cards. `/{camp-slug}` lists the Camp's Turnusy with dates, price (Early bird when in force), age range and remaining places, each marked open, not yet open (with the opening date and time and a countdown), full or closed. Old slugs redirect to the current one. Pages use the Camp's branding (logo, accent colour, display name) and link back to the Camp's website. An Organisation that is not approved shows its pages only to its own logged-in admins as a preview; a suspended Organisation's pages are offline for everyone.

## Acceptance criteria

- [x] API resolves the Organisation from the forwarded host (ADR-0001); an unknown subdomain returns 404.
- [x] Pending Organisation: public API returns 404 for anonymous requests; preview works for its admins.
- [x] Suspended Organisation: 404 (or an offline page) for everyone.
- [x] Turnus availability and remaining places match issue 25's rules using the controllable Clock.
- [x] Old Camp slug redirects to the current slug.
- [x] Public responses expose no capacity internals beyond remaining places and no other Organisation's data.
- [x] Mobile-friendly layout, Czech strings through i18n, readable text colour against the accent.

## Notes

- Spec sections: Architecture (public addresses); Tenancy (status); Other (branding).
- Port from Domino: `apps/web/components/registrations-closed.tsx` for the closed and not-yet-open states.

## Comments

2026-11-07 - **Implemented.** On an Organisation's subdomain, `/` lists its Camps as cards or goes straight to the only one; `/{camp-slug}` shows the Camp in its own branding (logo, accent, name, link to its website) with its Turnusy: dates, place, age limits, the price in force (Early bird with its last day), and open with the places left, not yet open with the opening time and a countdown, full or closed. A former slug moves the address to the current one.

- API: `GET /public-camps` (the landing), `GET /public-camps/:slug/turnusy` (`PublicTurnus`: places left and the price in force, never the capacity or counts; opening and closing as instants), next to issue 24's `GET /public-camps/:slug`. The price in force is `priceInForce` in `@repo/schema/pricing`, the rule pricing uses.
- A pending Organisation's subdomain now answers 404 `organisation_unknown` to every public and guardian request (access layer); a suspended one stays 403 `organisation_suspended`, shown as offline. Its admins preview a Camp's page from the main host at `/platform/tabory/nahled?tabor=<id>` (`GET /camps/:campId/preview`, any member; the logo comes as a short-lived link, since the public logo address works only on the subdomain), linked from the Camp settings page. The Platform operator cannot see a pending Organisation's pages.
- `createOrganisation` in the test fixtures now makes an approved Organisation unless told otherwise.
- Registered Participants are still counted as none (`TurnusService.registeredIn`), so places left equal the capacity until issue 35.
- The page and the preview share `CampPageView` (`apps/app/src/core/camp-page`). The Turnusy refetch each minute; the countdown follows the browser's clock and says the registration is opening once it runs out.

2026-11-08 - **Decision by the project lead:** the Platform operator now previews a pending Organisation's public pages from the console (`GET /console/organisations/:organisationId/preview`, see issue 21's comments); its subdomain still answers 404 to everyone until approval.
