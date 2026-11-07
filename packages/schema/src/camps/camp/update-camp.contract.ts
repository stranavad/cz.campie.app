import type { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { campParamsSchema, campSchema } from './camp.resource.ts';
import { campFieldsSchema } from './create-camp.contract.ts';

// What is left out stays as it is, but something must change.
export const updateCampBodySchema = campFieldsSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'camp_change_empty');

export type UpdateCampBody = z.infer<typeof updateCampBodySchema>;

// Changes a Camp, audited; Camp settings write. A former slug keeps leading to the Camp; one another Camp
// of the Organisation has or had answers camp_slug_taken.
export const updateCampEndpoint = defineEndpoint({
  method: 'PATCH',
  path: '/camps/:campId',
  params: campParamsSchema,
  body: updateCampBodySchema,
  response: campSchema,
});
