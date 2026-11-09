# 75 - Camp description and photo

Status: ready-for-agent
Stage: 1b
Episode: E2 Camp setup
Blocked by: 12, 24, 33
Stories: 59, 60

## What to build

The redesigned public pages show each Camp as a card with a short description and a photo on the Organisation's landing page, and the photo as the hero of the Camp page. Admins with Camp settings write set a description for guardians (plain text, a few paragraphs at most) and upload or remove one photo per Camp. The public Camp returns both.

## Acceptance criteria

- [ ] `PATCH /camps/:campId` takes the description; `GET /camps/:campId` and the public Camp return it.
- [ ] A photo upload accepts JPG, PNG and WebP up to a fixed size and refuses anything else; replacing or removing it removes the old stored object.
- [ ] The public Camp and the public Camp list return a photo URL on the Organisation's own subdomain, as the logo is served, and null without a photo.
- [ ] Camp settings read gets 403 on the writes.
- [ ] Setting the description and setting or removing the photo are audited with new catalogue actions and Czech translations (issue 69).
- [ ] Organisation A's Camp photo is not served on B's subdomain.

## Notes

- Spec sections: Other (branding); Files.
- The photo is public content like the logo: no personal data is expected in it, and it is served without a session.
- Design: canvas "Campie - návrhy designu", artboards `B3-Tabor` (settings), `M-Organizace` (Camp card), `M-Tabor` (hero). Consumed by the Camp settings page and the public landing and Camp pages.
