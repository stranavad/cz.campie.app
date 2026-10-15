# Cookie sessions behind a same-origin API proxy

Sessions are httpOnly, Secure, SameSite=Lax cookies, not bearer tokens in localStorage as in Tábor Domino, because the platform holds health data and rodné čísla and token theft through XSS is the main risk. To make cookies work with one frontend on many subdomains, the frontend calls the API through a same-origin path proxy (`/api/*` rewritten to the API host), so each guardian cookie is scoped to its exact Organisation subdomain and admin cookies to the main host, and CORS is not needed.

## Consequences

- The API must sit under the platform's registrable domain or behind the frontend's rewrite; backend hosting is still open but must allow this.
- The API resolves the Organisation for public and guardian requests from the forwarded original host; a guardian session's Organisation must match it. Admin requests name the Organisation in a header, checked against membership. Gateway notifications carry it in the URL path; jobs in their payload.
- Mutations require SameSite=Lax plus a custom request header against CSRF.
