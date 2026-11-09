import { defineEndpoint } from '@repo/schema/shared';

import { campPhotoParamsSchema, campPhotoSchema } from './camp-photo.resource.ts';

// Gives a Camp a photo, or a new one, stored without its metadata; Camp settings write.
export const setCampPhotoEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/camps/:campId/photo',
  params: campPhotoParamsSchema,
  upload: true,
  response: campPhotoSchema,
});
