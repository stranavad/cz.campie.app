import { defineEndpoint } from '@repo/schema/shared';

import { totpEnrolmentSchema } from './totp.resource.ts';

// Gives the signed-in Platform operator a new secret for their authenticator app, replacing one not yet
// confirmed. Refused once TOTP is on.
export const startTotpEnrolmentEndpoint = defineEndpoint({
  method: 'POST',
  path: '/account/totp',
  response: totpEnrolmentSchema,
});
