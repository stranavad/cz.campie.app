# 18 - Admin password auth

Status: done
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 14, 16
Stories: -

## What to build

Admins log in on the main host with email and password. Admin identity is global (one email, one account). Passwords have a minimum strength, are hashed with a modern algorithm, and failed attempts are limited per account and per IP. A forgotten password is reset through an emailed link. A successful login issues the admin session cookie from issue 14. TOTP comes later (issue 67), except for operators (issue 21).

## Acceptance criteria

- [x] Correct credentials produce an admin session cookie; wrong ones do not, with a generic message
- [x] After the configured number of failed attempts, further attempts are blocked for a period
- [x] Password reset by email works once and expires
- [x] Weak passwords are rejected

## Notes

- Spec sections: Identity, permissions and audit
- Port from Domino: `apps/api/src/auth/services/auth.service.ts` (bcrypt login flow)

## Comments

2026-11-02 - **Implemented.** Admins log in on the main host at `/prihlaseni`, reset a forgotten password at `/zapomenute-heslo` and set a new one at `/nove-heslo?token=...`; the admin home sends a signed-out visitor to the login, and the platform header has "Odhlásit se".

- Endpoints (`@repo/schema/admins`): `POST /sessions` (login, 204 with the `__Host-admin_session` cookie), `DELETE /sessions/current` (logout on platform access, so a cookie whose session already ended is cleared too), `POST /password-resets` (always 204), `POST /password-resets/complete` (token and new password). A wrong password, an unknown email and an account without a password all get 401 `credentials_invalid`; an email without an account is hashed against all the same, so the timing gives nothing away.
- Failed attempts: `RateLimiter` (`core/rate-limits/`) counts attempts in Redis sorted sets scored by the Clock, so tests move time. An attempt is counted and checked in one MULTI before the password is verified, so a burst of simultaneous guesses gets no more than the limit; a success releases its IP attempt and clears the email's failures once the session commits. Login reads the id and hash in one query whether or not the email exists. Blocked attempts answer 429 `login_throttled` without checking the password and don't extend the lockout. The email and IP limits are configuration: `LOGIN_MAX_FAILURES_PER_ACCOUNT` (5), `LOGIN_MAX_FAILURES_PER_IP` (20), `LOGIN_LOCKOUT_MINUTES` (15). Subjects are stored only as SHA-256 hashes with a TTL.
- Client IP: `app.set('trust proxy', 1)` makes `request.ip` the last `X-Forwarded-For` entry, which the frontend's proxy appends, the same rule as the forwarded host. This also corrects the IP in audit entries, which so far recorded the proxy's address.
- Reset: the request enqueues a platform job with the admin id only; the handler creates the token (only its SHA-256 is stored in the new platform table `password_resets`) and mails the link on the auth stream, valid 60 minutes; a new link replaces the admin's earlier ones, so the table holds at most one per admin. Completing it checks the strength against the admin's email, consumes the row with `DELETE ... RETURNING` (so two simultaneous uses can't both succeed), sets the hash, ends all the admin's sessions and, after commit, lifts a login lockout. It doesn't sign the admin in, so a TOTP step (issue 67) can't be skipped through a reset.
- Strength (`passwordProblem` in `@repo/schema/shared`, own rules as agreed): 12 to 200 characters, at least 6 different characters, at least 6 characters that break a run along the alphabet, digits or a QWERTY/QWERTZ keyboard, and neither the email's local part nor any of its pieces of 4 or more characters nor the product name inside. Codes `password_too_short`, `password_too_long`, `password_too_simple`, `password_guessable`. Signup now applies it too (API and form), and the forms show the API's code at the password field.
- New env variables: `PLATFORM_SCHEME` (`https` required in production, `http` locally) for emailed links, and the three login limits; set in `.env.example`, `.env.test` and Compose. **The deployment needs all four.**
- Tests: `login.integration.test.ts` (success with the cookie that opens `/account`; the three refusals alike; account lockout and its end; IP lockout for that address only; failures forgotten after a success; a simultaneous burst; logout), `password-reset.integration.test.ts` (link on the auth stream that works once; nothing sent for an unknown email; expiry; unknown token; each weak password with the link still usable; sessions ended and lockout lifted), signup refusing weak passwords, and the pure `password.test.ts`. Checked by hand on the local stack in headless Chromium: login, wrong password, logout, forgotten password, a link without a token, a weak and a guessable password, a used link, and the lockout through the Vite proxy.
- Assumed, to confirm:
  - Password changes aren't audited: audit entries belong to an Organisation, and an admin identity is global. Login and logout aren't audited either.
  - Logout is included although the criteria don't name it; a login without a way out felt incomplete.
  - Rate limiting of reset requests (mail flooding) is left to issue 22, which can reuse `RateLimiter`.
  - An expired, unused link stays as one row per admin until their next request; no cleanup job.
- Open from review, not changed:
  - `trust proxy 1` assumes the frontend's proxy is the only hop in front of the API, like the forwarded host does. If the API host adds its own load balancer, both need the hop count raised; if the API is reachable directly, a client can choose its X-Forwarded-For and dodge the per-IP limit (the per-email limit still holds). Check when the API hosting is chosen.
  - The Argon2 hash runs inside the request's unit of work, holding a pooled connection for its ~50 ms (login, reset, signup). Worth revisiting if a credential-spraying burst ever drains the pool.
  - Anyone who knows an admin's email can keep them locked out by failing every 15 minutes; a password reset lifts it. This is the trade-off of a per-account limit, which the criteria ask for.
  - `RateLimiter` opens its own Redis connection beside BullMQ's and the health check's.
