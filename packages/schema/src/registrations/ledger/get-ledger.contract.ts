import { defineEndpoint } from '@repo/schema/shared';

import { ledgerSchema, registrationParamsSchema } from './ledger.resource.ts';

// A Registration's payments, Price adjustments and balance; Registrations read.
export const getLedgerEndpoint = defineEndpoint({
  method: 'GET',
  path: '/registrations/:registrationId/ledger',
  params: registrationParamsSchema,
  response: ledgerSchema,
});
