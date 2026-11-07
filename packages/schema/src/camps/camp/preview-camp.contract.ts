import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { publicTurnusSchema } from '../turnus/public-turnus.resource.ts';
import { campParamsSchema } from './camp.resource.ts';
import { publicCampSchema } from './get-public-camp.contract.ts';

export const campPreviewSchema = z.object({ camp: publicCampSchema, turnusy: z.array(publicTurnusSchema) });

export type CampPreview = z.infer<typeof campPreviewSchema>;

// A Camp's public page as guardians will see it, for its Organisation's admins on the main host, also
// before the Organisation is approved and its subdomain goes live. Any member.
export const previewCampEndpoint = defineEndpoint({
  method: 'GET',
  path: '/camps/:campId/preview',
  params: campParamsSchema,
  response: campPreviewSchema,
});
