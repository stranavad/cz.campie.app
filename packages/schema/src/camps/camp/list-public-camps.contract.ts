import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { publicCampSchema } from './get-public-camp.contract.ts';

// A Camp on its Organisation's landing page, summed up from its Turnusy by the availability rules of its
// page.
export const publicCampCardSchema = publicCampSchema.extend({
  // The first start and the last end of its Turnusy not yet over in Prague; null without any.
  dates: z.object({ startDate: z.iso.date(), endDate: z.iso.date() }).nullable(),
  // The lowest price in force now among those of them open or not yet open; null without any.
  lowestPrice: z.number().int().nullable(),
});

export type PublicCampCard = z.infer<typeof publicCampCardSchema>;

// The subdomain's Organisation's Camps by name, for its landing page.
export const listPublicCampsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/public-camps',
  response: z.array(publicCampCardSchema),
});
