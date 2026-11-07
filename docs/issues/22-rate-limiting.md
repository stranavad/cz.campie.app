# 22 - Rate limiting

Status: done
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 14
Stories: 12

## What to build

Rate-limit the endpoints that send mail or create data for anonymous callers: Organisation signup, admin password reset, guardian login-link requests and public form submissions. Limits apply per IP and per target (email address or Organisation) and use Redis so they hold across API instances. A limited request gets a Czech message and no side effects.

## Acceptance criteria

- [x] Exceeding the limit on each listed endpoint returns 429 with a message key and sends no mail
- [x] Limits are per IP and per target email or Organisation
- [x] Limits are configurable and can be relaxed in tests

## Notes

- Spec sections: User stories 12

## Comments

2026-11-07 - **Implemented** for the two anonymous endpoints that exist: Organisation signup and the admin password reset request. Guardian login links (39) and form submissions (35) do not exist yet; each issue has a comment saying what to add.

- `RateLimiter.admit(limit, { ipAddress, target })` (`core/rate-limits/`) counts the request against a per-IP and a per-target limit in Redis as the service's first step, and answers 429 `requests_throttled` (`REQUEST_LIMIT_ERROR_CODES` in `@repo/schema/shared`) before anything else happens. A request refused by one limit counts against neither. Every attempt counts, failed ones too, since a failing signup still costs a password hash.
- An IPv6 client counts per /64 network and an IPv4-mapped address as its IPv4 address (`addressSubject`); the admin login IP limit uses the same now.
- Unknown emails count exactly like known ones on password reset, so a 429 tells nothing about accounts.
- Config: `REQUEST_LIMIT_WINDOW_MINUTES` (60), `SIGNUP_LIMIT_PER_IP` (10), `SIGNUP_LIMIT_PER_EMAIL` (5), `PASSWORD_RESET_LIMIT_PER_IP` (20), `PASSWORD_RESET_LIMIT_PER_EMAIL` (3). `.env.test` relaxes them to 1000; the limit tests set their own.
- The signup and forgotten password forms show a Czech message for `requests_throttled`.
- Open: the per-IP limit trusts the one proxy hop of `trust proxy` 1. If the API is reachable directly, a caller can set `X-Forwarded-For` and pick any address; if another proxy sits in front, every visitor shares one address. The backend hosting decision must close this, by accepting only the frontend proxy's traffic or trusting a fixed proxy list.
