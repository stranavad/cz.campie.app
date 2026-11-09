import { z } from 'zod';

import { fileLinkSchema, type FileContentType } from '@repo/schema/files';

// A Camp's photo is published on its card and at the top of its page, so an image browsers show as it is;
// never SVG, which can carry script.
export const CAMP_PHOTO_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const satisfies readonly FileContentType[];

// A phone's photo as it comes, which every guardian's phone loads with the Camp's pages.
export const MAX_CAMP_PHOTO_BYTES = 5 * 1024 * 1024;

// A Camp's photo for its settings, through a short-lived link; null without one.
export const campPhotoSchema = z.object({ photo: fileLinkSchema.nullable() });

export type CampPhoto = z.infer<typeof campPhotoSchema>;

export const campPhotoParamsSchema = z.object({ campId: z.uuid() });

export type CampPhotoParams = z.infer<typeof campPhotoParamsSchema>;
