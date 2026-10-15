# 23 - Organisation settings and branding

Status: ready-for-agent
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 12, 19
Stories: 20, 21, 22, 27

## What to build

Owners edit the Organisation's legal name, IČO, address, statutory representative and bank account; these feed payment instructions, QR platba and generated documents. Branding is a logo, one accent colour and a display name on the Organisation, overridable per Camp. Readable text colours are derived automatically against the accent colour so a camp cannot make its pages illegible. The logo is uploaded through the encrypted file service and served through it. Bank transfer works without any card gateway.

## Acceptance criteria

- [ ] Only Owners can edit organisation settings; changes are audited with old and new values
- [ ] An invalid IČO or bank account is rejected
- [ ] For any accent colour, the derived text colour meets WCAG AA contrast (pure function test)
- [ ] A Camp without its own branding uses the Organisation's
- [ ] The logo is stored encrypted and rendered on public pages

## Notes

- Spec sections: Other (branding), Payments
- Comgate keys are issue 48
