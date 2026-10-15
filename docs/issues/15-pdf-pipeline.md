# 15 - PDF pipeline

Status: ready-for-agent
Stage: 1a
Episode: E0 Foundation
Blocked by: 06, 11
Stories: 159

## What to build

Build one rendering pipeline for every generated document: a React template rendered to static markup and sent to the PDF renderer port. Branding (logo, accent colour, display name) and the Organisation's legal identity are inputs to every template, never hard-coded. Rendering runs as a background job and the result is stored through the encrypted file service once issue 12 exists (until then, returned directly in tests). Templates are phrased so camp data never needs Czech declension. Ship one sample template proving branding and legal identity flow through.

## Acceptance criteria

- [ ] A sample template renders to a PDF through the fake renderer in tests and through Gotenberg locally
- [ ] Changing the Organisation's logo, colour or legal name changes the rendered output
- [ ] No Domino name, address or logo appears anywhere in templates
- [ ] Rendering runs as a job and does not block the request

## Notes

- Spec sections: Generated documents and printouts
- Port from Domino: `packages/documents/src/render.tsx`, `packages/documents/src/pdf.ts`, `packages/documents/src/design-system/`, `apps/api/src/pdf/services/pdf.service.ts`
- One pipeline instead of Domino's separate documents and printouts packages (spec Further Notes)
