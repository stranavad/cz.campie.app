import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { registrationFormVersionSchema } from './registration-form.resource.ts';

export const registrationFormVersionParamsSchema = z.object({
  campId: z.uuid(),
  version: z
    .string()
    .regex(/^[1-9]\d{0,6}$/)
    .transform(Number),
});

export type RegistrationFormVersionParams = z.infer<typeof registrationFormVersionParamsSchema>;

// One published version of a Camp's registration form, as it was; Camp settings read.
export const getRegistrationFormVersionEndpoint = defineEndpoint({
  method: 'GET',
  path: '/camps/:campId/registration-form/versions/:version',
  params: registrationFormVersionParamsSchema,
  response: registrationFormVersionSchema,
});
