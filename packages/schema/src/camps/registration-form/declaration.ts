import { z } from 'zod';

import { fileLinkSchema } from '@repo/schema/files';

const MAX_DECLARATIONS = 30;

// A Registration declaration as stored in a draft and frozen in a version: its wording, whether guardians
// must tick it, and at most one document to read first, a web page or an uploaded PDF.
export const declarationSchema = z
  .object({
    id: z.uuid(),
    text: z.string().trim().min(1).max(2000),
    mandatory: z.boolean(),
    // https or http only, so it cannot run script.
    url: z
      .url({ protocol: /^https?$/ })
      .max(500)
      .nullable(),
    fileId: z.uuid().nullable(),
  })
  .refine(({ url, fileId }) => url === null || fileId === null, { path: ['url'], message: 'declaration_link_twice' });

export type Declaration = z.infer<typeof declarationSchema>;

export const declarationsSchema = z
  .array(declarationSchema)
  .max(MAX_DECLARATIONS)
  .refine(
    (declarations) => new Set(declarations.map(({ id }) => id)).size === declarations.length,
    'declaration_duplicate',
  );

// A declaration as a page shows it: its document's link, if any, works for a few minutes without a session.
export const shownDeclarationSchema = z.object({
  id: z.uuid(),
  text: z.string(),
  mandatory: z.boolean(),
  url: z.string().nullable(),
  file: z.object({ id: z.uuid(), link: fileLinkSchema }).nullable(),
});

export type ShownDeclaration = z.infer<typeof shownDeclarationSchema>;
