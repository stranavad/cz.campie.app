import { defineEndpoint } from '@repo/schema/shared';

import { registrationParamsSchema } from '../ledger/ledger.resource.ts';
import { adminInvoiceRequestBodySchema, invoiceFileSchema, invoiceRequestSchema } from './invoice-request.resource.ts';

// Adds or replaces a Registration's Invoice request, its state included, whether or not the Camp offers
// them; audited. Registrations write.
export const saveInvoiceRequestEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/registrations/:registrationId/invoice-request',
  params: registrationParamsSchema,
  body: adminInvoiceRequestBodySchema,
  response: invoiceRequestSchema,
});

// Removes a Registration's Invoice request while it holds no invoice file; audited. Registrations write.
export const removeInvoiceRequestEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/registrations/:registrationId/invoice-request',
  params: registrationParamsSchema,
});

// Adds a PDF invoice or corrective document to a Registration's Invoice request, which marks it invoiced
// today when it has no date yet. Files are only ever added; audited. Registrations write.
export const uploadInvoiceFileEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/invoice-request/files',
  params: registrationParamsSchema,
  upload: true,
  response: invoiceFileSchema,
});
