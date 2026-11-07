import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { checklistItemSchema } from './checklist.ts';

export const guardianChecklistParamsSchema = z.object({ registrationId: z.uuid() });

export type GuardianChecklistParams = z.infer<typeof guardianChecklistParamsSchema>;

// One checklist per Registered child of a guardian's Registration.
export const guardianChecklistSchema = z.object({
  participants: z.array(
    z.object({ id: z.uuid(), firstName: z.string(), lastName: z.string(), items: z.array(checklistItemSchema) }),
  ),
});

export type GuardianChecklist = z.infer<typeof guardianChecklistSchema>;

export const getGuardianChecklistEndpoint = defineEndpoint({
  method: 'GET',
  path: '/portal/registrations/:registrationId/checklist',
  params: guardianChecklistParamsSchema,
  response: guardianChecklistSchema,
});
