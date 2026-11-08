import { defineEndpoint } from '@repo/schema/shared';

// Emails the signed-in admin a new link that verifies their email, in place of any earlier one; nothing
// once it is verified.
export const requestEmailVerificationEndpoint = defineEndpoint({
  method: 'POST',
  path: '/email-verifications',
});
