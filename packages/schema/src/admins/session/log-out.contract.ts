import { defineEndpoint } from '@repo/schema/shared';

// Ends the admin session the request carries and clears its cookie.
export const logOutEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/sessions/current',
});
