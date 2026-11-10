import { invoiceRequestBodySchema, invoiceRequestSchema } from '@repo/schema/registrations';
import { defineEndpoint } from '@repo/schema/shared';

import { guardianRegistrationParamsSchema } from '../guardian-registration/guardian-registration.resource.ts';

// Adds or replaces the Invoice request of one of the guardian's Registrations while the camp has not invoiced
// it, a new one only while the Camp offers it; audited. The amount is at most the total now.
export const saveGuardianInvoiceRequestEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/portal/registrations/:registrationId/invoice-request',
  params: guardianRegistrationParamsSchema,
  body: invoiceRequestBodySchema,
  response: invoiceRequestSchema,
});

// Removes the Invoice request of one of the guardian's Registrations while the camp has not invoiced it;
// audited.
export const removeGuardianInvoiceRequestEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/portal/registrations/:registrationId/invoice-request',
  params: guardianRegistrationParamsSchema,
});
