import { defineEndpoint } from '@repo/schema/shared';

import { campPhotoParamsSchema, campPhotoSchema } from './camp-photo.resource.ts';

// A Camp's photo; Camp settings read.
export const getCampPhotoEndpoint = defineEndpoint({
  method: 'GET',
  path: '/camps/:campId/photo',
  params: campPhotoParamsSchema,
  response: campPhotoSchema,
});
