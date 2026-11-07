import { z } from 'zod';

// A Registration as its guardian sees it in the portal.
export const guardianRegistrationSchema = z.object({
  id: z.uuid(),
  variableSymbol: z.string(),
  campName: z.string(),
  turnusName: z.string(),
  participants: z.array(z.object({ firstName: z.string(), lastName: z.string() })),
});

export type GuardianRegistration = z.infer<typeof guardianRegistrationSchema>;

export const guardianRegistrationParamsSchema = z.object({ registrationId: z.uuid() });

export type GuardianRegistrationParams = z.infer<typeof guardianRegistrationParamsSchema>;
