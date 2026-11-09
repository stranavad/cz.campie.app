import type { z } from 'zod';

import { defineEndpoint, fullNameSchema } from '@repo/schema/shared';

export const updateAccountBodySchema = fullNameSchema;

export type UpdateAccountBody = z.infer<typeof updateAccountBodySchema>;

// Sets the signed-in admin's own first and last name. Audited in the platform's log.
export const updateAccountEndpoint = defineEndpoint({
  method: 'PATCH',
  path: '/account',
  body: updateAccountBodySchema,
});
