import { defineEndpoint } from '@repo/schema/shared';

import { campPhotoParamsSchema, campPhotoSchema } from './camp-photo.resource.ts';

// Removes a Camp's photo; Camp settings write.
export const removeCampPhotoEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/camps/:campId/photo',
  params: campPhotoParamsSchema,
  response: campPhotoSchema,
});
