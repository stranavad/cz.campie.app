# 75 - Camp description and photo

Status: in-progress
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

## Comments

2026-11-09 - **Implemented, awaiting review.** A Camp has a plain-text `description` (`PATCH /camps/:campId`, at most 1000 characters, trimmed, line breaks kept, other control and invisible formatting characters refused as `text_invalid` except the zero-width joiner of emoji, empty is none), shown in `GET /camps/:campId` and the public Camp and list; the app renders it as text with its line breaks. One photo per Camp: `GET`, `PUT` and `DELETE /camps/:campId/photo` (Camp settings read / write), JPG, PNG or WebP up to 5 MB told by content (WebP added to the file types, with a migration of the `files` check), served like a logo (shared `PUBLIC_IMAGE_HEADERS`: nosniff, sandboxing CSP, immutable cache) at `/api/camp-photos/<file id>` on the Organisation's subdomain only while it is a Camp's current photo (`photoUrl`, null without one; the admins' preview gets a short link). Replacing or removing it removes the old file and object. Audited as `camp_description.update`, `camp_photo.update` and `camp_photo.remove`, translated; a description change is its own entry beside `camp.update`.

- Metadata: no image library is installed, so `core/files/image-metadata.ts` rewrites the container instead of decoding it: a JPEG keeps only its frame, tables and scans, a thumbnail-free JFIF header, its ICC profile, the Adobe segment and an orientation-only Exif (so phone photos stay upright); a PNG only its drawing chunks; a WebP only its image chunks, with the Exif and XMP flags cleared. Everything after the image's end (motion photos, second pictures) goes, and an image not built like its type is refused. Applied to Camp photos (`CAMP_PHOTO_LIMITS.stripMetadata`); logos are stored as before.
- UI: description and photo in the Základ card of Camp settings, photo and the start of the description on the landing's Camp card, photo at the top of the Camp page hero with the description under it. The branding preview shows no description, so it is unchanged.
- Open: not checked in a browser (the local stack's port 80 is taken on this machine). The photo is served at its uploaded size; no resizing without an image library.

2026-11-09 - **Metadata stripper hardened** after an adversarial review. Logos are stripped too (`LOGO_LIMITS`), since `/api/logos/<id>` publishes them. Kept parts are read, not copied: JPEG frames (baseline, extended, progressive; one, before its scans), tables that fill their segment exactly, exact restart intervals and scan headers, restart markers only inside a scan; reserved, hierarchical, arithmetic and lossless markers refuse the image, and the Adobe segment keeps only its colour transform. A kept PNG chunk needs its kind's length and a right checksum, once unless image data or animation; a WebP's headers their sizes, a bitstream its signature, and a frame keeps only its picture. An image that draws nothing or has over 10,000 segments or chunks is refused, and kept parts are slices of the upload, so 5 MB of empty markers no longer costs a second and 440 MB.

- ICC profiles stay whole, checked only to be one (`acsp`, each JPEG part once): dropping them draws wide-gamut phone photos in the wrong colours, and their texts name the profile and its maker, not the photo. The stripper guards against metadata devices write unseen; an admin can hide bytes in pixels anyway, so no ICC rewriter.
- Picture data passes unread: JPEG scans, PNG IDAT and palette, WebP bitstreams.
