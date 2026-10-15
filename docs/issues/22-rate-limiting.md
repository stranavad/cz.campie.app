# 22 - Rate limiting

Status: ready-for-agent
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 14
Stories: 12

## What to build

Rate-limit the endpoints that send mail or create data for anonymous callers: Organisation signup, admin password reset, guardian login-link requests and public form submissions. Limits apply per IP and per target (email address or Organisation) and use Redis so they hold across API instances. A limited request gets a Czech message and no side effects.

## Acceptance criteria

- [ ] Exceeding the limit on each listed endpoint returns 429 with a message key and sends no mail
- [ ] Limits are per IP and per target email or Organisation
- [ ] Limits are configurable and can be relaxed in tests

## Notes

- Spec sections: User stories 12
