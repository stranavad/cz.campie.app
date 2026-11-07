# 23 - Organisation settings and branding

Status: done
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 12, 19
Stories: 20, 21, 22, 27

## What to build

Owners edit the Organisation's legal name, IČO, address, statutory representative and bank account; these feed payment instructions, QR platba and generated documents. Branding is a logo, one accent colour and a display name on the Organisation, overridable per Camp. Readable text colours are derived automatically against the accent colour so a camp cannot make its pages illegible. The logo is uploaded through the encrypted file service and served through it. Bank transfer works without any card gateway.

## Acceptance criteria

- [x] Only Owners can edit organisation settings; changes are audited with old and new values
- [x] An invalid IČO or bank account is rejected
- [x] For any accent colour, the derived text colour meets WCAG AA contrast (pure function test)
- [x] A Camp without its own branding uses the Organisation's
- [x] The logo is stored encrypted and rendered on public pages

## Notes

- Spec sections: Other (branding), Payments
- Comgate keys are issue 48

## Comments

2026-11-07 - **Implemented.** Owners edit the Organisation at `/platform/nastaveni` (linked from the admin home): legal identity, VAT number, contacts, bank account, display name, accent colour and logo.

- API: `GET`/`PATCH /organisation-settings`, `PUT`/`DELETE /organisation-settings/logo`, Owners only, each change audited as `organisation.update` with old and new values. The contact fields and VAT number are editable too, since nothing else could change them after signup.
- Bank account: Czech domestic form, checked with the CNB modulo 11 rule and kept canonical (`bankAccountSchema`); optional, since signup never asked for it. QR platba (36) derives the IBAN from it.
- Colours: `brandColours(accent)` in `@repo/schema/organisations` gives black or white text on the accent (at least 4.58:1 for any colour) and the accent darkened until it reads on white; a test checks 4,096 colours against WCAG AA. The organisation shell sets them as the theme's tokens, and the email button now wears the accent with its readable text.
- Logo: PNG or JPG up to 1 MB (`LOGO_LIMITS`), stored encrypted through `FileService`, the old one's file removed. Public pages load it from `/api/logos/<file id>`, which serves only a current logo of the host's Organisation or one of its Camps, with `immutable` caching (a new logo gets a new id), `nosniff` and a sandboxing CSP.
- Per-Camp branding: `camps.accent_colour` and `camps.logo_file_id`, falling back to the Organisation's (`effectiveBranding`); `GET`/`PATCH /camps/:campId/branding` and `PUT`/`DELETE /camps/:campId/branding/logo` under Camp settings read/write. A Camp's display name is its own name. The UI comes with issue 24's Camp settings page; public Camp pages (33) and Camp mail and documents use `effectiveBranding` when they are built.
- Contracts can declare `upload: true` (one multipart `file`); the app's client sends it as `FormData`.
- Not done: removing EXIF data from JPG logos; streaming the logo instead of buffering it (at most 1 MB). Bank transfer needs no gateway by design; payment instructions come with 36.
