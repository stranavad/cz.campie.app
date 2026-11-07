import { defineEndpoint } from '@repo/schema/shared';

// Ends the guardian's session and clears its cookie.
export const endGuardianSessionEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/portal/session',
});
