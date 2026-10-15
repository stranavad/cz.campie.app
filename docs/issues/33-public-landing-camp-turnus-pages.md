# 33 - Public landing, Camp and Turnus pages

Status: ready-for-agent
Stage: 1a
Episode: E3 Public registration
Blocked by: 13, 23, 25
Stories: 59, 60, 61, 62

## What to build
The public pages on an Organisation's subdomain. `/` is the Organisation landing: it goes straight to the Camp when there is only one, otherwise it shows Camp cards. `/{camp-slug}` lists the Camp's Turnusy with dates, price (Early bird when in force), age range and remaining places, each marked open, not yet open (with the opening date and time and a countdown), full or closed. Old slugs redirect to the current one. Pages use the Camp's branding (logo, accent colour, display name) and link back to the Camp's website. An Organisation that is not approved shows its pages only to its own logged-in admins as a preview; a suspended Organisation's pages are offline for everyone.

## Acceptance criteria
- [ ] API resolves the Organisation from the forwarded host (ADR-0001); an unknown subdomain returns 404.
- [ ] Pending Organisation: public API returns 404 for anonymous requests; preview works for its admins.
- [ ] Suspended Organisation: 404 (or an offline page) for everyone.
- [ ] Turnus availability and remaining places match issue 25's rules using the controllable Clock.
- [ ] Old Camp slug redirects to the current slug.
- [ ] Public responses expose no capacity internals beyond remaining places and no other Organisation's data.
- [ ] Mobile-friendly layout, Czech strings through i18n, readable text colour against the accent.

## Notes
- Spec sections: Architecture (public addresses); Tenancy (status); Other (branding).
- Port from Domino: `apps/web/components/registrations-closed.tsx` for the closed and not-yet-open states.
