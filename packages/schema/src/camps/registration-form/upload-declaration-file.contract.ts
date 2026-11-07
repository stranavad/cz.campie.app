import { z } from 'zod';

import { fileLinkSchema } from '@repo/schema/files';
import { defineEndpoint } from '@repo/schema/shared';

import { campParamsSchema } from '../camp/camp.resource.ts';

export const uploadedDeclarationFileSchema = z.object({ fileId: z.uuid(), link: fileLinkSchema });

export type UploadedDeclarationFile = z.infer<typeof uploadedDeclarationFileSchema>;

// Stores a PDF for a declaration of a Camp's form, encrypted, for the draft to name; a PDF no saved draft
// names is removed with the next save. Camp settings write.
export const uploadDeclarationFileEndpoint = defineEndpoint({
  method: 'POST',
  path: '/camps/:campId/registration-form/files',
  params: campParamsSchema,
  upload: true,
  response: uploadedDeclarationFileSchema,
});
