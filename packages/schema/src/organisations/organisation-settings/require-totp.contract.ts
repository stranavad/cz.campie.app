import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { organisationSettingsSchema } from './organisation-settings.resource.ts';

export const requireTotpBodySchema = z.object({ required: z.boolean() });

export type RequireTotpBody = z.infer<typeof requireTotpBodySchema>;

// Requires two-step login of every admin of the Organisation, or stops requiring it; a member without it
// must set it up before reaching anything else. Audited; Owners only.
export const requireTotpEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/organisation-settings/totp',
  body: requireTotpBodySchema,
  response: organisationSettingsSchema,
});
