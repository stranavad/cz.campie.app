import { z } from 'zod';

import { publicCampParamsSchema } from '@repo/schema/camps';
import { fileLinkSchema } from '@repo/schema/files';
import { defineEndpoint } from '@repo/schema/shared';

export const getSubmittedPrihlaskyBodySchema = z.object({
  // The submission's own key: only whoever submitted the Registration knows it.
  idempotencyKey: z.uuid(),
});

export type GetSubmittedPrihlaskyBody = z.infer<typeof getSubmittedPrihlaskyBodySchema>;

// One entry per Participant, in the order of the submission.
export const submittedPrihlaskySchema = z.object({
  participants: z.array(
    z.object({
      position: z.number().int(),
      // A download link for a few minutes; null until the Přihláška is generated.
      prihlaska: fileLinkSchema.nullable(),
    }),
  ),
});

export type SubmittedPrihlasky = z.infer<typeof submittedPrihlaskySchema>;

// The Přihlášky of a Registration straight after its submission, found by the submission's key, on the
// Camp's subdomain, for a day after it; later, the portal has them. Rate limited per address and per
// Organisation; an unknown, expired or Erased one is not found.
export const getSubmittedPrihlaskyEndpoint = defineEndpoint({
  method: 'POST',
  path: '/public-camps/:slug/registrations/prihlasky',
  params: publicCampParamsSchema,
  body: getSubmittedPrihlaskyBodySchema,
  response: submittedPrihlaskySchema,
  status: 200,
});
