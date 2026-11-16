import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

export const getSetupProgressResponseSchema = z.object({
  // Whether the Organisation's bank account is set; the account itself stays with the Owners.
  bankAccount: z.boolean(),
  // The Camp closest to taking Registrations, which the two steps below describe; null without a Camp.
  campId: z.uuid().nullable(),
  turnus: z.boolean(),
  registrationForm: z.boolean(),
});

export type GetSetupProgressResponse = z.infer<typeof getSetupProgressResponseSchema>;

// What the current Organisation still lacks before its first Registration; Camp settings read.
export const getSetupProgressEndpoint = defineEndpoint({
  method: 'GET',
  path: '/setup-progress',
  response: getSetupProgressResponseSchema,
});
