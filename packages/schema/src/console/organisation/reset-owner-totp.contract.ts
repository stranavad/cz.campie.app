import { z } from 'zod';

import { defineEndpoint, emailSchema } from '@repo/schema/shared';

import { consoleOrganisationParamsSchema } from './console-organisation.resource.ts';

export const resetOwnerTotpBodySchema = z.object({ email: emailSchema });

export type ResetOwnerTotpBody = z.infer<typeof resetOwnerTotpBodySchema>;

// Turns a locked-out Owner's two-step login off, after the operator checked who they are outside the
// platform; audited in the Organisation's log. The console only.
export const resetOwnerTotpEndpoint = defineEndpoint({
  method: 'POST',
  path: '/console/organisations/:organisationId/owner-totp-reset',
  params: consoleOrganisationParamsSchema,
  body: resetOwnerTotpBodySchema,
});
